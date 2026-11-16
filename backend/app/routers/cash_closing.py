import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import CashClosing, ServiceRecord, ProductSale, Expense, User
from backend.app.schemas import CashClosingPreview, CashClosingCreate, CashClosingOut
from backend.app.auth import require_admin

router = APIRouter(prefix="/api/cash-closing", tags=["Cierre de Caja y Liquidaciones (Arqueo)"])

def compute_closing_summary(
    db: Session,
    start_date: datetime,
    end_date: datetime,
    only_unsettled: bool = True
) -> Dict[str, Any]:
    # Query service records
    q_services = db.query(ServiceRecord).filter(
        ServiceRecord.created_at >= start_date,
        ServiceRecord.created_at <= end_date
    )
    if only_unsettled:
        q_services = q_services.filter(ServiceRecord.is_settled == False)
    services = q_services.all()

    # Query product sales
    q_sales = db.query(ProductSale).filter(
        ProductSale.created_at >= start_date,
        ProductSale.created_at <= end_date
    )
    if only_unsettled:
        q_sales = q_sales.filter(ProductSale.is_settled == False)
    sales = q_sales.all()

    # Query expenses between start and end date
    d_start = start_date.date()
    d_end = end_date.date()
    expenses = db.query(Expense).filter(
        Expense.expense_date >= d_start,
        Expense.expense_date <= d_end
    ).all()

    total_cash_drawer = 0.0      # Cash collected physically by Admin / Shop
    total_digital_shop = 0.0     # Transfer to Shop account
    total_digital_barber = 0.0   # Transfer to Barber account
    total_gross_services = 0.0
    total_gross_sales = 0.0

    # Barber aggregations: barber_id -> stats
    barbers_dict: Dict[int, Dict[str, Any]] = {}

    all_barbers = db.query(User).filter(User.role == "barber").all()
    for b in all_barbers:
        barbers_dict[b.id] = {
            "barber_id": b.id,
            "barber_name": b.full_name,
            "payment_scheme": b.payment_scheme,
            "commission_percentage": b.commission_percentage,
            "fixed_rent_amount": b.fixed_rent_amount,
            "cuts_count": 0,
            "cuts_gross": 0.0,
            "cuts_barber_earnings": 0.0,
            "cuts_shop_earnings": 0.0,
            "sales_count": 0,
            "sales_gross": 0.0,
            "sales_barber_commission": 0.0,
            "sales_shop_earnings": 0.0,
            "money_held_by_barber": 0.0,     # Cash collected by barber OR Transfer to barber
            "money_held_by_shop": 0.0,       # Cash collected by admin OR Transfer to shop
            "total_barber_earnings": 0.0,
            "net_debt_amount": 0.0,
            "debtor": "even",                # "barber_owes_shop", "shop_owes_barber", "even"
            "summary_text": "Al día"
        }

    # Process services
    for s in services:
        total_gross_services += s.price
        # Physical cash drawer
        if s.payment_method == "cash":
            if s.collected_by == "admin":
                total_cash_drawer += s.price
        elif s.payment_method == "transfer_shop":
            total_digital_shop += s.price
        elif s.payment_method == "transfer_barber":
            total_digital_barber += s.price

        b_id = s.barber_id
        if b_id in barbers_dict:
            b_data = barbers_dict[b_id]
            b_data["cuts_count"] += 1
            b_data["cuts_gross"] += s.price
            b_data["cuts_barber_earnings"] += s.barber_earnings
            b_data["cuts_shop_earnings"] += s.shop_earnings

            # Track who physically held the money
            if s.collected_by == "barber" or s.payment_method == "transfer_barber":
                b_data["money_held_by_barber"] += s.price
            else:
                b_data["money_held_by_shop"] += s.price

    # Process product sales
    for sl in sales:
        total_gross_sales += sl.total_amount
        if sl.payment_method == "cash":
            if sl.collected_by == "admin":
                total_cash_drawer += sl.total_amount
        elif sl.payment_method == "transfer_shop":
            total_digital_shop += sl.total_amount
        elif sl.payment_method == "transfer_barber":
            total_digital_barber += sl.total_amount

        b_id = sl.barber_id
        if b_id and b_id in barbers_dict:
            b_data = barbers_dict[b_id]
            b_data["sales_count"] += 1
            b_data["sales_gross"] += sl.total_amount
            b_data["sales_barber_commission"] += sl.barber_commission_amount
            b_data["sales_shop_earnings"] += sl.shop_earnings

            if sl.collected_by == "barber" or sl.payment_method == "transfer_barber":
                b_data["money_held_by_barber"] += sl.total_amount
            else:
                b_data["money_held_by_shop"] += sl.total_amount

    # Compute final earnings and debtor status per barber
    total_barber_payouts = 0.0
    active_barber_summaries = []

    for b_id, b_data in barbers_dict.items():
        total_earnings = b_data["cuts_barber_earnings"] + b_data["sales_barber_commission"]
        b_data["total_barber_earnings"] = total_earnings
        total_barber_payouts += total_earnings

        diff = b_data["money_held_by_barber"] - total_earnings
        if diff > 0.01:
            b_data["debtor"] = "barber_owes_shop"
            b_data["net_debt_amount"] = diff
            b_data["summary_text"] = f"{b_data['barber_name']} debe entregar ${diff:,.0f} ARS a la barbería"
        elif diff < -0.01:
            debt = abs(diff)
            b_data["debtor"] = "shop_owes_barber"
            b_data["net_debt_amount"] = debt
            b_data["summary_text"] = f"La barbería debe pagar ${debt:,.0f} ARS a {b_data['barber_name']}"
        else:
            b_data["debtor"] = "even"
            b_data["net_debt_amount"] = 0.0
            b_data["summary_text"] = f"{b_data['barber_name']} está al día ($0 saldo)"

        # Only include barbers that had activity or fixed rent
        if b_data["cuts_count"] > 0 or b_data["sales_count"] > 0:
            active_barber_summaries.append(b_data)

    total_gross_revenue = total_gross_services + total_gross_sales

    total_fixed_expenses = sum(e.amount for e in expenses if e.category == "fixed")
    total_variable_expenses = sum(e.amount for e in expenses if e.category == "variable")
    total_all_expenses = total_fixed_expenses + total_variable_expenses

    # Net Admin Profit = Gross Revenue - Barber Payouts - Expenses
    net_admin_profit = total_gross_revenue - total_barber_payouts - total_all_expenses

    return {
        "start_date": start_date,
        "end_date": end_date,
        "services_count": len(services),
        "sales_count": len(sales),
        "total_cash_drawer": total_cash_drawer,
        "total_digital_shop": total_digital_shop,
        "total_digital_barber": total_digital_barber,
        "total_gross_revenue": total_gross_revenue,
        "total_barber_payouts": total_barber_payouts,
        "total_fixed_expenses": total_fixed_expenses,
        "total_variable_expenses": total_variable_expenses,
        "net_admin_profit": net_admin_profit,
        "barber_summaries": active_barber_summaries,
        "unsettled_service_ids": [s.id for s in services],
        "unsettled_sale_ids": [sl.id for sl in sales],
    }

