# Plan de Trabajo y Lista de Tareas: Display de Cocina (KDS) y Rol Cocinero

**ID de Cambio**: `08-display-cocina-kds`  
**Estado**: Planificado (`tasks`)  
**Fecha**: 2026-05-21

Este documento establece la hoja de ruta secuencial y atómica para la implementación completa del Kitchen Display System (KDS) y el rol operativo `cocina` en la plataforma Food Store. Debido a que el repositorio opera bajo **Strict TDD Mode**, la Phase 5 (Pruebas Automatizadas) debe implementarse en código (Estado Rojo) antes del desarrollo funcional de las características operativas de backend.

---

## Fases de Implementación

### Fase 1: Configuración de Base de Datos y Sembrado (DB & Security Setup)

Esta fase inicial sienta las bases en el modelo relacional y de negocio para soportar la columna de disponibilidad temporal de productos, el nuevo rol de usuario y el sembrado inicial en desarrollo/testing.

- [ ] **T1.1 — Añadir el rol de cocina al enumerado de roles de usuario**
  * **Archivo**: [usuario.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/db/models/usuario.py)
  * **Acción**: Incorporar la constante `COCINA = "cocina"` en la clase `RolEnum` para habilitar el tipado del rol en minúsculas coherente con el esquema de base de datos.
- [ ] **T1.2 — Agregar campo de disponibilidad temporal en la tabla de productos**
  * **Archivo**: [producto.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/db/models/producto.py)
  * **Acción**: Declarar en `Producto` el campo `disponible: bool = Field(default=True)` mapeado con `Column(Boolean, nullable=False, server_default="true")`. Definir un índice de base de datos sobre la columna (`idx_productos_disponible`) para optimizar el filtro en consultas del catálogo general de e-commerce.
- [ ] **T1.3 — Generar la migración de base de datos con Alembic**
  * **Archivo**: `backend/alembic/versions/08_display_cocina_kds.py`
  * **Acción**: Codificar una revisión de Alembic portable e idempotente que agregue la columna `disponible` a la tabla `productos` con valor por defecto `true` y cree el índice correspondiente de forma segura sin interrupciones transaccionales.
- [ ] **T1.4 — Registrar el rol de cocina y usuario semilla en el script de seed**
  * **Archivo**: [seed.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/db/seed.py)
  * **Acción**: Extender `roles_data` en `seed_database()` incorporando el rol `"cocina"` con descripción detallada. Insertar de manera idempotente un usuario de prueba `"cocina@foodstore.com"` con hashed password `"password"`, vinculándolo automáticamente a dicho rol a través de la tabla relacional `usuario_roles`.

---

### Fase 2: Lógica FSM y Servicios Backend (Backend FSM & API Endpoints)

Esta fase comprende la orquestación asíncrona de WebSockets seguros en cocina y las restricciones estrictas de la FSM de pedidos con inyección de auditoría.

- [ ] **T2.1 — Diseñar el gestor de conexiones WebSocket concurrente**
  * **Archivo**: [service.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/modules/cocina/service.py) *(Nuevo Archivo)*
  * **Acción**: Programar la clase `ConnectionManager` implementando `asyncio.Lock` para garantizar mutación thread-safe del conjunto de sockets activos. Implementar `connect()`, `disconnect()`, un wrapper resiliente `_send_json_safe()` que capture errores de red y purgue sockets rotos, y `broadcast()` no bloqueante. Instanciar y exportar la instancia global `cocina_ws_manager`.
- [ ] **T2.2 — Modificar el avance de estados (FSM) de pedidos para soportar auditoría y control de rol de cocina**
  * **Archivo**: [service.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/modules/pedidos/service.py)
  * **Acción**: Optimizar el método `avanzar_estado` para:
    1. Recibir `usuario_roles: List[str]` y `usuario_id: int` del operario logueado.
    2. Validar que si el usuario tiene exclusivamente el rol `"cocina"`, el backend rechace cualquier transición excepto `confirmado -> en_preparacion` o `en_preparacion -> en_camino`, lanzando `PermissionError`.
    3. Registrar la transición de forma auditable en `HistorialEstadoPedido` enlazando el `usuario_id`.
    4. Invocar `cocina_ws_manager.broadcast` en segundo plano mediante `asyncio.create_task` emitiendo payloads estructurados discriminados por evento (`PEDIDO_CONFIRMADO`, `PEDIDO_EN_PREPARACION`, `PEDIDO_EN_CAMINO`, `PEDIDO_CANCELADO`).
