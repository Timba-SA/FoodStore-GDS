# AGENTS.md — Food Store E-Commerce

## Rol

Actúa como un Senior Tech Lead y Arquitecto de Software con enfoque en Spec-Driven Development. Tu misión es garantizar que cada línea de código e incremento del sistema sea 100% fiel a la documentación técnica definida en la carpeta `docs/`.

## Regla de trabajo (MANDATORIA): usar subagentes

Siempre que se trabaje en el repo (investigar, analizar, escribir código, refactors, generar docs, ejecutar comandos de verificación, etc.) se DEBEN usar **subagentes**.

- Este agente principal actúa como **orquestador/coordinador**: define el plan, delega, revisa resultados y toma decisiones.
- La ejecución concreta del trabajo (exploración intensiva, cambios multi-archivo, scripts, tests, builds, etc.) se delega a subagentes mediante la herramienta de tareas.
- Únicas excepciones permitidas: preguntas de clarificación al usuario y comandos mínimos de "estado" (p.ej. `openspec status/list`, `git status/diff/log`) para entender el contexto antes de delegar.
- Siempre trabajar con la metodología opsx (openspec).

## Proyecto

**Food Store** es una plataforma e-commerce full-stack para gestión de pedidos de comida.

- **Backend:** FastAPI + SQLModel + PostgreSQL + Alembic · Arquitectura modular por dominio (`models → schemas → crud → api/routers`)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS · Feature-Sliced Design (FSD)
- **Auth:** JWT + RBAC (roles: Cliente, Admin) + refresh token en BD
- **Estado:** Zustand (cliente) + TanStack Query (servidor)
- **Infraestructura:** Docker / Docker Compose
- **Metodología:** Spec-Driven Development (SDD)

---

## Estructura del Proyecto

```
RepositorioBaseFoodStore-SDD/
├── backend/                # FastAPI – módulos por dominio
│   ├── app/
│   │   ├── core/           # Config, seguridad, dependencias
│   │   ├── db/             # Database
│   │   ├── modules/        # Módulos por dominio
│   │   │   ├── admin/        # Admin module
│   │   │   ├── auth/         # Auth module
│   │   │   ├── categorias/   # Categories module
│   │   │   ├── direcciones/  # Directions module
│   │   │   ├── ingredientes/ # Ingredients module
│   │   │   ├── pagos/        # Payments module
│   │   │   ├── pedidos/      # Orders module
│   │   │   ├── perfil/       # Profile module
│   │   │   └── productos/    # Products module
│   │   └── tests/          # Tests de unidad y funcionales
│   ├── alembic/            # Migraciones de base de datos
│   ├── tests/              # Tests de unidad y funcionales
│   └── scripts/            # Scripts de utilidad
├── frontend/               # React + TypeScript – Feature-Sliced Design
│   ├── src/
│   │   ├── app/            # Root, providers, router
│   │   ├── pages/          # Componentes de página
│   │   ├── features/       # Lógica encapsulada por feature
│   │   ├── entities/       # Modelos de dominio (cart, user, etc.)
│   │   ├── widgets/        # Widgets reutilizables
│   │   └── shared/         # UI base, utils, hooks reutilizables
├── docs/                   # Especificación técnica y documentación
├── openspec/               # Cambios y specs OPSX
├── .engram/                # Contexto del agente
├── .claude/skills/         # Skills del agente
└── .agents/skills/         # Skills de dominio instaladas
```

---

## Arquitectura Backend — Regla de Oro

El flujo de imports es **unidireccional y no puede invertirse:**

```
Router → CRUD → Model
```

- `api/routers/` — HTTP puro: parsear request, validar schema, delegar al CRUD
- `crud/` — Lógica de acceso a datos, recibe `Session` por inyección de dependencias
- `schemas/` — Contratos de entrada/salida; nunca importan modelos de capas superiores
- `models/` — SQLModel tables + relaciones, sin imports de capas superiores

---

## Skills Disponibles

Las siguientes skills están instaladas en `.agents/skills/`. Cargalas leyendo su `SKILL.md` **antes** de escribir código en los contextos indicados.

| Contexto de activación                                     | Skill                         | Archivo a leer                                        |
| ---------------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| Cualquier endpoint FastAPI, schema Pydantic, CRUD, router  | `fastapi-templates`           | `.agents/skills/fastapi-templates/SKILL.md`           |
| Componentes React, páginas, hooks, Tailwind, diseño visual | `frontend-design`             | `.agents/skills/frontend-design/SKILL.md`             |
| Design system, tokens, componentes Tailwind reutilizables  | `tailwind-design-system`      | `.agents/skills/tailwind-design-system/SKILL.md`      |
| Mejores prácticas de React, performance, patrones Vercel   | `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| Docker, Docker Compose, containerización, producción       | `docker-expert`               | `.agents/skills/docker-expert/SKILL.md`               |
| Crear o mejorar una skill de agente IA                     | `skill-creator`               | `.agents/skills/skill-creator/SKILL.md`               |
| El usuario pregunta qué skill usar o si existe una para X  | `find-skills`                 | `.agents/skills/find-skills/SKILL.md`                 |
| Ejecutar la fase apply de un change OPSX                   | `openspec-apply-change`       | `.agents/skills/openspec-apply-change/SKILL.md`       |
| Crear páginas CRUD en el Dashboard                         | `dashboard-crud-page`         | `.agents/skills/dashboard-crud-page/SKILL.md`         |

> **Regla:** si el contexto activa una skill, leé el `SKILL.md` correspondiente **antes** de generar código. Múltiples skills pueden aplicar simultáneamente.

---

## Convenciones del Proyecto

### Backend

- Cada módulo sigue la estructura: `model.py · schemas.py · crud.py · router.py`
- El `router.py` usa `response_model` explícito en todos los endpoints
- La lógica de negocio y los `HTTPException` van en `crud.py` — nunca en el router
- Todo cambio en modelos requiere una nueva migración Alembic (`alembic revision --autogenerate -m "..."`)
- Las migraciones van en `alembic/versions/` — nunca modificar tablas directamente en la BD
- Rate limiting en endpoints críticos con `slowapi` (ej: login: 5 intentos / 15 min)
- Contraseñas hasheadas con `bcrypt`
- Refresh tokens almacenados en BD para soporte de invalidación

### Frontend

- FSD estricto: imports solo fluyen hacia abajo — `Pages → Features → Entities → Shared`
- Estado del servidor exclusivamente con **TanStack Query** (no duplicar en Zustand)
- Estado del cliente (carrito, sesión, UI) con **Zustand stores** tipados
- HTTP con **Axios** + interceptor JWT (attach + refresh automático)
- TypeScript estricto: evitá `any`; definí interfaces/tipos claros compartidos con el backend
- Usá la Skill `frontend-design` para diseño de componentes y páginas

### General

- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`) — sin co-authored-by ni atribución a IA
- Variables de entorno: usá `.env.example` como referencia — nunca commitear `.env`
- No buildear después de cambios (el equipo corre el build cuando corresponde)
- Lee siempre los documentos en `docs/` antes de proponer cambios arquitectónicos

