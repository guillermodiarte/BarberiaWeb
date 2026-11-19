from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import UserCreate, UserUpdate, UserOut
from backend.app.auth import require_admin, get_password_hash, get_current_user

router = APIRouter(prefix="/api/barbers", tags=["Barberos y Esquemas"])

@router.get("", response_model=List[UserOut])
def list_barbers(
    include_inactive: bool = False,
    include_admins: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    if include_admins and current_user:
        if current_user.role == "superadmin":
            # Superadmin ve a todos: barberos, admins y su propia cuenta superadmin
            allowed_roles = ["barber", "admin", "superadmin"]
        else:
            # Admin solo ve barberos y otros admins (nunca superadmin)
            allowed_roles = ["barber", "admin"]
        query = db.query(User).filter(User.role.in_(allowed_roles))
    else:
        query = db.query(User).filter(User.role == "barber")
    if not include_inactive:
        query = query.filter(User.is_active == True)
    return query.order_by(User.full_name.asc()).all()

@router.get("/public")
def list_barbers_public(db: Session = Depends(get_db)):
    """List of active barbers for public booking selection"""
    barbers = db.query(User).filter(User.role == "barber", User.is_active == True).all()
    return [{"id": b.id, "full_name": b.full_name} for b in barbers]

@router.get("/{barber_id}", response_model=UserOut)
def get_barber(barber_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    barber = db.query(User).filter(User.id == barber_id, User.role == "barber").first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    return barber

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_barber(
    barber_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == barber_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario registrado con este correo")

    assigned_role = barber_in.role if barber_in.role in ["barber", "admin"] else "barber"
    # Solo superadmin puede crear otros admins; un admin crea barberos
    if assigned_role == "admin" and admin.role not in ["admin", "superadmin"]:
        assigned_role = "barber"

    barber = User(
        email=barber_in.email.lower().strip(),
        full_name=barber_in.full_name,
        phone=barber_in.phone,
        hashed_password=get_password_hash(barber_in.password),
        role=assigned_role,
        is_active=True,
        payment_scheme=barber_in.payment_scheme,
        commission_percentage=barber_in.commission_percentage,
        fixed_rent_amount=barber_in.fixed_rent_amount,
        fixed_rent_period=barber_in.fixed_rent_period,
        payout_frequency=barber_in.payout_frequency or "daily"
    )
    db.add(barber)
    db.commit()
    db.refresh(barber)
    return barber

@router.put("/{barber_id}", response_model=UserOut)
def update_barber(
    barber_id: int,
    barber_in: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    barber = db.query(User).filter(User.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    update_data = barber_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        barber.hashed_password = get_password_hash(update_data.pop("password"))
    if "email" in update_data and update_data["email"]:
        barber.email = update_data["email"].lower().strip()

    for field, value in update_data.items():
        setattr(barber, field, value)

    db.commit()
    db.refresh(barber)
    return barber

@router.delete("/{barber_id}")
def toggle_or_delete_barber(
    barber_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    barber = db.query(User).filter(User.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    if barber.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta de administrador")

    # Soft deactivate/toggle
    barber.is_active = not barber.is_active
    db.commit()
    estado = "activado" if barber.is_active else "suspendido/desactivado"
    return {"message": f"Barbero {barber.full_name} ha sido {estado}", "is_active": barber.is_active}


@router.delete("/{barber_id}/hard-delete")
def hard_delete_barber(
    barber_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Elimina permanentemente una cuenta suspendida. No aplica a SuperAdmin."""
    from backend.app.models import ServiceRecord, ProductSale, Booking, CashClosing

    barber = db.query(User).filter(User.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if barber.role == "superadmin":
        raise HTTPException(status_code=403, detail="No se puede eliminar la cuenta del SuperAdmin")
    if barber.is_active:
        raise HTTPException(status_code=400, detail="La cuenta debe estar suspendida antes de poder eliminarla")

    # Verificar si tiene registros de cortes (barber_id NOT NULL en service_records)
    record_count = db.query(ServiceRecord).filter(ServiceRecord.barber_id == barber_id).count()
    if record_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar: el usuario tiene {record_count} registros de cortes asociados. La cuenta puede mantenerse suspendida."
        )

    # Anular referencias opcionales en otras tablas
    db.query(ProductSale).filter(ProductSale.barber_id == barber_id).update({"barber_id": None})
    db.query(Booking).filter(Booking.barber_id == barber_id).update({"barber_id": None})
    db.query(CashClosing).filter(CashClosing.barber_id == barber_id).update({"barber_id": None})
    db.query(CashClosing).filter(CashClosing.closed_by_id == barber_id).update({"closed_by_id": admin.id})

    nombre = barber.full_name
    db.delete(barber)
    db.commit()
    return {"message": f"Usuario {nombre} eliminado permanentemente del sistema"}

