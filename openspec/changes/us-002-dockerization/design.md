# Design: US-002-dockerization

## Architecture Overview
The solution uses a three-tier Docker Compose architecture:
1. **Backend Service**: FastAPI container with multi-stage build.
2. **Frontend Service**: React/Vite container serving static files via Nginx.
3. **Database Service**: PostgreSQL container for data persistence.

## Components

### Backend Container
- **Responsibility**: Run the FastAPI application.
- **Dockerfile**:
  - Stage 1: Build (install deps, compile).
  - Stage 2: Runtime (distroless or slim python image).
- **Interface**: Exposes port 8000.

### Frontend Container
- **Responsibility**: Serve the built React application.
- **Dockerfile**:
  - Stage 1: Build (npm install, npm run build).
  - Stage 2: Nginx (serve `/dist` folder).
- **Interface**: Exposes port 80.

### Database Container
- **Responsibility**: Persistent storage for application data.
- **Image**: `postgres:15-alpine`.
- **Interface**: Internal network, persists data to a named Docker volume.

## Data Model
No changes to application data model. Persistence managed via Docker volumes.

## API Changes
No changes to API contracts. Frontend will communicate with Backend via internal Docker network.

## Implementation Notes
- Use `.dockerignore` files to prevent copying `node_modules`, `__pycache__`, `.git`, etc.
- Development mode in Compose will use volume mounts for hot reloading.
- Production mode will use the optimized stages.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Image size bloat | Use multi-stage builds. |
| Security risks (root) | Run all containers as non-root users. |
| Build speed | Use layer caching strategies in Dockerfile. |
