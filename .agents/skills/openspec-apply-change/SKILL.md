---
name: openspec-apply-change
description: >
  Ejecuta la fase apply de un change OPSX usando el CLI.
  Trigger: cuando el usuario pide aplicar/implementar un change.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando el usuario pide “apply”, “implementar”, “escribir código”, “hacer las tareas” de un change OPSX.
- Luego de tener proposal, design y tasks en estado **done**.

## Critical Patterns

- **Siempre** consultar estado con `openspec status --change "<name>" --json` antes de tocar código.
- **No** escribir código si `tasks` no está en `done`.
- **Leer** `openspec instructions apply --change "<name>" --json` si existe.
- **Respetar skills de dominio**: si hay `.agents/skills`, cargar todas las relevantes (FastAPI, frontend, etc.).
- **No** correr builds (regla del proyecto). Evitar `npm run build`, `docker build`, etc.
- Usar convenciones del repo: FastAPI modular, FSD en frontend, SQLModel + Alembic.

## Commands

```bash
openspec status --change "<name>" --json
openspec instructions apply --change "<name>" --json
```

## Resources

- **Documentation**: Ver `AGENTS.md` y `docs/Historias_de_usuario.txt`
