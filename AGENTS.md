# 🤖 Agent Instructions (AGENTS.md)

## 📌 Contexto del Proyecto

**Nombre**: Food Store E-Commerce
**Arquitectura**: Frontend (React + TS + Vite) | Backend (FastAPI + SQLModel + PostgreSQL)
**Metodología**: Spec-Driven Development (SDD)

Este archivo define las reglas de comportamiento para cualquier asistente de IA o agente (como Claude Code, Cursor, Roo, Mission Control u orquestadores) que opere en este repositorio.

---

## 🏗️ Stack Tecnológico

- **Frontend**: React, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS, Axios.
- **Backend**: FastAPI, SQLModel, PostgreSQL, Alembic, bcrypt, python-jose, slowapi.
- **Infraestructura**: Docker / Docker Compose.

---

## 📋 Reglas Fundamentales (MANDATORY)

1. **Spec-Driven Development (SDD)**
   - NO escribas código para nuevas funcionalidades sin antes haber generado y aprobado una propuesta (`proposal`), un diseño (`design`) y las tareas (`tasks`).
   - Lee siempre los documentos en la carpeta `docs/` (`Descripcion.txt`, `Integrador.txt`, `Historias_de_usuario.txt`) y `CHANGES.md` antes de proponer cambios arquitectónicos.

2. **Backend (FastAPI)**
   - Usa **SQLModel** para definir modelos de base de datos.
   - Todo cambio en los modelos requiere crear una nueva migración con **Alembic** (`alembic revision --autogenerate -m "..."`).
   - Usa inyección de dependencias para manejar la sesión de la base de datos (`Session`).
   - Sigue la arquitectura modular existente: `models`, `schemas`, `crud`, `api/routers`.
   - Usa la Skill "fastapi-templates" para implementar mejores prácticas de FastAPI.

3. **Frontend (React)**
   - Usa **FSD (Feature-Sliced Design)** para organizar el código.
   - Manejo de estado del servidor: **TanStack Query**.
   - Manejo de estado del cliente global: **Zustand**.
   - Usa TypeScript estricto. Evitá usar `any`. Define interfaces/tipos claros para las respuestas de la API compartidas con el backend.
   - Usa la Skil "frontend-design" para el diseño de componentes y páginas.
   - Usa la Skill "vercel-react-best-practices" para implementar mejores prácticas de React.

4. **Persistencia y Memoria**
   - Registrá siempre las decisiones arquitectónicas importantes usando el sistema de memoria correspondiente (ej. Engram en Agent Teams Lite).
   - Documentá los bugs difíciles que soluciones para mantener el contexto histórico.

5. **Git y Commits**
   - Usá Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).
   - NUNCA agregues atribuciones a la IA (ej: "Co-Authored-By: AI") en los mensajes de commit.

6. **Skills**
    - Las skills disponibles son:
      - "fastapi-templates" para implementar mejores prácticas de FastAPI.
      - "frontend-design" para el diseño de componentes y páginas.
      - "vercel-react-best-practices" para implementar mejores prácticas de React y Vercel.
      - "docker-expert" para implementar mejores prácticas de Docker y Docker Compose.
      - "find-skills" para encontrar skills disponibles.
      - "openspec-apply-change" para ejecutar la fase apply de un change OPSX.

---

## 🛠️ Comandos de Flujo (Agent Teams / SDD)

- `/sdd-init`: Inicializa el contexto del proyecto.
- `/sdd-new <nombre>`: Inicia la exploración y propuesta para una nueva funcionalidad.
- `/sdd-explore`, `/sdd-propose`, `/sdd-apply`, `/sdd-verify`: Fases del ciclo SDD.
