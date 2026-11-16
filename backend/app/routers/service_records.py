import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import ServiceRecord, Service, User, Customer, Product, LoyaltyTransaction, SystemSetting
from backend.app.schemas import ServiceRecordCreate, ServiceRecordOut
from backend.app.auth import require_barber_or_admin, require_admin, get_current_user
from backend.app.utils import phones_match

router = APIRouter(prefix="/api/service-records", tags=["Registro de Cortes (Core CRM)"])

def calculate_who_owes_whom(collected_by: str, payment_method: str, barber_earnings: float, shop_earnings: float, barber_name: str) -> str:
    if barber_earnings == 0 and shop_earnings == 0:
        return "Corte Bonificado (Canje Puntos)"
    # If collected by barber (Cash or Transfer to Barber's account)
    if collected_by == "barber" or payment_method == "transfer_barber":
        if shop_earnings > 0:
            return f"{barber_name} debe a la barbería ${shop_earnings:,.0f} ARS"
        else:
            return "Alquiler fijo - Sin deuda por corte"
    # If collected by admin or Transfer to BarberShop
    else:
        if barber_earnings > 0:
            return f"La barbería debe a {barber_name} ${barber_earnings:,.0f} ARS"
        else:
            return "Cobrado por la barbería"

@router.post("", response_model=ServiceRecordOut, status_code=status.HTTP_201_CREATED)
def record_service_cut(
    record_in: ServiceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    # Enforce barber role isolation: a barber can only record cuts for themselves
    if current_user.role == "barber" and record_in.barber_id != current_user.id:
        record_in.barber_id = current_user.id

    # Validate barber
    barber = db.query(User).filter(User.id == record_in.barber_id, User.is_active == True).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barbero no encontrado o inactivo")

    # Validate service
    service = db.query(Service).filter(Service.id == record_in.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado o inactivo")

    # Validate collection authorization: if barber collected, check if enabled
    if record_in.collected_by == "barber" or record_in.payment_method == "transfer_barber":
        allow_barber_coll = db.query(SystemSetting).filter(SystemSetting.key == "allow_barber_collection").first()
        is_allowed = allow_barber_coll.value.lower() == "true" if allow_barber_coll else False
        if not is_allowed and current_user.role != "admin":
            raise HTTPException(
                status_code=400,
                detail="El cobro directo por transferencia al barbero está deshabilitado por la administración. Selecciona cobro de la casa o en efectivo."
            )

    # Auto-deduct internal supplies if configured in service
    if service.auto_deduct_supplies_json:
        try:
            supplies_to_deduct = json.loads(service.auto_deduct_supplies_json)
            for item in supplies_to_deduct:
                sup_id = item.get("supply_id")
                qty = item.get("quantity", 1)
                if sup_id:
                    supply_prod = db.query(Product).filter(Product.id == sup_id).first()
                    if supply_prod and supply_prod.stock_quantity is not None:
                        supply_prod.stock_quantity = max(0, supply_prod.stock_quantity - qty)
        except Exception:
            pass  # Suppress JSON parsing errors if misconfigured

    # Customer handling
    customer_id = record_in.customer_id
    if not customer_id and (record_in.customer_phone or record_in.customer_dni):
        # Look up existing customer by normalized phone or dni
        all_customers = db.query(Customer).all()
        existing_c = None
        for c in all_customers:
            if record_in.customer_phone and phones_match(c.phone, record_in.customer_phone):
                existing_c = c
                break
            if record_in.customer_dni and c.dni and record_in.customer_dni.strip() == c.dni.strip():
                existing_c = c
                break

        if existing_c:
            customer_id = existing_c.id
            if record_in.customer_name and (not existing_c.full_name or existing_c.full_name == "Cliente"):
                existing_c.full_name = record_in.customer_name.strip()
        else:
            # Create new customer
            new_c = Customer(
                full_name=record_in.customer_name.strip() if record_in.customer_name else "Cliente",
                phone=record_in.customer_phone.strip() if record_in.customer_phone else "S/T",
                dni=record_in.customer_dni.strip() if record_in.customer_dni else None,
                loyalty_points=0
            )
            db.add(new_c)
            db.flush()
            customer_id = new_c.id

    # Check Free Cut Redemption vs Normal Payment
    is_free_cut = bool(record_in.redeem_free_cut)
    barber_payout_scheme = barber.payment_scheme or "commission"

    if is_free_cut:
        if not customer_id:
            raise HTTPException(status_code=400, detail="Debes seleccionar un cliente para poder aplicar el canje de corte gratis.")
        
        free_cut_points_setting = db.query(SystemSetting).filter(SystemSetting.key == "points_for_free_cut").first()
        try:
            required_points = int(free_cut_points_setting.value) if free_cut_points_setting else 50
        except Exception:
            required_points = 50

        cust = db.query(Customer).filter(Customer.id == customer_id).first()
        if not cust or cust.loyalty_points < required_points:
            raise HTTPException(
                status_code=400,
                detail=f"El cliente no tiene los {required_points} puntos requeridos para el corte gratis (saldo actual: {cust.loyalty_points if cust else 0} pts)."
            )

        # Deduct loyalty points from customer
        cust.loyalty_points -= required_points
        tx = LoyaltyTransaction(
            customer_id=customer_id,
            points_change=-required_points,
            reason=f"Canje de Puntos: Corte Gratis ({service.name})",
            reference_id=f"free_cut_{service.id}"
        )
        db.add(tx)

        price = 0.0
        barber_earnings = 0.0
        shop_earnings = 0.0
        rate = 0.0
        points_awarded = 0
        final_notes = f"[Corte Gratis por Canje de {required_points} pts] " + (record_in.notes or "")
    else:
        # Price override: ONLY admin can apply a custom discount / special price
        if current_user.role == "admin" and record_in.price_override is not None:
            price = record_in.price_override
        else:
            price = service.price

        # Calculate earnings based on barber's scheme
        if barber_payout_scheme == "commission":
            rate = barber.commission_percentage
            barber_earnings = price * (rate / 100.0)
            shop_earnings = price - barber_earnings
        else:
            rate = 0.0
            barber_earnings = price
            shop_earnings = 0.0

        # Normal Loyalty points calculation
        points_setting = db.query(SystemSetting).filter(SystemSetting.key == "points_per_cut").first()
        try:
            points_awarded = int(points_setting.value) if points_setting else 10
        except (ValueError, TypeError):
            points_awarded = 10

        if customer_id and points_awarded > 0:
            cust = db.query(Customer).filter(Customer.id == customer_id).first()
            if cust:
                cust.loyalty_points += points_awarded
                tx = LoyaltyTransaction(
                    customer_id=customer_id,
                    points_change=points_awarded,
                    reason=f"Corte: {service.name}",
                    reference_id=f"service_{service.id}"
                )
                db.add(tx)

        final_notes = record_in.notes

    # Create service record
    new_record = ServiceRecord(
        service_id=service.id,
        barber_id=barber.id,
        customer_id=customer_id,
        price=price,
        duration_minutes=service.duration_minutes,
        collected_by=record_in.collected_by,
        payment_method=record_in.payment_method,
        barber_payout_scheme=barber_payout_scheme,
        barber_rate=rate,
        barber_earnings=barber_earnings,
        shop_earnings=shop_earnings,
        loyalty_points_awarded=points_awarded,
        notes=final_notes,
        is_settled=False,
        created_at=datetime.utcnow()
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    # Build response model
    out = ServiceRecordOut.model_validate(new_record)
    out.service_name = service.name
    out.barber_name = barber.full_name
    if new_record.customer:
        out.customer_name = new_record.customer.full_name
        out.customer_phone = new_record.customer.phone
    out.who_owes_whom = calculate_who_owes_whom(
        new_record.collected_by, new_record.payment_method, barber_earnings, shop_earnings, barber.full_name
    )
    return out

@router.get("", response_model=List[ServiceRecordOut])
def list_service_records(
    barber_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    is_settled: Optional[bool] = None,
    date_from: Optional[str] = None,  # YYYY-MM-DD
    date_to: Optional[str] = None,    # YYYY-MM-DD
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    query = db.query(ServiceRecord)

    # Barber role can ONLY see their own records
    if current_user.role == "barber":
        query = query.filter(ServiceRecord.barber_id == current_user.id)
    elif barber_id is not None:
        query = query.filter(ServiceRecord.barber_id == barber_id)

    if customer_id is not None:
        query = query.filter(ServiceRecord.customer_id == customer_id)
    if is_settled is not None:
        query = query.filter(ServiceRecord.is_settled == is_settled)

    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(ServiceRecord.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.strptime(f"{date_to} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(ServiceRecord.created_at <= dt_to)
        except ValueError:
            pass

    records = query.order_by(ServiceRecord.created_at.desc()).limit(limit).all()

    results = []
    for r in records:
        item = ServiceRecordOut.model_validate(r)
        item.service_name = r.service.name if r.service else "Servicio"
        item.barber_name = r.barber.full_name if r.barber else "Barbero"
        if r.customer:
            item.customer_name = r.customer.full_name
            item.customer_phone = r.customer.phone
        item.who_owes_whom = calculate_who_owes_whom(
            r.collected_by, r.payment_method, r.barber_earnings, r.shop_earnings, item.barber_name
        )
        results.append(item)
    return results

@router.delete("/{record_id}")
def delete_service_record(
    record_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    record = db.query(ServiceRecord).filter(ServiceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro de corte no encontrado")
    if record.is_settled:
        raise HTTPException(status_code=400, detail="No se puede eliminar un registro ya liquidado en un cierre de caja")
    db.delete(record)
    db.commit()
    return {"message": "Registro eliminado exitosamente"}
