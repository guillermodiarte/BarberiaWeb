import os
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from backend.app.database import get_db
from backend.app.models import SystemSetting, User
from backend.app.schemas import SettingOut, SettingUpdate
from backend.app.auth import require_admin

# Load .env file
load_dotenv()

router = APIRouter(prefix="/api/settings", tags=["Configuraciones del Sistema"])

def get_default_settings():
    return {
        "online_booking_enabled": ("true", "Activar o desactivar módulo de reservas online en la web pública"),
        "booking_deposit_required": ("true", "Requerir seña obligatoria para confirmar turnos"),
        "booking_deposit_amount": ("2000", "Monto fijo de seña en ARS para reservar turno"),
        "points_per_cut": ("10", "Puntos de fidelidad otorgados por cada corte realizado (suman de 10 en 10)"),
        "points_for_free_cut": ("50", "Cantidad de puntos de fidelidad necesarios para canjear un corte gratis"),
        "allow_barber_collection": ("false", "Permitir que los barberos cobren directamente por transferencia a sus cuentas"),
        "points_per_ars": ("0.01", "Puntos de fidelidad por cada peso argentino gastado"),
        "barbershop_name": (os.getenv("BARBERSHOP_NAME", "BarberShop Elite"), "Nombre comercial de la barbería"),
        "barbershop_phone": (os.getenv("BARBERSHOP_PHONE", "+54 9 11 5555-1234"), "Teléfono / WhatsApp de atención"),
        "barbershop_address": (os.getenv("BARBERSHOP_ADDRESS", "Av. Santa Fe 2450, CABA"), "Dirección del local"),
        "barbershop_google_maps_url": (os.getenv("BARBERSHOP_GOOGLE_MAPS_URL", "https://maps.google.com/?q=Av.+Santa+Fe+2450,+CABA"), "Enlace o ubicación de Google Maps de la barbería"),
        "barbershop_cbu_alias": (os.getenv("BARBERSHOP_ALIAS", "barbershop.elite.mp"), "Alias / CBU para transferencias de señas"),
        "active_theme": ("gold_elite", "Tema visual activo del sistema (barber_pole, gold_elite, emerald_vintage, sapphire_tech, ruby_burgundy)"),
        "barbershop_logo_url": ("", "URL del logo personalizado de la barbería"),
        "barbershop_tagline": ("Peluquería Masculina de Lujo & Cuidado Personal", "Slogan o bajada de marca de la barbería"),
        "custom_primary_color": ("", "Color primario personalizado en formato HEX (ej: #d97706)"),
        "hero_banner_slides": ('[{"id":"1","image_url":"https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=80","title":"El Arte del Corte Perfecto","subtitle":"Tradición, estilo y precisión en cada detalle para el hombre actual."},{"id":"2","image_url":"https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80","title":"Afeitado Clásico & Toallas Calientes","subtitle":"Navaja libre, espuma tibia artesanal y cuidado facial premium."},{"id":"3","image_url":"https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80","title":"Experiencia BarberShop Elite","subtitle":"Profesionales dedicados a realzar tu personalidad e imagen."}]', "Slides del carrusel del banner principal en formato JSON"),
        "hero_banner_interval": ("5", "Tiempo de transición en segundos entre fotos del banner principal"),
        "barbershop_google_maps_embed_url": ("", "URL o código iframe para incrustar el mapa interactivo de Google Maps"),
        "section_services_enabled": ("true", "Mostrar u ocultar la sección de Servicios en la web"),
        "section_loyalty_enabled": ("true", "Mostrar u ocultar la sección de Fidelización / Puntos en la web"),
        "section_about_enabled": ("true", "Mostrar u ocultar la sección de Historia / Sobre Nosotros en la web"),
        "section_gallery_enabled": ("true", "Mostrar u ocultar la sección de Galería de Fotos en la web"),
        "section_team_enabled": ("true", "Mostrar u ocultar la sección de Nuestro Equipo en la web"),
        "section_contact_enabled": ("true", "Mostrar u ocultar la sección de Contacto y Horarios en la web")
    }

def ensure_default_settings(db: Session):
    defaults = get_default_settings()
    for key, (val, desc) in defaults.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not existing:
            new_set = SystemSetting(key=key, value=val, description=desc)
            db.add(new_set)
    db.commit()

@router.get("", response_model=List[SettingOut])
def list_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).all()
    if not settings:
        ensure_default_settings(db)
        settings = db.query(SystemSetting).all()
    return settings

@router.get("/public")
def get_public_settings(db: Session = Depends(get_db)) -> Dict[str, str]:
    """Public settings consumed by the client landing page"""
    settings = db.query(SystemSetting).all()
    if not settings:
        ensure_default_settings(db)
        settings = db.query(SystemSetting).all()
    return {s.key: s.value for s in settings}

@router.put("/{key}", response_model=SettingOut)
def update_setting(
    key: str,
    setting_in: SettingUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=setting_in.value, description=key)
        db.add(setting)
    else:
        setting.value = setting_in.value

    db.commit()
    db.refresh(setting)
    return setting