- [ ] **T2.3 — Implementar las rutas y endpoints API del módulo cocina**
  * **Archivo**: [router.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/modules/cocina/router.py) *(Nuevo Archivo)*
  * **Acción**: Implementar:
    1. `GET /cocina/pedidos`: Lista pedidos activos en estado `confirmado` o `en_preparacion`, ordenados FIFO por `created_at` del estado `confirmado`. Protegido con `require_role(["cocina", "pedidos", "admin"])`.
    2. `PATCH /cocina/productos/{producto_id}/disponibilidad`: Apagado o encendido rápido de stock temporal de producto (modifica la columna `disponible` en base de datos). Protegido con `require_role(["cocina", "stock", "admin"])`.
    3. `WS /cocina/ws`: Endpoint de WebSocket que realiza validación por firma de token JWT mediante query parameter `token`, verificando los permisos de rol correspondientes antes del handshake HTTP Upgrade.
- [ ] **T2.4 — Registrar el enrutador de cocina en el servidor principal**
  * **Archivo**: [main.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/app/main.py)
  * **Acción**: Importar `router` de cocina y montarlo de forma consistente bajo el prefijo de la versión de la API de producción (`/api/v1`).

---

### Fase 3: Scaffolding de Rutas y Tipos del Frontend (Frontend FSD Scaffolding)

Establecimiento de las estructuras iniciales en React cumpliendo rigurosamente con la arquitectura de Feature-Sliced Design (FSD).

- [ ] **T3.1 — Configurar el enrutamiento protegido y menús en la aplicación React**
  * **Archivo**: [navigation.ts](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/frontend/src/shared/components/layout/navigation.ts)
  * **Acción**: Añadir el enlace `/cocina` con etiqueta "Consola Cocina" visible de forma exclusiva a operarios autorizados.
  * **Archivo**: [router.tsx](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/frontend/src/app/routes/router.tsx)
  * **Acción**: Registrar la página `/cocina` (apuntando a `CocinaPage`) y envolverla bajo la protección de autenticación `ProtectedRoute` con roles requeridos (`cocina`, `pedidos`, `admin`).
- [ ] **T3.2 — Declarar contratos de tipos e interfaces de TypeScript para cocina**
  * **Archivo**: `frontend/src/features/cocina/types.ts` *(Nuevo Archivo)*
  * **Acción**: Declarar las estructuras tipadas para KDS: `KdsOrderDetail`, `KdsOrder`, `CocinaProductUpdate` y los eventos discriminados del WebSocket `WsEvent`.
- [ ] **T3.3 — Crear la API cliente de cocina e integraciones con TanStack Query**
  * **Archivo**: `frontend/src/features/cocina/api/cocinaApi.ts` *(Nuevo Archivo)*
  * **Acción**: Programar llamadas Axios parametrizadas para obtener los pedidos de cocina activos e impactar de forma instantánea cambios de disponibilidad en productos. Diseñar ganchos TanStack Query (`useQuery` y `useMutation`) con revalidación optimizada.

---

### Fase 4: Vista KDS, Controladores y Resiliencia (Frontend KDS View & Resiliencia)

Construcción del display reactivo de cocina con alarmas sonoras nativas y modo híbrido resiliente frente a cortes de red.

- [ ] **T4.1 — Construir el Layout de Cocina KDS de doble columna en React**
  * **Archivo**: [CocinaPage.tsx](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/frontend/src/pages/cocina/CocinaPage.tsx) *(Nuevo Archivo)*
  * **Acción**: Crear el layout responsivo en pantalla completa con dos columnas verticales independientes para priorización FIFO: "Pendientes por Preparar" (`confirmado`) y "En Preparación" (`en_preparacion`). Implementar la barra superior informativa y controles globales.
- [ ] **T4.2 — Programar el componente de Tarjeta de Pedido con timers reactivos**
  * **Archivo**: `frontend/src/features/cocina/components/KdsCard.tsx` *(Nuevo Archivo)*
  * **Acción**: Crear el componente `KdsCard` que detalle ítems, exclusiones, notas especiales y monte un intervalo reactivo con `setInterval` cada 15 segundos para calcular la urgencia basándose en `created_at` del estado `confirmado`:
    - `< 10 min`: Estilo estándar (blanco).
    - `10-20 min`: Fondo naranja suave e icono de advertencia (`bg-orange-50 text-orange-900 border-orange-400`).
    - `> 20 min`: Fondo rojo con pulso intermitente de alerta (`bg-red-50 text-red-900 border-red-400 animate-pulse`).
