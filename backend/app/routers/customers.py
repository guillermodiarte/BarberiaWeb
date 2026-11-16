import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import get_db
from backend.app.models import Customer, LoyaltyTransaction, User
from backend.app.schemas import CustomerCreate, CustomerUpdate, CustomerOut, LoyaltyTransactionOut
from backend.app.auth import require_barber_or_admin, require_admin
from backend.app.utils import matches_customer_search, phones_match, normalize_phone

router = APIRouter(prefix="/api/customers", tags=["Clientes y Fidelización"])

@router.get("", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = Query(None, description="Buscar por nombre, teléfono o DNI (inteligente con acentos y formatos)"),
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    all_customers = db.query(Customer).order_by(Customer.loyalty_points.desc(), Customer.full_name.asc()).all()
    for c in all_customers:
        c.cuts_count = len(c.service_records) if c.service_records else 0
        c.last_visit = max([r.created_at for r in c.service_records], default=None) if c.service_records else None

    # Handle search string safely
    search_str = search if isinstance(search, str) else None
    if not search_str or not search_str.strip():
        return all_customers[:limit]

    search_query = search_str.strip()
    filtered = [c for c in all_customers if matches_customer_search(c, search_query)]
    return filtered[:limit]

@router.get("/lookup")
def lookup_customer_by_phone_or_dni(
    query: str,
    db: Session = Depends(get_db)
):
    """Fast lookup for client to check their points balance"""
    q_str = query.strip()
    q_digits = re.sub(r"\D", "", q_str)
    all_custs = db.query(Customer).all()
    
    found = None
    for c in all_custs:
        if phones_match(c.phone, q_str):
            found = c
            break
        if c.dni and q_digits and re.sub(r"\D", "", c.dni) == q_digits:
            found = c
            break

    if not found:
        raise HTTPException(status_code=404, detail="Cliente no encontrado con ese teléfono o DNI")

    return {
        "id": found.id,
        "full_name": found.full_name,
        "phone": found.phone,
        "dni": found.dni,
        "loyalty_points": found.loyalty_points
    }

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_barber_or_admin)):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cust.cuts_count = len(cust.service_records) if cust.service_records else 0
    cust.last_visit = max([r.created_at for r in cust.service_records], default=None) if cust.service_records else None
    return cust

@router.get("/{customer_id}/history", response_model=List[LoyaltyTransactionOut])
def get_customer_points_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db.query(LoyaltyTransaction).filter(
        LoyaltyTransaction.customer_id == customer_id
    ).order_by(LoyaltyTransaction.created_at.desc()).all()

@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    cust_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    # Check phone uniqueness using intelligent normalization (e.g. 3513146924 vs +5493513146924)
    all_custs = db.query(Customer).all()
    for existing in all_custs:
        if phones_match(existing.phone, cust_in.phone):
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cliente con este número de teléfono: '{existing.full_name}' ({existing.phone})"
            )

    customer = Customer(
        full_name=cust_in.full_name.strip(),
        phone=cust_in.phone.strip(),
        dni=cust_in.dni.strip() if cust_in.dni else None,
        email=cust_in.email.strip() if cust_in.email else None,
        notes=cust_in.notes,
        loyalty_points=0
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    cust_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cust_in.phone and cust_in.phone.strip() != customer.phone:
        all_custs = db.query(Customer).filter(Customer.id != customer_id).all()
        for existing in all_custs:
            if phones_match(existing.phone, cust_in.phone):
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya existe otro cliente con este número de teléfono: '{existing.full_name}' ({existing.phone})"
                )

    if cust_in.full_name is not None:
        customer.full_name = cust_in.full_name.strip()
    if cust_in.phone is not None:
        customer.phone = cust_in.phone.strip()
    if cust_in.dni is not None:
        customer.dni = cust_in.dni.strip() if cust_in.dni else None
    if cust_in.email is not None:
        customer.email = cust_in.email.strip() if cust_in.email else None
    if cust_in.notes is not None:
        customer.notes = cust_in.notes
    if cust_in.loyalty_points is not None:
        if current_user.role == "admin":
            customer.loyalty_points = max(0, cust_in.loyalty_points)

    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.delete(customer)
    db.commit()
    return {"message": "Cliente eliminado correctamente"}
