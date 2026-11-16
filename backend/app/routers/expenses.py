from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Expense, User
from backend.app.schemas import ExpenseCreate, ExpenseOut
from backend.app.auth import require_admin

router = APIRouter(prefix="/api/expenses", tags=["Gastos y Egresos"])

@router.get("", response_model=List[ExpenseOut])
def list_expenses(
    category: Optional[str] = Query(None, description="'fixed' o 'variable'"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Expense)
    if category:
        query = query.filter(Expense.category == category)
    if date_from:
        try:
            d_from = datetime.strptime(date_from, "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date >= d_from)
        except ValueError:
            pass
    if date_to:
        try:
            d_to = datetime.strptime(date_to, "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date <= d_to)
        except ValueError:
            pass

    expenses = query.order_by(Expense.expense_date.desc(), Expense.id.desc()).limit(limit).all()
    out = []
    for e in expenses:
        item = ExpenseOut.model_validate(e)
        item.created_by_name = e.created_by.full_name if e.created_by else "Admin"
        out.append(item)
    return out

@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    expense = Expense(
        title=exp_in.title,
        category=exp_in.category,
        amount=exp_in.amount,
        description=exp_in.description,
        expense_date=exp_in.expense_date,
        created_by_id=admin.id
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    item = ExpenseOut.model_validate(expense)
    item.created_by_name = admin.full_name
    return item

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(expense)
    db.commit()
    return {"message": "Gasto eliminado"}

