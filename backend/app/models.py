from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="barber", nullable=False)  # "admin" | "barber"
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Schemes: "commission" or "fixed_rent"
    payment_scheme = Column(String(50), default="commission", nullable=False)
    commission_percentage = Column(Float, default=50.0, nullable=False)  # e.g. 50.0 = 50%
    fixed_rent_amount = Column(Float, default=0.0, nullable=False)  # in ARS
    fixed_rent_period = Column(String(50), default="monthly", nullable=False)  # "weekly" | "monthly"
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    service_records = relationship("ServiceRecord", back_populates="barber", foreign_keys="ServiceRecord.barber_id")
    product_sales = relationship("ProductSale", back_populates="barber", foreign_keys="ProductSale.barber_id")
    bookings = relationship("Booking", back_populates="barber", foreign_keys="Booking.barber_id")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), index=True, nullable=False)
    dni = Column(String(50), index=True, nullable=True)
    email = Column(String(255), nullable=True)
    loyalty_points = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    service_records = relationship("ServiceRecord", back_populates="customer")
    product_sales = relationship("ProductSale", back_populates="customer")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="customer")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    price = Column(Float, nullable=False)  # ARS
    is_combo = Column(Boolean, default=False, nullable=False)
    combo_items_json = Column(Text, default="[]", nullable=True)  # JSON list of included service names/ids
    auto_deduct_supplies_json = Column(Text, default="[]", nullable=True)  # e.g. [{"supply_id": 1, "qty": 1}]
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    service_records = relationship("ServiceRecord", back_populates="service")
    bookings = relationship("Booking", back_populates="service")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="resale", nullable=False)  # "resale" | "internal_supply"
    cost_price = Column(Float, default=0.0, nullable=False)  # ARS
    sale_price = Column(Float, default=0.0, nullable=False)  # ARS (applicable for resale)
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock_alert = Column(Integer, default=5, nullable=False)
    unit = Column(String(50), default="unidades", nullable=False)  # "unidades", "ml", "packs"
    barber_commission_percentage = Column(Float, default=10.0, nullable=False)  # commission % for barber on sale
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sales = relationship("ProductSale", back_populates="product")


class ServiceRecord(Base):
    __tablename__ = "service_records"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    barber_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    price = Column(Float, nullable=False)  # ARS charged
    duration_minutes = Column(Integer, default=30, nullable=False)

    # Physical collection: who held the money?
    collected_by = Column(String(50), nullable=False)  # "barber" | "admin"
    # Payment channel
    payment_method = Column(String(50), nullable=False)  # "cash" | "transfer_shop" | "transfer_barber"

    # Compensation snapshot at transaction time
    barber_payout_scheme = Column(String(50), nullable=False)  # "commission" | "fixed_rent"
    barber_rate = Column(Float, default=50.0, nullable=False)
    barber_earnings = Column(Float, default=0.0, nullable=False)  # ARS
    shop_earnings = Column(Float, default=0.0, nullable=False)  # ARS

    loyalty_points_awarded = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    
    is_settled = Column(Boolean, default=False, nullable=False)
    settlement_id = Column(Integer, ForeignKey("cash_closings.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    service = relationship("Service", back_populates="service_records")
    barber = relationship("User", back_populates="service_records", foreign_keys=[barber_id])
    customer = relationship("Customer", back_populates="service_records")
    settlement = relationship("CashClosing", back_populates="service_records", foreign_keys=[settlement_id])


class ProductSale(Base):
    __tablename__ = "product_sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    barber_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable if sold directly by admin
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)  # ARS
    total_amount = Column(Float, nullable=False)  # ARS

    collected_by = Column(String(50), nullable=False)  # "barber" | "admin"
    payment_method = Column(String(50), nullable=False)  # "cash" | "transfer_shop" | "transfer_barber"

    barber_commission_percentage = Column(Float, default=0.0, nullable=False)
    barber_commission_amount = Column(Float, default=0.0, nullable=False)  # ARS
    shop_earnings = Column(Float, default=0.0, nullable=False)  # ARS

    loyalty_points_awarded = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    is_settled = Column(Boolean, default=False, nullable=False)
    settlement_id = Column(Integer, ForeignKey("cash_closings.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="sales")
    barber = relationship("User", back_populates="product_sales", foreign_keys=[barber_id])
    customer = relationship("Customer", back_populates="product_sales")
    settlement = relationship("CashClosing", back_populates="product_sales", foreign_keys=[settlement_id])


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="variable", nullable=False)  # "fixed" | "variable"
    amount = Column(Float, nullable=False)  # ARS
    description = Column(Text, nullable=True)
    expense_date = Column(Date, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])


class LoyaltyReward(Base):
    __tablename__ = "loyalty_rewards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    points_required = Column(Integer, nullable=False)
    reward_type = Column(String(50), default="free_service", nullable=False)  # "free_service" | "product_discount" | "fixed_discount"
    discount_value = Column(Float, default=0.0, nullable=False)  # e.g. 100% or amount in ARS
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    points_change = Column(Integer, nullable=False)  # positive (earned) or negative (redeemed)
    reason = Column(String(255), nullable=False)  # "service_cut", "product_sale", "reward_redemption", "adjustment"
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="loyalty_transactions")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(255), nullable=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    barber_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable if any barber

    booking_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    start_time = Column(String(10), nullable=False)  # HH:MM
    status = Column(String(50), default="pending", nullable=False)  # "pending", "confirmed", "completed", "cancelled"
    
    deposit_amount = Column(Float, default=0.0, nullable=False)  # ARS seña
    payment_status = Column(String(50), default="unpaid", nullable=False)  # "unpaid", "deposit_paid", "fully_paid"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    service = relationship("Service", back_populates="bookings")
    barber = relationship("User", back_populates="bookings", foreign_keys=[barber_id])


class CashClosing(Base):
    __tablename__ = "cash_closings"

    id = Column(Integer, primary_key=True, index=True)
    closed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    period_type = Column(String(50), default="daily", nullable=False)  # "daily", "weekly", "biweekly", "monthly", "custom"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    total_cash_drawer = Column(Float, default=0.0, nullable=False)  # ARS
    total_digital_shop = Column(Float, default=0.0, nullable=False)  # ARS
    total_digital_barber = Column(Float, default=0.0, nullable=False)  # ARS
    
    total_gross_revenue = Column(Float, default=0.0, nullable=False)  # ARS
    total_barber_payouts = Column(Float, default=0.0, nullable=False)  # ARS
    total_fixed_expenses = Column(Float, default=0.0, nullable=False)  # ARS
    total_variable_expenses = Column(Float, default=0.0, nullable=False)  # ARS
    net_admin_profit = Column(Float, default=0.0, nullable=False)  # ARS

    # JSON with per-barber breakdown: cuts count, sales count, gross, commission, who owes whom net amount
    details_json = Column(Text, default="{}", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    closed_by = relationship("User", foreign_keys=[closed_by_id])
    service_records = relationship("ServiceRecord", back_populates="settlement", foreign_keys="ServiceRecord.settlement_id")
    product_sales = relationship("ProductSale", back_populates="settlement", foreign_keys="ProductSale.settlement_id")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)

