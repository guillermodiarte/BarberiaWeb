import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import CashClosing, ServiceRecord, ProductSale, Expense, User
from backend.app.schemas import CashClosingPreview, CashClosingCreate, CashClosingOut
from backend.app.auth import require_admin

router = APIRouter(prefix="/api/cash-closing", tags=["Control de Caja y Liquidaciones"])

def compute_closing_summary(
    db: Session,
    start_date: datetime,
    end_date: datetime,
    barber_id: Optional[int] = None,
    only_unsettled: bool = True
) -> Dict[str, Any]:
    # Query service records
    q_services = db.query(ServiceRecord).filter(
        ServiceRecord.created_at >= start_date,
        ServiceRecord.created_at <= end_date
    )
    if only_unsettled:
        q_services = q_services.filter(ServiceRecord.is_settled == False)
    if barber_id:
        q_services = q_services.filter(ServiceRecord.barber_id == barber_id)
    services = q_services.all()

    # Query product sales
    q_sales = db.query(ProductSale).filter(
        ProductSale.created_at >= start_date,
        ProductSale.created_at <= end_date
    )
    if only_unsettled:
        q_sales = q_sales.filter(ProductSale.is_settled == False)
    if barber_id:
        q_sales = q_sales.filter(ProductSale.barber_id == barber_id)
    sales = q_sales.all()

    # Expenses: only for global closings, not deducted from individual barber shifts
    expenses = []
    if not barber_id:
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

    if barber_id:
        target_barber = db.query(User).filter(User.id == barber_id).first()
        target_users = [target_barber] if target_barber else []
    else:
        # Include barbers + admins that might have cuts
        target_users = db.query(User).filter(User.role.in_(["barber", "admin", "superadmin"])).all()

    for b in target_users:
        if not b:
            continue
        barbers_dict[b.id] = {
            "barber_id": b.id,
            "barber_name": b.full_name,
            "role": b.role,
            "payment_scheme": b.payment_scheme,
            "commission_percentage": b.commission_percentage,
            "payout_frequency": getattr(b, "payout_frequency", "daily"),
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

        # Include if had activity or is single target barber
        if b_data["cuts_count"] > 0 or b_data["sales_count"] > 0 or barber_id:
            active_barber_summaries.append(b_data)

    total_gross_revenue = total_gross_services + total_gross_sales

    total_fixed_expenses = sum(e.amount for e in expenses if e.category == "fixed")
    total_variable_expenses = sum(e.amount for e in expenses if e.category == "variable")
    total_all_expenses = total_fixed_expenses + total_variable_expenses

    # Net Admin Profit = Gross Revenue - Barber Payouts - Expenses
    net_admin_profit = total_gross_revenue - total_barber_payouts - total_all_expenses

    target_barber_obj = target_users[0] if (barber_id and target_users) else None

    return {
        "closing_type": "barber_shift" if barber_id else "global",
        "barber_id": barber_id,
        "barber_name": target_barber_obj.full_name if target_barber_obj else None,
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
    barber_id: Optional[int] = None,
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

    summary = compute_closing_summary(db, dt_start, dt_end, barber_id=barber_id, only_unsettled=True)
    return summary

@router.get("/barbers-status")
def get_barbers_status(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Retorna el estado en tiempo real de cada barbero:
    cortes pendientes sin liquidar, dinero retenido, comisiones, conciliación neta,
    y los cierres individuales realizados hoy.
    """
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    # Get active barbers + admins
    users = db.query(User).filter(User.role.in_(["barber", "admin"]), User.is_active == True).all()

    # Query today closings per barber
    today_closings = db.query(CashClosing).filter(
        CashClosing.closing_type == "barber_shift",
        CashClosing.created_at >= today_start,
        CashClosing.created_at <= today_end
    ).all()

    closings_by_barber: Dict[int, List[Dict[str, Any]]] = {}
    for c in today_closings:
        if c.barber_id:
            if c.barber_id not in closings_by_barber:
                closings_by_barber[c.barber_id] = []
            closings_by_barber[c.barber_id].append({
                "id": c.id,
                "created_at": c.created_at.isoformat(),
                "time_str": c.created_at.strftime("%H:%M"),
                "total_gross": c.total_gross_revenue,
                "barber_payout": c.total_barber_payouts,
                "notes": c.notes
            })

    results = []
    for u in users:
        # Compute unsettled summary for this barber
        # Look back from beginning of time (or past 30 days) to now for unsettled records
        lookback_start = datetime(2020, 1, 1)
        now_dt = datetime.utcnow()
        summary = compute_closing_summary(db, lookback_start, now_dt, barber_id=u.id, only_unsettled=True)

        b_stat = summary["barber_summaries"][0] if summary["barber_summaries"] else {
            "cuts_count": 0,
            "cuts_gross": 0.0,
            "cuts_barber_earnings": 0.0,
            "cuts_shop_earnings": 0.0,
            "sales_count": 0,
            "sales_gross": 0.0,
            "sales_barber_commission": 0.0,
            "sales_shop_earnings": 0.0,
            "money_held_by_barber": 0.0,
            "money_held_by_shop": 0.0,
            "total_barber_earnings": 0.0,
            "net_debt_amount": 0.0,
            "debtor": "even",
            "summary_text": "Al día ($0 saldo)"
        }

        shifts_today = closings_by_barber.get(u.id, [])

        results.append({
            "barber_id": u.id,
            "barber_name": u.full_name,
            "role": u.role,
            "payment_scheme": u.payment_scheme,
            "commission_percentage": u.commission_percentage,
            "payout_frequency": getattr(u, "payout_frequency", "daily"),
            "unsettled_cuts_count": b_stat["cuts_count"],
            "unsettled_cuts_gross": b_stat["cuts_gross"],
            "unsettled_sales_count": b_stat["sales_count"],
            "unsettled_sales_gross": b_stat["sales_gross"],
            "unsettled_barber_earnings": b_stat["total_barber_earnings"],
            "money_held_by_barber": b_stat["money_held_by_barber"],
            "money_held_by_shop": b_stat["money_held_by_shop"],
            "net_debt_amount": b_stat["net_debt_amount"],
            "debtor": b_stat["debtor"],
            "summary_text": b_stat["summary_text"],
            "unsettled_service_ids": summary["unsettled_service_ids"],
            "unsettled_sale_ids": summary["unsettled_sale_ids"],
            "shifts_closed_today_count": len(shifts_today),
            "shifts_closed_today": shifts_today
        })

    return results

@router.post("/close", response_model=CashClosingOut, status_code=status.HTTP_201_CREATED)
def execute_cash_closing(
    closing_in: CashClosingCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    summary = compute_closing_summary(
        db, 
        closing_in.start_date, 
        closing_in.end_date, 
        barber_id=closing_in.barber_id, 
        only_unsettled=True
    )

    details_payload = {
        "closing_type": closing_in.closing_type,
        "barber_id": closing_in.barber_id,
        "barber_summaries": summary["barber_summaries"],
        "services_count": summary["services_count"],
        "sales_count": summary["sales_count"],
        "total_cash_drawer": summary["total_cash_drawer"],
        "total_digital_shop": summary["total_digital_shop"],
        "total_digital_barber": summary["total_digital_barber"],
    }

    closing = CashClosing(
        closed_by_id=admin.id,
        closing_type=closing_in.closing_type,
        barber_id=closing_in.barber_id,
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
    if closing.barber:
        out.barber_name = closing.barber.full_name
    elif closing_in.barber_id:
        b_user = db.query(User).filter(User.id == closing_in.barber_id).first()
        out.barber_name = b_user.full_name if b_user else None
    return out

@router.get("/history", response_model=List[CashClosingOut])
def list_closings_history(
    limit: int = 50,
    closing_type: Optional[str] = None,
    barber_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(CashClosing)
    if closing_type:
        query = query.filter(CashClosing.closing_type == closing_type)
    if barber_id:
        query = query.filter(CashClosing.barber_id == barber_id)

    closings = query.order_by(CashClosing.created_at.desc()).limit(limit).all()
    out = []
    for c in closings:
        item = CashClosingOut.model_validate(c)
        item.closed_by_name = c.closed_by.full_name if c.closed_by else "Admin"
        item.barber_name = c.barber.full_name if c.barber else None
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
    item.barber_name = c.barber.full_name if c.barber else None
    return item

