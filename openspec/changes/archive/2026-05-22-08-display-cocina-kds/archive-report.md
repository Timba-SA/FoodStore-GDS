# Archive Report — Display de Cocina (KDS) & Rol Cocinero

**Change:** `08-display-cocina-kds`  
**Status:** `ARCHIVED / CLOSED`  
**Date:** 2026-05-21  

---

## 1. Closure Summary

La funcionalidad **Display de Cocina (KDS)** y la integración del rol **Cocinero (`cocina`)** se declaran oficialmente **cerradas, verificadas e integradas** de forma exitosa en el repositorio de Food Store. Todos los entregables estipulados en la Épica 8 han sido construidos con calidad de nivel arquitectónico senior, pasando el 100% de las pruebas automatizadas del backend y compilando limpiamente en el frontend.

---

## 2. Impacted and Added Artifacts

A continuación se resume el inventario de recursos desarrollados bajo este cambio:

### Backend (FastAPI + SQLModel + Alembic)
*   **Seguridad / Modelos:**
    *   `backend/app/db/models/usuario.py`: Incorporación del rol `cocina` en `RolEnum`.
    *   `backend/app/db/models/producto.py`: Adición del campo `disponible: bool = Field(default=True, index=True)`.
*   **Base de Datos & Semilla:**
    *   `backend/app/db/seed.py`: Sembrado de rol `cocina` y del usuario de prueba `cocina@foodstore.com`.
    *   `backend/alembic/versions/`: Generación de la migración correspondiente para las nuevas columnas y tablas.
*   **Lógica de Negocio (FSM):**
    *   `backend/app/modules/pedidos/service.py`: Restricciones FSM de transiciones para cocina (`confirmado -> en_preparacion -> en_camino`) y registro de auditoría (`usuario_id`).
*   **Manejo de WebSockets & Rutas KDS:**
    *   `backend/app/modules/cocina/service.py`: `ConnectionManager` con soporte de concurrencia y locks asíncronos (`asyncio.Lock`).
    *   `backend/app/modules/cocina/router.py`: Endpoints REST (`/pedidos`, `/productos/{id}/disponibilidad`) y canal WebSocket (`/ws` con verificación JWT).
    *   `backend/app/main.py`: Registro del router de cocina.
*   **Pruebas Automatizadas (Strict TDD):**
    *   `backend/tests/test_cocina.py`: Suite consolidada de 101 tests corriendo y pasando de manera exitosa.

### Frontend (React 18 + TypeScript + Zustand + React Query)
*   **Configuración y Ruteo (FSD):**
    *   `frontend/src/app/routes/router.tsx`: Ruta protegida `/cocina` para roles `['admin', 'pedidos', 'cocina']`.
    *   `frontend/src/shared/components/layout/navigation.ts`: Menú "Pantalla Cocina" visible condicionalmente.
*   **Estructura del Feature KDS (`frontend/src/features/cocina/`):**
    *   `types.ts`: Tipados TypeScript de pedidos, detalles y mensajes WS.
    *   `api/cocinaApi.ts`: Clientes Axios y hooks de TanStack Query para fetching y mutaciones de estado de pedidos y disponibilidad de productos.
    *   `utils/audioAlert.ts`: Sintetizador programático nativo mediante **Web Audio API** para alerta de nuevos pedidos (acorde D5 y A5 con decaimiento exponencial).
    *   `components/SoundToggle.tsx`: Toggle interactivo persistido en `localStorage` ('kds_sound_enabled').
    *   `hooks/useKdsSocket.ts`: Manejo de conexiones WS con reconexión exponencial y fallback a polling REST de 30s en caso de desconexión.
    *   `components/KdsCard.tsx`: Tarjeta interactiva con temporizador recalculado cada 15s y tres niveles cromáticos de advertencia (Slate, Orange, Red-pulsante).
*   **Páginas:**
    *   `frontend/src/pages/CocinaPage.tsx`: Layout principal del KDS Dashboard (vista de dos columnas FIFO) con panel lateral deslizante de disponibilidad de productos.

---

## 3. Key Learnings & Gotchas

1.  **Compatibilidad Python 3.13 con SQLAlchemy:**
    *   *Gotcha:* Las versiones antiguas de SQLAlchemy (como la `2.0.25` declarada originalmente) lanzan un error de aserción crítico en el analizador de metadatos de tipos con Python 3.13.
    *   *Solución:* Se actualizó el entorno local a SQLAlchemy `>= 2.0.35` (en concreto `2.0.49`). Se recomienda no hacer downgrade de esta dependencia en desarrollos futuros.
2.  **Autenticación de WebSockets en Windows:**
    *   *Gotcha:* El paso de tokens mediante headers personalizados durante el handshake de WebSocket nativo del navegador no es soportado.
    *   *Solución:* Se adoptó la especificación robusta de inyectar el JWT en el query string (`?token=<JWT>`), el cual es extraído y decodificado de forma segura por el router de FastAPI.
3.  **Restricciones de Web Audio API:**
    *   *Gotcha:* Los navegadores modernos bloquean la reproducción de audio sintético si no hay una interacción inicial del usuario (click/tap) en la pantalla.
    *   *Solución:* El KDS incluye controles interactivos y acciones que garantizan que el `AudioContext` se reanude automáticamente al primer click del operario.
4.  **Ejecución de pytest en Windows:**
    *   *Gotcha:* Ejecutar directamente `pytest` puede fallar al resolver la ubicación del módulo `app`.
    *   *Solución:* Correr siempre mediante el módulo Python: `venv\Scripts\python -m pytest tests/ -v`.

---

## 4. Final Sign-off

Este incremento de software representa una evolución significativa de la plataforma, añadiendo soporte completo para el personal de cocina, mejorando la operatividad de los pedidos y dotando al sistema de una interfaz premium de alta fidelidad, interactiva y robusta. 

**¡Excelente laburo en equipo! Todo listo para producción.**
