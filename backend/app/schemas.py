from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Users & Auth ---
class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str = "barber"  # "admin" | "barber"
    payment_scheme: str = "commission"  # "commission" | "fixed_rent"
    commission_percentage: float = 50.0
    fixed_rent_amount: float = 0.0
    fixed_rent_period: str = "monthly"
    payout_frequency: str = "daily"  # "daily" | "weekly" | "biweekly" | "monthly"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    payment_scheme: Optional[str] = None
    commission_percentage: Optional[float] = None
    fixed_rent_amount: Optional[float] = None
    fixed_rent_period: Optional[str] = None
    payout_frequency: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Customers ---
class CustomerBase(BaseModel):
    full_name: str
    phone: str
    dni: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    loyalty_points: Optional[int] = None

class CustomerOut(CustomerBase):
    id: int
    loyalty_points: int
    created_at: datetime
    cuts_count: Optional[int] = 0
    last_visit: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Services & Combos ---
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 30
    price: float  # ARS
    is_combo: bool = False
    combo_items_json: Optional[str] = "[]"
    auto_deduct_supplies_json: Optional[str] = "[]"

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    is_combo: Optional[bool] = None
    combo_items_json: Optional[str] = None
    auto_deduct_supplies_json: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceOut(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MassPriceUpdate(BaseModel):
    percentage: float  # e.g. 15.0 for +15%
    round_to: int = 100  # round to nearest 100 ARS
    service_ids: Optional[List[int]] = None  # None = all active services

# --- Products & Supplies ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "resale"  # "resale" | "internal_supply"
    cost_price: float = 0.0
    sale_price: float = 0.0
    stock_quantity: int = 0
    min_stock_alert: int = 5
    unit: str = "unidades"
    barber_commission_percentage: float = 10.0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_alert: Optional[int] = None
    unit: Optional[str] = None
    barber_commission_percentage: Optional[float] = None
    is_active: Optional[bool] = None

class StockAdjustment(BaseModel):
    quantity_change: int  # e.g. +10 or -2
    reason: Optional[str] = "Ajuste manual"

class ProductOut(ProductBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Service Records (Core CRM) ---
class ServiceRecordCreate(BaseModel):
    service_id: int
    barber_id: int
    customer_id: Optional[int] = None
    # Quick creation for customer if not exists
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_dni: Optional[str] = None

    price_override: Optional[float] = None  # in case of custom discount/price
    collected_by: str  # "barber" | "admin"
    payment_method: str  # "cash" | "transfer_shop" | "transfer_barber"
    redeem_free_cut: Optional[bool] = False  # Redeem points for a 100% free cut
    notes: Optional[str] = None

class ServiceRecordOut(BaseModel):
    id: int
    service_id: int
    barber_id: int
    customer_id: Optional[int] = None
    price: float
    duration_minutes: int
    collected_by: str
    payment_method: str
    barber_payout_scheme: str
    barber_rate: float
    barber_earnings: float
    shop_earnings: float
    loyalty_points_awarded: int
    notes: Optional[str] = None
    is_settled: bool
    settlement_id: Optional[int] = None
    created_at: datetime

    # Denormalized for convenient frontend display
    service_name: Optional[str] = None
    barber_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    who_owes_whom: Optional[str] = None  # e.g. "Barbero debe a la barbería $4.000"

    class Config:
        from_attributes = True

# --- Product Sales ---
class ProductSaleCreate(BaseModel):
    product_id: int
    barber_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_phone: Optional[str] = None
    quantity: int = 1
    collected_by: str  # "barber" | "admin"
    payment_method: str  # "cash" | "transfer_shop" | "transfer_barber"
    notes: Optional[str] = None

class ProductSaleOut(BaseModel):
    id: int
    product_id: int
    barber_id: Optional[int] = None
    customer_id: Optional[int] = None
    quantity: int
    unit_price: float
    total_amount: float
    collected_by: str
    payment_method: str
    barber_commission_percentage: float
    barber_commission_amount: float
    shop_earnings: float
    loyalty_points_awarded: int
    notes: Optional[str] = None
    is_settled: bool
    created_at: datetime

    product_name: Optional[str] = None
    barber_name: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Expenses ---
class ExpenseCreate(BaseModel):
    title: str
    category: str = "variable"  # "fixed" | "variable"
    amount: float
    description: Optional[str] = None
    expense_date: date

class ExpenseOut(BaseModel):
    id: int
    title: str
    category: str
    amount: float
    description: Optional[str] = None
    expense_date: date
    created_by_id: int
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Loyalty ---
class LoyaltyRewardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    points_required: int
    reward_type: str = "free_service"
    discount_value: float = 0.0

class LoyaltyRewardOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    points_required: int
    reward_type: str
    discount_value: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoyaltyRedeemRequest(BaseModel):
    customer_id: int
    reward_id: int

class LoyaltyTransactionOut(BaseModel):
    id: int
    customer_id: int
    points_change: int
    reason: str
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Bookings (Online Booking) ---
class BookingCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    service_id: int
    barber_id: Optional[int] = None
    booking_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    notes: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: Optional[str] = None  # "pending", "confirmed", "completed", "cancelled"
    payment_status: Optional[str] = None  # "unpaid", "deposit_paid", "fully_paid"
    deposit_amount: Optional[float] = None

class BookingOut(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    service_id: int
    barber_id: Optional[int] = None
    booking_date: str
    start_time: str
    status: str
    deposit_amount: float
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime

    service_name: Optional[str] = None
    service_price: Optional[float] = None
    barber_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Cash Closings / Settlement ---
class CashClosingPreview(BaseModel):
    closing_type: Optional[str] = "global"  # "global" | "barber_shift"
    barber_id: Optional[int] = None
    barber_name: Optional[str] = None
    start_date: datetime
    end_date: datetime
    services_count: int
    sales_count: int
    total_cash_drawer: float
    total_digital_shop: float
    total_digital_barber: float
    total_gross_revenue: float
    total_barber_payouts: float
    total_fixed_expenses: float
    total_variable_expenses: float
    net_admin_profit: float
    barber_summaries: List[Dict[str, Any]]
    unsettled_service_ids: List[int]
    unsettled_sale_ids: List[int]

class CashClosingCreate(BaseModel):
    closing_type: str = "global"  # "global" | "barber_shift"
    barber_id: Optional[int] = None
    period_type: str = "daily"  # "daily", "weekly", "biweekly", "monthly", "custom"
    start_date: datetime
    end_date: datetime
    notes: Optional[str] = None

class CashClosingOut(BaseModel):
    id: int
    closed_by_id: int
    closed_by_name: Optional[str] = None
    closing_type: str = "global"
    barber_id: Optional[int] = None
    barber_name: Optional[str] = None
    period_type: str
    start_date: datetime
    end_date: datetime
    total_cash_drawer: float
    total_digital_shop: float
    total_digital_barber: float
    total_gross_revenue: float
    total_barber_payouts: float
    total_fixed_expenses: float
    total_variable_expenses: float
    net_admin_profit: float
    details_json: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Settings ---
class SettingOut(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SettingUpdate(BaseModel):
    value: str
