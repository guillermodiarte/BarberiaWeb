from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Product, User
from backend.app.schemas import ProductCreate, ProductUpdate, ProductOut, StockAdjustment
from backend.app.auth import require_admin, require_barber_or_admin

router = APIRouter(prefix="/api/inventory", tags=["Inventario y Stock"])

@router.get("", response_model=List[ProductOut])
def list_products(
    category: Optional[str] = Query(None, description="'resale' o 'internal_supply'"),
    include_inactive: bool = False,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    if not include_inactive:
        query = query.filter(Product.is_active == True)
    if low_stock_only:
        query = query.filter(Product.stock_quantity <= Product.min_stock_alert)

    return query.order_by(Product.name.asc()).all()

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_barber_or_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = Product(
        name=product_in.name,
        description=product_in.description,
        category=product_in.category,
        cost_price=product_in.cost_price,
        sale_price=product_in.sale_price,
        stock_quantity=product_in.stock_quantity,
        min_stock_alert=product_in.min_stock_alert,
        unit=product_in.unit,
        barber_commission_percentage=product_in.barber_commission_percentage,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product

@router.post("/{product_id}/adjust-stock", response_model=ProductOut)
def adjust_stock(
    product_id: int,
    adj_in: StockAdjustment,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    new_qty = product.stock_quantity + adj_in.quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Stock actual: {product.stock_quantity}")

    product.stock_quantity = new_qty
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.is_active = False
    db.commit()
    return {"message": f"Producto '{product.name}' desactivado"}

