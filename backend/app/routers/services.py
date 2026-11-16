import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Service, User
from backend.app.schemas import ServiceCreate, ServiceUpdate, ServiceOut, MassPriceUpdate
from backend.app.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/services", tags=["Servicios y Combos"])

@router.get("", response_model=List[ServiceOut])
def list_services(
    include_inactive: bool = Query(False, description="Incluir servicios inactivos (solo admin)"),
    combos_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service)
    if not include_inactive:
        query = query.filter(Service.is_active == True)
    if combos_only is not None:
        query = query.filter(Service.is_combo == combos_only)
    return query.order_by(Service.price.asc()).all()

@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service

@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = Service(
        name=service_in.name,
        description=service_in.description,
        duration_minutes=service_in.duration_minutes,
        price=service_in.price,
        is_combo=service_in.is_combo,
        combo_items_json=service_in.combo_items_json,
        auto_deduct_supplies_json=service_in.auto_deduct_supplies_json,
        is_active=True
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    update_data = service_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    # Soft delete
    service.is_active = False
    db.commit()
    return {"message": f"Servicio '{service.name}' desactivado exitosamente"}

@router.post("/mass-update-price")
def mass_update_prices(
    mass_in: MassPriceUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Actualización masiva de tarifas para combatir la inflación en ARS.
    Ejemplo: percentage: 15.0 (+15%), round_to: 100 (redondea a centenas de ARS).
    """
    query = db.query(Service).filter(Service.is_active == True)
    if mass_in.service_ids and len(mass_in.service_ids) > 0:
        query = query.filter(Service.id.in_(mass_in.service_ids))

    services = query.all()
    if not services:
        return {"updated_count": 0, "message": "No se encontraron servicios para actualizar"}

    multiplier = 1.0 + (mass_in.percentage / 100.0)
    round_base = mass_in.round_to if mass_in.round_to > 0 else 1

    updated_list = []
    for s in services:
        old_price = s.price
        new_price_raw = old_price * multiplier
        # Round to specified base (e.g. nearest 100 ARS)
        new_price = round(new_price_raw / round_base) * round_base
        s.price = float(new_price)
        updated_list.append({
            "id": s.id,
            "name": s.name,
            "old_price": old_price,
            "new_price": s.price
        })

    db.commit()
    return {
        "updated_count": len(updated_list),
        "percentage_applied": mass_in.percentage,
        "round_to": mass_in.round_to,
        "services": updated_list
    }

