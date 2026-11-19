import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import (
    auth, services, barbers, service_records, inventory,
    product_sales, expenses, cash_closing, customers,
    rewards, bookings, settings, stats, media
)
from backend.app.routers.settings import ensure_default_settings

# Create DB schema tables
Base.metadata.create_all(bind=engine)

# Ensure default initial settings
with SessionLocal() as db:
    ensure_default_settings(db)

app_title = os.getenv("BARBERSHOP_NAME", "BarberShop Elite")

app = FastAPI(
    title=f"{app_title} API",
    description="Sistema Integral de Gestión de Barbería (Core CRM, Control de Caja, Fidelización y Turnos)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup for development and external mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(services.router)
app.include_router(barbers.router)
app.include_router(service_records.router)
app.include_router(inventory.router)
app.include_router(product_sales.router)
app.include_router(expenses.router)
app.include_router(cash_closing.router)
app.include_router(customers.router)
app.include_router(rewards.router)
app.include_router(bookings.router)
app.include_router(settings.router)
app.include_router(stats.router)
app.include_router(media.router)

# Mount uploads static files directory
UPLOADS_DIR = os.getenv("UPLOADS_DIR", os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads"
))
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/api/health", tags=["Salud"])
def health_check():
    return {
        "status": "online",
        "service": f"{app_title} API",
        "currency": os.getenv("CURRENCY", "ARS"),
        "version": "1.0.0"
    }

# -----------------------------------------------------------------------------
# SERVIDO UNIFICADO EN PRODUCCIÓN (SINGLE-APP MONOLITH)
# -----------------------------------------------------------------------------
# En producción, FastAPI sirve directamente los archivos compilados por Vite (dist/)
# eliminando la necesidad de levantar dos aplicaciones separadas o lidiar con CORS.
DIST_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "dist"
)

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # SPA Fallback: cualquier ruta no-API entrega el index.html de React
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        # Si se solicita un archivo estático específico en dist (favicon, robots, etc.)
        if full_path:
            requested_file = os.path.join(DIST_DIR, full_path)
            if os.path.exists(requested_file) and os.path.isfile(requested_file):
                return FileResponse(requested_file)
        
        # Para cualquier otra ruta del cliente (/admin, /admin/login, /reservas, etc.)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Compila el frontend con 'npm run build'"}
