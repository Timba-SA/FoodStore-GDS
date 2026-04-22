# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Instalar dependencias del sistema necesarias para compilar algunas librerías
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copiar solo las dependencias instaladas desde builder
COPY --from=builder /root/.local /root/.local
COPY . .

# Asegurarse de que los scripts tengan permisos
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

# Usuario no root por seguridad
RUN useradd -m appuser
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