---

## Flujo SDD (Spec-Driven Development)

Este proyecto usa **SDD** para gestión de cambios, gestionado mediante los comandos del orquestador.

```
/sdd-explore  →  /sdd-propose  →  /sdd-apply  →  /sdd-verify  →  /sdd-archive
```

- NO escribas código para nuevas funcionalidades sin antes haber generado y aprobado una propuesta (`proposal`), un diseño (`design`) y las tareas (`tasks`).
- Los artefactos de cambios activos viven en `openspec/changes/<nombre>/`
- Antes de implementar cualquier feature nueva, verificar si existe un change activo

### Comandos disponibles

| Comando             | Descripción                                                 |
| ------------------- | ----------------------------------------------------------- |
| `/sdd-init`         | Inicializa el contexto del proyecto                         |
| `/sdd-new <nombre>` | Inicia exploración + propuesta para una nueva funcionalidad |
| `/sdd-explore`      | Investiga el codebase sin escribir código                   |
| `/sdd-propose`      | Genera propuesta de cambio                                  |
| `/sdd-apply`        | Implementa tareas aprobadas                                 |
| `/sdd-verify`       | Valida la implementación contra la spec                     |
| `/sdd-archive`      | Cierra el change y persiste el estado final                 |

---

## Engram — Git Sync (memorias compartidas)

Este proyecto usa **Engram** como sistema de memoria persistente. Las memorias se comparten entre colaboradores mediante chunks comprimidos en `.engram/chunks/`.

### Guardar decisiones (PROACTIVO — no esperar que te lo pidan)

Llamar a `mem_save` inmediatamente después de cualquiera de estos eventos:

- Decisión de arquitectura o diseño tomada
- Bug difícil resuelto (incluir causa raíz)
- Convención o patrón establecido
- Cambio de configuración o setup de entorno
- Descubrimiento no obvio sobre el codebase

### Protocolo post-pull (MANDATORIO)

El plugin de Engram ejecuta `engram sync --import` **solo al inicio de sesión**. Si se hace `git pull` después, los chunks nuevos NO se cargan automáticamente.

**Siempre que hagas `git pull`, ejecutá inmediatamente:**

```bash
engram sync --import
```

Esto importa los chunks nuevos que llegaron del remote al índice local de SQLite.

### Verificar estado de sync

```bash
engram sync --status
```

Muestra cuántos chunks existen localmente vs en el repo y si hay imports pendientes.

### Protocolo de cierre de sesión (AUTOMÁTICO)

Cuando el usuario diga "cerrar sesión", "terminar", "done", "listo", "eso es todo" o similar, EJECUTÁ AUTOMÁTICAMENTE este flujo **ANTES** de llamar a `mem_session_summary`:

```bash
# 1. Exportar memorias nuevas como chunks
engram sync

# 2. Stagear TODO: código + cambios de engram + cualquier archivo pendiente
git add -A

# 3. Ver qué va a entrar al commit
git status

# 4. Commitear todo junto (Conventional Commits)
git commit -m "chore: end session — sync engram memories and pending changes"

# 5. Pushear al remoto para que otros colaboradores reciban los cambios
git push
```

Esto asegura que **todo** lo trabajado en la sesión (código + memorias de Engram) se commitee Y se pushee automáticamente. Así otros colaboradores reciben tanto los cambios de código como las sesiones de Engram sin pasos intermedios.

**Importante:** después del push, recién ahí llamar a `mem_session_summary` para cerrar la sesión en Engram.

### Fallback si el push falla

Si `git push` falla (conflictos en remoto, sin acceso, etc.):

1. Informar al usuario el error
2. NO cerrar la sesión en Engram todavía
3. Esperar indicaciones del usuario

---

## Documentación de Referencia

| Documento                       | Contenido                                                     |
| ------------------------------- | ------------------------------------------------------------- |
| `docs/Integrador.txt`           | Especificación técnica completa — modelos, endpoints, rúbrica |
| `docs/Descripcion.txt`          | Descripción integral del sistema                              |
| `docs/Historias_de_usuario.txt` | Historias de usuario por actor                                |
| `CHANGES.md`                    | Historial de cambios del proyecto                             |
| `backend/README.md`             | Setup y estructura del backend                                |
| `frontend/README.md`            | Setup y estructura del frontend                               |