@router.get("/preview", response_model=CashClosingPreview)
def preview_cash_closing(
    start_date: Optional[str] = None,  # YYYY-MM-DD
    end_date: Optional[str] = None,    # YYYY-MM-DD
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if start_date:
        dt_start = datetime.strptime(f"{start_date} 00:00:00", "%Y-%m-%d %H:%M:%S")
    else:
        # Default start: today at 00:00
        dt_start = datetime.combine(date.today(), datetime.min.time())

    if end_date:
        dt_end = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
    else:
        dt_end = datetime.utcnow()

    summary = compute_closing_summary(db, dt_start, dt_end, only_unsettled=True)
    return summary

@router.post("/close", response_model=CashClosingOut, status_code=status.HTTP_201_CREATED)
def execute_cash_closing(
    closing_in: CashClosingCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    summary = compute_closing_summary(db, closing_in.start_date, closing_in.end_date, only_unsettled=True)

    details_payload = {
        "barber_summaries": summary["barber_summaries"],
        "services_count": summary["services_count"],
        "sales_count": summary["sales_count"],
        "total_cash_drawer": summary["total_cash_drawer"],
        "total_digital_shop": summary["total_digital_shop"],
        "total_digital_barber": summary["total_digital_barber"],
    }

    closing = CashClosing(
        closed_by_id=admin.id,
        period_type=closing_in.period_type,
        start_date=closing_in.start_date,
        end_date=closing_in.end_date,
        total_cash_drawer=summary["total_cash_drawer"],
        total_digital_shop=summary["total_digital_shop"],
        total_digital_barber=summary["total_digital_barber"],
        total_gross_revenue=summary["total_gross_revenue"],
        total_barber_payouts=summary["total_barber_payouts"],
        total_fixed_expenses=summary["total_fixed_expenses"],
        total_variable_expenses=summary["total_variable_expenses"],
        net_admin_profit=summary["net_admin_profit"],
        details_json=json.dumps(details_payload, ensure_ascii=False),
        notes=closing_in.notes
    )
    db.add(closing)
    db.flush()

    # Mark all included service records as settled
    if summary["unsettled_service_ids"]:
        db.query(ServiceRecord).filter(
            ServiceRecord.id.in_(summary["unsettled_service_ids"])
        ).update({
            ServiceRecord.is_settled: True,
            ServiceRecord.settlement_id: closing.id
        }, synchronize_session=False)

    # Mark all included product sales as settled
    if summary["unsettled_sale_ids"]:
        db.query(ProductSale).filter(
            ProductSale.id.in_(summary["unsettled_sale_ids"])
        ).update({
            ProductSale.is_settled: True,
            ProductSale.settlement_id: closing.id
        }, synchronize_session=False)

    db.commit()
    db.refresh(closing)

    out = CashClosingOut.model_validate(closing)
    out.closed_by_name = admin.full_name
    return out

@router.get("/history", response_model=List[CashClosingOut])
def list_closings_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    closings = db.query(CashClosing).order_by(CashClosing.created_at.desc()).limit(limit).all()
    out = []
    for c in closings:
        item = CashClosingOut.model_validate(c)
        item.closed_by_name = c.closed_by.full_name if c.closed_by else "Admin"
        out.append(item)
    return out

@router.get("/{closing_id}", response_model=CashClosingOut)
def get_closing_detail(
    closing_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    c = db.query(CashClosing).filter(CashClosing.id == closing_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cierre de caja no encontrado")
    item = CashClosingOut.model_validate(c)
    item.closed_by_name = c.closed_by.full_name if c.closed_by else "Admin"
    return item

