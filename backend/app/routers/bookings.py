from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Booking, Service, User, SystemSetting
from backend.app.schemas import BookingCreate, BookingStatusUpdate, BookingOut
from backend.app.auth import require_barber_or_admin, require_admin

router = APIRouter(prefix="/api/bookings", tags=["Reservas y Turnos Online"])

@router.post("/public", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_public_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db)
):
    # Check if online bookings are enabled
    switch_setting = db.query(SystemSetting).filter(SystemSetting.key == "online_booking_enabled").first()
    if switch_setting and switch_setting.value.lower() == "false":
        raise HTTPException(
            status_code=400,
            detail="El sistema de turnos online está pausado temporalmente por la barbería. Por favor contáctanos por WhatsApp."
        )

    # Validate service
    service = db.query(Service).filter(Service.id == booking_in.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="El servicio seleccionado no está disponible")

    # Validate barber if specified
    barber_name = None
    if booking_in.barber_id:
        barber = db.query(User).filter(User.id == booking_in.barber_id, User.is_active == True).first()
        if not barber:
            raise HTTPException(status_code=404, detail="El barbero seleccionado no está disponible")
        barber_name = barber.full_name

    # Check deposit requirements
    deposit_req_setting = db.query(SystemSetting).filter(SystemSetting.key == "booking_deposit_required").first()
    deposit_amt_setting = db.query(SystemSetting).filter(SystemSetting.key == "booking_deposit_amount").first()

    deposit_required = deposit_req_setting.value.lower() == "true" if deposit_req_setting else False
    try:
        deposit_amount = float(deposit_amt_setting.value) if deposit_amt_setting else 2000.0
    except ValueError:
        deposit_amount = 2000.0

    booking = Booking(
        customer_name=booking_in.customer_name.strip(),
        customer_phone=booking_in.customer_phone.strip(),
        customer_email=booking_in.customer_email.strip() if booking_in.customer_email else None,
        service_id=service.id,
        barber_id=booking_in.barber_id,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        status="pending",
        deposit_amount=deposit_amount if deposit_required else 0.0,
        payment_status="unpaid",
        notes=booking_in.notes
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    out = BookingOut.model_validate(booking)
    out.service_name = service.name
    out.service_price = service.price
    out.barber_name = barber_name or "Cualquier barbero disponible"
    return out

@router.get("", response_model=List[BookingOut])
def list_bookings(
    status_filter: Optional[str] = None,
    barber_id: Optional[int] = None,
    date_filter: Optional[str] = None,  # YYYY-MM-DD
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    query = db.query(Booking)

    # Barber only sees bookings assigned to them (or unassigned pending ones)
    if current_user.role == "barber":
        query = query.filter((Booking.barber_id == current_user.id) | (Booking.barber_id == None))
    elif barber_id is not None:
        query = query.filter(Booking.barber_id == barber_id)

    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if date_filter:
        query = query.filter(Booking.booking_date == date_filter)

    bookings = query.order_by(Booking.booking_date.desc(), Booking.start_time.asc()).limit(limit).all()

    results = []
    for b in bookings:
        item = BookingOut.model_validate(b)
        item.service_name = b.service.name if b.service else "Servicio"
        item.service_price = b.service.price if b.service else 0.0
        item.barber_name = b.barber.full_name if b.barber else "Sin asignar"
        results.append(item)
    return results

@router.put("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    status_in: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    if status_in.status is not None:
        booking.status = status_in.status
    if status_in.payment_status is not None:
        booking.payment_status = status_in.payment_status
    if status_in.deposit_amount is not None:
        booking.deposit_amount = status_in.deposit_amount

    db.commit()
    db.refresh(booking)

    item = BookingOut.model_validate(booking)
    item.service_name = booking.service.name if booking.service else "Servicio"
    item.service_price = booking.service.price if booking.service else 0.0
    item.barber_name = booking.barber.full_name if booking.barber else "Sin asignar"
    return item

@router.delete("/{booking_id}")
def cancel_or_delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    db.delete(booking)
    db.commit()
    return {"message": "Turno cancelado y eliminado"}

