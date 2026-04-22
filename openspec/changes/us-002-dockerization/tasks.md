# Tasks: us-002-dockerization

## Phase 1: Backend Containerization
- [ ] 1.1 Create `.dockerignore` for backend
- [ ] 1.2 Create `backend/Dockerfile` (multi-stage)
- [ ] 1.3 Verify backend image build

## Phase 2: Frontend Containerization
- [ ] 2.1 Create `.dockerignore` for frontend
- [ ] 2.2 Create `frontend/Dockerfile` (multi-stage with Nginx)
- [ ] 2.3 Verify frontend image build

## Phase 3: Orchestration & Compose
- [ ] 3.1 Create `docker-compose.yml` (backend, frontend, db)
- [ ] 3.2 Configure networks and volumes
- [ ] 3.3 Verify full stack orchestration (`docker-compose up`)

## Phase 4: Final Validation
- [ ] 4.1 Validate dev hot-reloading in compose
- [ ] 4.2 Document docker workflow in READMEs