- [ ] **T4.3 — Implementar las alertas acústicas programáticas mediante Web Audio API**
  * **Archivo**: `frontend/src/features/cocina/utils/audioAlert.ts` *(Nuevo Archivo)*
  * **Acción**: Diseñar la función `playIncomingOrderSound` sintetizando un acorde armónico con dos osciladores nativos del navegador en D5 (587.33 Hz) y A5 (880.00 Hz) y decaimiento exponencial del volumen sobre un nodo de ganancia a lo largo de 0.6s. Respetar la preferencia de audio guardada en `localStorage.getItem("kds_sound_enabled")`.
  * **Archivo**: `frontend/src/features/cocina/components/SoundToggle.tsx` *(Nuevo Archivo)*
  * **Acción**: Desarrollar el componente del interruptor de sonido persistiendo el estado boleano en `localStorage` con la clave `"kds_sound_enabled"`.
- [ ] **T4.4 — Programar el Hook resiliente de WebSocket con fallback automático por Polling y Backoff**
  * **Archivo**: `frontend/src/features/cocina/hooks/useKdsSocket.ts` *(Nuevo Archivo)*
  * **Acción**: Diseñar el flujo reactivo de tiempo real con resguardo de desconexión:
    1. Petición HTTP inicial limpia.
    2. Conexión WebSocket con token adjunto.
    3. Al detectar corte de canal (`onclose`/`onerror`), transicionar al modo resguardo iniciando un `setInterval` de polling HTTP cada 30 segundos junto con la alerta visual.
    4. Disparar reconexiones de backoff exponencial en background (2s, 4s, 8s,..., hasta tope de 30s).
    5. Al recuperar la señal de socket, apagar el polling de resguardo, sincronizar de forma asíncrona datos omitidos y apagar la advertencia.

---

### Fase 5: Pruebas Automatizadas (Tests - Strict TDD Mode)

De acuerdo al protocolo de **Strict TDD Mode**, todos los archivos de tests deben ser desarrollados previamente a las fases operativas funcionales, asegurando que fallen inicialmente de manera controlada.

- [ ] **T5.1 — Escribir tests para endpoints de Seguridad REST (RBAC Guard)**
  * **Archivo**: [test_cocina.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/tests/test_cocina.py) *(Nuevo Archivo)*
  * **Acción**: Desarrollar pruebas unitarias que validen la protección de los endpoints del KDS:
    - Comprobar que un token con rol de cliente (`client`) obtenga un estricto **HTTP 403 Forbidden** al realizar `GET /api/v1/cocina/pedidos` o `PATCH /api/v1/cocina/productos/{id}/disponibilidad`.
    - Comprobar que la omisión de cabecera de autenticación arroje **HTTP 401 Unauthorized**.
- [ ] **T5.2 — Escribir tests de integración de la Máquina de Estados Finitos (FSM) y Auditoría**
  * **Archivo**: [test_cocina.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/tests/test_cocina.py)
  * **Acción**: Desarrollar pruebas que validen la rigurosidad de las transiciones operativas de cocina:
    - Simular a un operario con rol exclusivo de `"cocina"` realizando las transiciones `confirmado -> en_preparacion` y `en_preparacion -> en_camino`, y verificar que el estado del pedido cambie efectivamente en la base de datos simulada.
    - Validar que al completarse una transición exitosa por el cocinero, se inserte un registro en `HistorialEstadoPedido` guardando el `usuario_id` exacto para la auditoría operativa.
    - Comprobar que intentos de transiciones no autorizadas para cocina (ej. saltar directamente de `confirmado` a `en_camino`, o intentar una cancelación) resulten en un error **HTTP 403 Forbidden** manteniendo el estado original intacto.
- [ ] **T5.3 — Escribir tests de integración para Handshake e integridad de WebSocket**
  * **Archivo**: [test_cocina.py](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/tests/test_cocina.py)
  * **Acción**: Desarrollar pruebas utilizando `client.websocket_connect` para simular conexiones en tiempo real:
    - Asegurar que la ausencia del parámetro `token` en la query string resulte en un rechazo inmediato cerrando la conexión con código de violación de políticas (WS 1008).
    - Asegurar que tokens válidos del rol `client` sean denegados.
    - Comprobar concurrentemente que una vez establecida una sesión de socket válida con rol `cocina`, cualquier transición del pedido a `confirmado` gatillada en el cliente HTTP normal dispare una transmisión de broadcast con el payload estructurado `PEDIDO_CONFIRMADO` y valide la integridad estricta del JSON según la especificación.
