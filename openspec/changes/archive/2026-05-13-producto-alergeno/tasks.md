# Tasks: Producto Alérgeno Manual

- [x] Modificar `backend/app/db/models/producto.py`: Añadir `es_alergeno`.
- [x] Generar migración Alembic `alembic revision --autogenerate -m "add es_alergeno to producto"`.
- [x] Aplicar migración Alembic `alembic upgrade head`.
- [x] Modificar `backend/app/modules/productos/schemas.py`: Añadir campo en `ProductoCreate`, `ProductoUpdate`, `ProductoResponse`.
- [x] Modificar `backend/app/modules/productos/service.py`: Actualizar lógica de filtrado en `get_all`.
- [x] Modificar `frontend/src/entities/producto/types.ts`: Añadir tipados.
- [x] Modificar `frontend/src/features/productos/ProductoFormModal.tsx`: Añadir UI del checkbox naranja.
