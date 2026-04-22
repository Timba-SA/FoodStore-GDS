# Guía de Inicio: FoodStore

¡Bienvenido al proyecto FoodStore! Esta guía te ayudará a poner en marcha el entorno de desarrollo tanto para el backend como para el frontend.

---

## 📋 Prerrequisitos

Asegúrate de tener instaladas las siguientes herramientas en tu sistema:

*   **Python 3.11+** (con `venv` o `conda`)
*   **Node.js 18+** (con `npm` o `yarn`)
*   **PostgreSQL 15+** (servidor corriendo localmente)
*   **Git**

---

## 1. Configuración de Base de Datos

Antes de levantar el backend, necesitas una base de datos PostgreSQL.

1.  Crea una base de datos vacía llamada `foodstore_db` (o el nombre que prefieras).
2.  Asegúrate de tener el servidor PostgreSQL corriendo.

---

## 2. Backend (API)

El backend es una API con FastAPI.

```bash
# 1. Entra al directorio
cd backend

# 2. Crea y activa el entorno virtual
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instala dependencias
pip install -r requirements.txt

# 4. Configura variables de entorno
# Copia el archivo de ejemplo y edítalo con tus credenciales de DB
cp .env.example .env

# 5. Aplica migraciones (alembic)
alembic upgrade head

# 6. Semilla la base de datos (roles y datos iniciales)
python -m app.db.seed

# 7. Ejecuta el servidor
uvicorn app.main:app --reload
```
*La API estará disponible en `http://localhost:8000`. Docs: `http://localhost:8000/docs`*

---

## 3. Frontend (Web)

El frontend es una aplicación React con Vite.

```bash
# 1. Entra al directorio
cd frontend

# 2. Instala dependencias
npm install

# 3. Configura variables de entorno
# Copia el archivo de ejemplo
cp .env.example .env
# Verifica que VITE_API_BASE_URL apunte a http://localhost:8000/api/v1

# 4. Ejecuta el servidor de desarrollo
npm run dev
```
*El frontend estará disponible en `http://localhost:5173`*

---

## 4. Desarrollo con Docker (Stack Completo)

Si prefieres levantar todo el stack (backend, frontend y base de datos) usando Docker:

```bash
# 1. Asegúrate de tener Docker Desktop corriendo

# 2. Levanta todo el stack en segundo plano
docker-compose up -d

# 3. Verifica que los servicios estén arriba
docker-compose ps
```

*   **Backend**: `http://localhost:8000`
*   **Frontend**: `http://localhost:5173`
*   **Base de datos**: `localhost:5433` (Postgres)

Para detener los servicios:
```bash
docker-compose down
```

---

## 🛠 Comandos Útiles

### Backend
*   `pytest`: Ejecuta todos los tests (unitaríos e integración).
*   `alembic upgrade head`: Aplica migraciones pendientes.

### Frontend
*   `npm run test`: Ejecuta los tests de componentes.
*   `npm run build`: Genera el build de producción.
*   `npm run lint`: Ejecuta el linter.

---

## ⚠️ Resolución de Problemas

1.  **Error de conexión DB**: Revisa tu `.env` en `/backend`. Asegúrate de que `DATABASE_URL` sea correcto.
2.  **CORS Errors**: Verifica que `VITE_API_BASE_URL` en `/frontend/.env` coincida con la URL donde corre tu backend.
3.  **Dependencias faltantes**: Si instalaste todo y sigue fallando, prueba borrar la carpeta `venv` (backend) o `node_modules` (frontend) y re-instalar.

¡Cualquier duda, fijate los `README.md` específicos de cada carpeta para más detalles técnicos!
