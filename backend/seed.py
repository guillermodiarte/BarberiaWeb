import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import (
    User, Service, Product, Customer, Expense,
    LoyaltyReward, ServiceRecord, ProductSale, Booking, SystemSetting
)
from backend.app.auth import get_password_hash
from backend.app.routers.settings import ensure_default_settings

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        ensure_default_settings(db)

        admin_email = os.getenv("ADMIN_EMAIL", "admin@barbershop.com").lower().strip()
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_name = os.getenv("ADMIN_NAME", "Gonzalo Ramos (Dueño / Admin)")
        admin_phone = os.getenv("ADMIN_PHONE", "+54 9 11 9876-5432")

        barber1_email = os.getenv("BARBER1_EMAIL", "marcos@barbershop.com").lower().strip()
        barber1_pass = os.getenv("BARBER1_PASSWORD", "barbero123")
        barber1_name = os.getenv("BARBER1_NAME", "Marcos Toledo")
        barber1_phone = os.getenv("BARBER1_PHONE", "+54 9 11 2345-6789")
        barber1_comm = float(os.getenv("BARBER1_COMMISSION", "50.0"))

        barber2_email = os.getenv("BARBER2_EMAIL", "lucas@barbershop.com").lower().strip()
        barber2_pass = os.getenv("BARBER2_PASSWORD", "barbero123")
        barber2_name = os.getenv("BARBER2_NAME", "Lucas Benítez")
        barber2_phone = os.getenv("BARBER2_PHONE", "+54 9 11 3456-7890")
        barber2_comm = float(os.getenv("BARBER2_COMMISSION", "45.0"))

        barber3_email = os.getenv("BARBER3_EMAIL", "diego@barbershop.com").lower().strip()
        barber3_pass = os.getenv("BARBER3_PASSWORD", "barbero123")
        barber3_name = os.getenv("BARBER3_NAME", "Diego Navarro")
        barber3_phone = os.getenv("BARBER3_PHONE", "+54 9 11 4567-8901")
        barber3_rent = float(os.getenv("BARBER3_RENT_AMOUNT", "120000.0"))
        barber3_period = os.getenv("BARBER3_RENT_PERIOD", "monthly")

        # Ensure SuperAdmin exists
        superadmin_email = "guillermo.diarte@gmail.com"
        superadmin_user = db.query(User).filter(User.email == superadmin_email).first()
        if not superadmin_user:
            superadmin_user = User(
                email=superadmin_email,
                full_name="Guillermo Diarte (SuperAdmin)",
                phone="+54 9 351 000-0000",
                hashed_password=get_password_hash("Gad33224122"),
                role="superadmin",
                is_active=True,
                payment_scheme="commission",
                commission_percentage=50.0
            )
            db.add(superadmin_user)
        else:
            superadmin_user.role = "superadmin"
            superadmin_user.hashed_password = get_password_hash("Gad33224122")
            superadmin_user.is_active = True
        db.commit()

        # Check if already seeded
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if admin_user:
            # Update password if changed in .env
            admin_user.full_name = admin_name
            admin_user.hashed_password = get_password_hash(admin_pass)
            db.commit()
            print("Base de datos ya inicializada previamente. Credenciales de admin actualizadas según .env.")
            return

        print("--- Sembrando usuarios ---")
        admin = User(
            email=admin_email,
            full_name=admin_name,
            phone=admin_phone,
            hashed_password=get_password_hash(admin_pass),
            role="admin",
            is_active=True,
            payment_scheme="commission",
            commission_percentage=50.0
        )
        db.add(admin)

        barber1 = User(
            email=barber1_email,
            full_name=barber1_name,
            phone=barber1_phone,
            hashed_password=get_password_hash(barber1_pass),
            role="barber",
            is_active=True,
            payment_scheme="commission",
            commission_percentage=barber1_comm,
            fixed_rent_amount=0.0
        )
        barber2 = User(
            email=barber2_email,
            full_name=barber2_name,
            phone=barber2_phone,
            hashed_password=get_password_hash(barber2_pass),
            role="barber",
            is_active=True,
            payment_scheme="commission",
            commission_percentage=barber2_comm,
            fixed_rent_amount=0.0
        )
        barber3 = User(
            email=barber3_email,
            full_name=barber3_name,
            phone=barber3_phone,
            hashed_password=get_password_hash(barber3_pass),
            role="barber",
            is_active=True,
            payment_scheme="fixed_rent",
            commission_percentage=0.0,
            fixed_rent_amount=barber3_rent,
            fixed_rent_period=barber3_period
        )
        db.add_all([barber1, barber2, barber3])
        db.flush()

        print("--- Sembrando insumos y productos ---")
        supply_blade = Product(
            name="Cuchillas de Afeitar Platinum (Caja x100)",
            description="Hojas descartables para navaja de barbero",
            category="internal_supply",
            cost_price=9000.0,
            sale_price=0.0,
            stock_quantity=8,
            min_stock_alert=3,
            unit="cajas"
        )
        supply_gel = Product(
            name="Gel de Afeitar de Precisión (1000ml)",
            description="Gel transparente para perfilado nítido",
            category="internal_supply",
            cost_price=7500.0,
            sale_price=0.0,
            stock_quantity=5,
            min_stock_alert=2,
            unit="botellas"
        )
        resale_pomade = Product(
            name="Cera Mate Fijación Fuerte (100g)",
            description="Acabado mate natural, fijación prolongada para peinados modernos",
            category="resale",
            cost_price=4200.0,
            sale_price=9500.0,
            stock_quantity=24,
            min_stock_alert=5,
            unit="unidades",
            barber_commission_percentage=15.0
        )
        resale_oil = Product(
            name="Aceite Hidratante para Barba (30ml)",
            description="Con aceite de argán y jojoba. Suaviza y da brillo natural",
            category="resale",
            cost_price=3500.0,
            sale_price=8200.0,
            stock_quantity=18,
            min_stock_alert=4,
            unit="unidades",
            barber_commission_percentage=15.0
        )
        resale_shampoo = Product(
            name="Shampoo Barba & Cabello Black Edition (250ml)",
            description="Limpieza profunda con carbón activado y aroma amaderado",
            category="resale",
            cost_price=5000.0,
            sale_price=11500.0,
            stock_quantity=14,
            min_stock_alert=3,
            unit="unidades",
            barber_commission_percentage=10.0
        )
        db.add_all([supply_blade, supply_gel, resale_pomade, resale_oil, resale_shampoo])
        db.flush()

        print("--- Sembrando servicios y combos ---")
        srv_corte = Service(
            name="Corte Clásico / Degradé Fade",
            description="Corte personalizado con tijera y máquina, incluye lavado express y peinado.",
            duration_minutes=35,
            price=8000.0,
            is_combo=False
        )
        srv_barba = Service(
            name="Perfilado y Ritual de Barba",
            description="Toalla caliente, aceites esenciales, afeitado a navaja y bálsamo.",
            duration_minutes=25,
            price=5000.0,
            is_combo=False,
            auto_deduct_supplies_json=json.dumps([{"supply_id": supply_blade.id, "quantity": 1}])
        )
        srv_cejas = Service(
            name="Perfilado de Cejas con Navaja",
            description="Diseño y limpieza simétrica de cejas masculinas.",
            duration_minutes=15,
            price=2500.0,
            is_combo=False
        )
        srv_combo1 = Service(
            name="Combo Elite: Corte Fade + Barba Completa",
            description="Nuestro servicio estrella. Ahorro de $2.000 ARS contratando el combo.",
            duration_minutes=50,
            price=11000.0,
            is_combo=True,
            combo_items_json=json.dumps(["Corte Clásico / Degradé Fade", "Perfilado y Ritual de Barba"]),
            auto_deduct_supplies_json=json.dumps([{"supply_id": supply_blade.id, "quantity": 1}])
        )
        srv_combo2 = Service(
            name="Combo Presidencial: Corte + Barba + Cejas + Máscara Black",
            description="Tratamiento integral de lujo para ocasiones especiales.",
            duration_minutes=65,
            price=15000.0,
            is_combo=True,
            combo_items_json=json.dumps(["Corte", "Barba", "Cejas", "Tratamiento Facial"])
        )
        db.add_all([srv_corte, srv_barba, srv_cejas, srv_combo1, srv_combo2])
        db.flush()

        print("--- Sembrando clientes y fidelización ---")
        c1 = Customer(
            full_name="Martín Rodríguez",
            phone="1144332211",
            dni="38990112",
            email="martin.rodriguez@gmail.com",
            loyalty_points=120,
            notes="Prefiere degradé alto a navaja"
        )
        c2 = Customer(
            full_name="Federico Gómez",
            phone="1155667788",
            dni="40123456",
            email="fede.gomez@hotmail.com",
            loyalty_points=45,
            notes="Viene cada 15 días"
        )
        c3 = Customer(
            full_name="Agustín Morales",
            phone="1166778899",
            dni="36456789",
            loyalty_points=80
        )
        db.add_all([c1, c2, c3])
        db.flush()

        print("--- Sembrando recompensas de fidelización ---")
        rew1 = LoyaltyReward(
            title="Corte Clásico 100% Gratis",
            description="Canjea 100 puntos y tu próximo corte es por cuenta de la casa.",
            points_required=100,
            reward_type="free_service",
            discount_value=100.0
        )
        rew2 = LoyaltyReward(
            title="50% Descuento en Cera o Aceite de Barba",
            description="Canjea 50 puntos y llévate cualquier cera o aceite a mitad de precio.",
            points_required=50,
            reward_type="product_discount",
            discount_value=50.0
        )
        rew3 = LoyaltyReward(
            title="$3.000 ARS de Descuento Directo",
            description="Descuento monetario aplicable a cualquier servicio de tu elección.",
            points_required=40,
            reward_type="fixed_discount",
            discount_value=3000.0
        )
        db.add_all([rew1, rew2, rew3])

        print("--- Sembrando gastos de ejemplo ---")
        exp1 = Expense(
            title="Alquiler del Local (Mes en curso)",
            category="fixed",
            amount=280000.0,
            description="Alquiler comercial local BarberShop Elite",
            expense_date=date.today().replace(day=1),
            created_by_id=admin.id
        )
        exp2 = Expense(
            title="Servicio de Luz (Edenor)",
            category="fixed",
            amount=42000.0,
            description="Factura eléctrica del salón",
            expense_date=date.today().replace(day=5),
            created_by_id=admin.id
        )
        exp3 = Expense(
            title="Compra Mayorista de Ceras y Shampoos",
            category="variable",
            amount=65000.0,
            description="Reposición de inventario de reventa",
            expense_date=date.today() - timedelta(days=3),
            created_by_id=admin.id
        )
        db.add_all([exp1, exp2, exp3])

        print("--- Sembrando registros de cortes de prueba ---")
        # Cut 1: Marcos cut c1, paid in cash to Marcos
        r1 = ServiceRecord(
            service_id=srv_combo1.id,
            barber_id=barber1.id,
            customer_id=c1.id,
            price=11000.0,
            duration_minutes=50,
            collected_by="barber",
            payment_method="cash",
            barber_payout_scheme="commission",
            barber_rate=50.0,
            barber_earnings=5500.0,
            shop_earnings=5500.0,
            loyalty_points_awarded=110,
            notes="Cliente pagó en efectivo a Marcos",
            is_settled=False,
            created_at=datetime.utcnow() - timedelta(hours=3)
        )
        # Cut 2: Lucas cut c2, paid via Transfer to Shop
        r2 = ServiceRecord(
            service_id=srv_corte.id,
            barber_id=barber2.id,
            customer_id=c2.id,
            price=8000.0,
            duration_minutes=35,
            collected_by="admin",
            payment_method="transfer_shop",
            barber_payout_scheme="commission",
            barber_rate=45.0,
            barber_earnings=3600.0,
            shop_earnings=4400.0,
            loyalty_points_awarded=80,
            notes="Transferencia acreditada en cuenta del salón",
            is_settled=False,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        # Cut 3: Diego (fixed rent), cash to Diego
        r3 = ServiceRecord(
            service_id=srv_corte.id,
            barber_id=barber3.id,
            customer_id=c3.id,
            price=8000.0,
            duration_minutes=35,
            collected_by="barber",
            payment_method="cash",
            barber_payout_scheme="fixed_rent",
            barber_rate=0.0,
            barber_earnings=8000.0,
            shop_earnings=0.0,
            loyalty_points_awarded=80,
            notes="Corte barbero alquiler fijo",
            is_settled=False,
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add_all([r1, r2, r3])

        # Product sale 1: Marcos sold a pomade to c1, paid in cash to Marcos
        ps1 = ProductSale(
            product_id=resale_pomade.id,
            barber_id=barber1.id,
            customer_id=c1.id,
            quantity=1,
            unit_price=9500.0,
            total_amount=9500.0,
            collected_by="barber",
            payment_method="cash",
            barber_commission_percentage=15.0,
            barber_commission_amount=1425.0,
            shop_earnings=8075.0,
            loyalty_points_awarded=95,
            is_settled=False,
            created_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(ps1)

        print("--- Sembrando turno de ejemplo ---")
        bk1 = Booking(
            customer_name="Gonzalo Pérez",
            customer_phone="1122334455",
            customer_email="gonzalo.perez@test.com",
            service_id=srv_combo1.id,
            barber_id=barber1.id,
            booking_date=(date.today() + timedelta(days=1)).isoformat(),
            start_time="16:00",
            status="confirmed",
            deposit_amount=2000.0,
            payment_status="deposit_paid",
            notes="Seña abonada por transferencia"
        )
        db.add(bk1)

        db.commit()
        print("¡Base de datos sembrada con éxito!")

    except Exception as e:
        db.rollback()
        print("Error al sembrar:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
