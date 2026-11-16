from datetime import datetime, date, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models import ServiceRecord, ProductSale, Expense, Product, Booking, User
from backend.app.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Estadísticas y Dashboard"])

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    today_start = datetime.combine(date.today(), datetime.min.time())
    month_start = datetime.combine(date.today().replace(day=1), datetime.min.time())

    if current_user.role == "barber":
        # Barber's personal view
        b_id = current_user.id

        # Cuts today
        cuts_today = db.query(ServiceRecord).filter(
            ServiceRecord.barber_id == b_id,
            ServiceRecord.created_at >= today_start
        ).all()

        # Cuts this month
        cuts_month = db.query(ServiceRecord).filter(
            ServiceRecord.barber_id == b_id,
            ServiceRecord.created_at >= month_start
        ).all()

        # Product sales this month
        sales_month = db.query(ProductSale).filter(
            ProductSale.barber_id == b_id,
            ProductSale.created_at >= month_start
        ).all()

        # Unsettled records for this barber
        unsettled_cuts = db.query(ServiceRecord).filter(
            ServiceRecord.barber_id == b_id,
            ServiceRecord.is_settled == False
        ).all()

        unsettled_sales = db.query(ProductSale).filter(
            ProductSale.barber_id == b_id,
            ProductSale.is_settled == False
        ).all()

        total_cuts_earnings = sum(c.barber_earnings for c in unsettled_cuts)
        total_sales_commission = sum(s.barber_commission_amount for s in unsettled_sales)
        total_earnings = total_cuts_earnings + total_sales_commission

        # Money held by this barber
        money_held = sum(
            c.price for c in unsettled_cuts if (c.collected_by == "barber" or c.payment_method == "transfer_barber")
        ) + sum(
            s.total_amount for s in unsettled_sales if (s.collected_by == "barber" or s.payment_method == "transfer_barber")
        )

        diff = money_held - total_earnings
        if diff > 0.01:
            settlement_status = "Debes entregar a la barbería"
            balance_amount = diff
        elif diff < -0.01:
            settlement_status = "La barbería debe pagarte"
            balance_amount = abs(diff)
        else:
            settlement_status = "Al día (Sin deuda)"
            balance_amount = 0.0

        # Assigned bookings for today/future
        upcoming_bookings = db.query(Booking).filter(
            Booking.barber_id == b_id,
            Booking.booking_date >= date.today().isoformat(),
            Booking.status.in_(["pending", "confirmed"])
        ).count()

        return {
            "role": "barber",
            "full_name": current_user.full_name,
            "payment_scheme": current_user.payment_scheme,
            "commission_percentage": current_user.commission_percentage,
            "cuts_today_count": len(cuts_today),
            "cuts_month_count": len(cuts_month),
            "cuts_month_gross": sum(c.price for c in cuts_month),
            "month_barber_earnings": sum(c.barber_earnings for c in cuts_month) + sum(s.barber_commission_amount for s in sales_month),
            "unsettled_cuts_count": len(unsettled_cuts),
            "unsettled_sales_count": len(unsettled_sales),
            "total_unsettled_earnings": total_earnings,
            "money_held": money_held,
            "settlement_status": settlement_status,
            "balance_amount": balance_amount,
            "upcoming_bookings_count": upcoming_bookings
        }

    else:
        # Admin's global view
        # Cuts today
        cuts_today = db.query(ServiceRecord).filter(ServiceRecord.created_at >= today_start).all()
        # Cuts month
        cuts_month = db.query(ServiceRecord).filter(ServiceRecord.created_at >= month_start).all()
        # Sales month
        sales_month = db.query(ProductSale).filter(ProductSale.created_at >= month_start).all()

        gross_month_services = sum(c.price for c in cuts_month)
        gross_month_sales = sum(s.total_amount for s in sales_month)
        gross_month_total = gross_month_services + gross_month_sales

        barber_payouts_month = sum(c.barber_earnings for c in cuts_month) + sum(s.barber_commission_amount for s in sales_month)

        # Expenses month
        month_expenses = db.query(Expense).filter(Expense.expense_date >= month_start.date()).all()
        total_expenses_month = sum(e.amount for e in month_expenses)

        net_profit_month = gross_month_total - barber_payouts_month - total_expenses_month

        # Current unclosed cash drawer (cash physically in drawer from admin collections)
        unsettled_cuts = db.query(ServiceRecord).filter(ServiceRecord.is_settled == False).all()
        unsettled_sales = db.query(ProductSale).filter(ProductSale.is_settled == False).all()

        current_cash_drawer = sum(
            c.price for c in unsettled_cuts if c.payment_method == "cash" and c.collected_by == "admin"
        ) + sum(
            s.total_amount for s in unsettled_sales if s.payment_method == "cash" and s.collected_by == "admin"
        )

        current_transfers_shop = sum(
            c.price for c in unsettled_cuts if c.payment_method == "transfer_shop"
        ) + sum(
            s.total_amount for s in unsettled_sales if s.payment_method == "transfer_shop"
        )

        low_stock_count = db.query(Product).filter(
            Product.is_active == True,
            Product.stock_quantity <= Product.min_stock_alert
        ).count()

        pending_bookings_count = db.query(Booking).filter(Booking.status == "pending").count()
        active_barbers_count = db.query(User).filter(User.role == "barber", User.is_active == True).count()

        return {
            "role": "admin",
            "full_name": current_user.full_name,
            "cuts_today_count": len(cuts_today),
            "gross_today": sum(c.price for c in cuts_today),
            "cuts_month_count": len(cuts_month),
            "gross_month_total": gross_month_total,
            "barber_payouts_month": barber_payouts_month,
            "total_expenses_month": total_expenses_month,
            "net_profit_month": net_profit_month,
            "current_cash_drawer": current_cash_drawer,
            "current_transfers_shop": current_transfers_shop,
            "unsettled_records_count": len(unsettled_cuts) + len(unsettled_sales),
            "low_stock_count": low_stock_count,
            "pending_bookings_count": pending_bookings_count,
            "active_barbers_count": active_barbers_count
        }

