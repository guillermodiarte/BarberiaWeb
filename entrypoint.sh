#!/bin/sh
set -e

echo "🚀 Iniciando contenedor de BarberShop Elite..."

# Asegurar directorios de persistencia
mkdir -p /app/data
mkdir -p /app/uploads/sistema
mkdir -p /app/uploads/banner
mkdir -p /app/uploads/galeria
mkdir -p /app/uploads/equipo
mkdir -p /app/uploads/videos
mkdir -p /app/uploads/favicon

# Si SEED_ON_START es true (por defecto true en primera ejecución), ejecutamos el seed
if [ "$SEED_ON_START" != "false" ]; then
    echo "🌱 Verificando inicialización de datos y SuperAdmin..."
    python backend/seed.py || echo "⚠️ Advertencia al ejecutar seed (puede que ya esté inicializado)"
fi

echo "✨ Servidor listo. Escuchando en el puerto ${PORT:-8000}..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
