# ==============================================================================
# STAGE 1: Compilar Frontend React + Vite
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copiar configuración de dependencias de Node
COPY package*.json ./
RUN npm install

# Copiar el código fuente y compilar dist
COPY . .
RUN npm run build

# ==============================================================================
# STAGE 2: Imagen final de Producción (Python + FastAPI)
# ==============================================================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Instalar dependencias del sistema (ffmpeg para optimización de videos, curl para healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/ ./backend/

# Copiar estructura inicial de uploads
COPY uploads/ ./uploads/

# Copiar el frontend compilado (dist/) desde el Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copiar script de arranque
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Crear carpetas para volúmenes persistentes
RUN mkdir -p /app/data /app/uploads

# Variables de entorno por defecto
ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:////app/data/barbershop.db
ENV UPLOADS_DIR=/app/uploads

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
