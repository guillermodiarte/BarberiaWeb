from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import ProductSale, Product, User, Customer, LoyaltyTransaction
from backend.app.schemas import ProductSaleCreate, ProductSaleOut
from backend.app.auth import require_barber_or_admin, require_admin

router = APIRouter(prefix="/api/product-sales", tags=["Ventas de Productos de Reventa"])

@router.post("", response_model=ProductSaleOut, status_code=status.HTTP_201_CREATED)
def record_product_sale(
    sale_in: ProductSaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    # Check product
    product = db.query(Product).filter(Product.id == sale_in.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o inactivo")
    if product.category != "resale":
        raise HTTPException(status_code=400, detail="Este ítem es un insumo interno, no un producto de reventa")
    if product.stock_quantity < sale_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente para {product.name}. Stock disponible: {product.stock_quantity}"
        )

    # Determine barber
    barber_id = sale_in.barber_id
    if current_user.role == "barber":
        barber_id = current_user.id

    barber = None
    if barber_id:
        barber = db.query(User).filter(User.id == barber_id, User.is_active == True).first()

    unit_price = product.sale_price
    total_amount = unit_price * sale_in.quantity

    # Calculate barber commission
    if barber:
        comm_pct = product.barber_commission_percentage
        comm_amt = total_amount * (comm_pct / 100.0)
    else:
        comm_pct = 0.0
        comm_amt = 0.0

    shop_earnings = total_amount - comm_amt

    # Deduct stock
    product.stock_quantity -= sale_in.quantity

    # Customer loyalty points
    customer_id = sale_in.customer_id
    if not customer_id and sale_in.customer_phone:
        existing_c = db.query(Customer).filter(Customer.phone == sale_in.customer_phone.strip()).first()
        if existing_c:
            customer_id = existing_c.id

    points_awarded = int(total_amount / 100) if total_amount >= 100 else 0
    if customer_id and points_awarded > 0:
        cust = db.query(Customer).filter(Customer.id == customer_id).first()
        if cust:
            cust.loyalty_points += points_awarded
            tx = LoyaltyTransaction(
                customer_id=customer_id,
                points_change=points_awarded,
                reason=f"Compra: {product.name} x{sale_in.quantity}",
                reference_id=f"sale_{product.id}"
            )
            db.add(tx)

    sale = ProductSale(
        product_id=product.id,
        barber_id=barber.id if barber else None,
        customer_id=customer_id,
        quantity=sale_in.quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        collected_by=sale_in.collected_by,
        payment_method=sale_in.payment_method,
        barber_commission_percentage=comm_pct,
        barber_commission_amount=comm_amt,
        shop_earnings=shop_earnings,
        loyalty_points_awarded=points_awarded,
        notes=sale_in.notes,
        is_settled=False,
        created_at=datetime.utcnow()
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)

    out = ProductSaleOut.model_validate(sale)
    out.product_name = product.name
    out.barber_name = barber.full_name if barber else "Administración / Directo"
    if sale.customer:
        out.customer_name = sale.customer.full_name
    return out

@router.get("", response_model=List[ProductSaleOut])
def list_product_sales(
    barber_id: Optional[int] = None,
    is_settled: Optional[bool] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    query = db.query(ProductSale)
    if current_user.role == "barber":
        query = query.filter(ProductSale.barber_id == current_user.id)
    elif barber_id is not None:
        query = query.filter(ProductSale.barber_id == barber_id)

    if is_settled is not None:
        query = query.filter(ProductSale.is_settled == is_settled)

    sales = query.order_by(ProductSale.created_at.desc()).limit(limit).all()
    results = []
    for s in sales:
        item = ProductSaleOut.model_validate(s)
        item.product_name = s.product.name if s.product else "Producto"
        item.barber_name = s.barber.full_name if s.barber else "Administración"
        if s.customer:
            item.customer_name = s.customer.full_name
        results.append(item)
    return results

@router.delete("/{sale_id}")
def delete_product_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    sale = db.query(ProductSale).filter(ProductSale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if sale.is_settled:
        raise HTTPException(status_code=400, detail="No se puede anular una venta ya liquidada en cierre de caja")

    # Restore stock
    if sale.product:
        sale.product.stock_quantity += sale.quantity

    db.delete(sale)
    db.commit()
    return {"message": "Venta anulada y stock devuelto"}

