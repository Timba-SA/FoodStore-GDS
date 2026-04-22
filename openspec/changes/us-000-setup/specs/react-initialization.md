# Spec: react-initialization

## Overview
Este spec define la inicialización mínima pero sólida de la app React: estructura FSD, Vite setup, TypeScript configuration, Zustand store básico para auth, Axios interceptor setup, y estructura de routing.

## Requirements

### REQ-001: Proyecto React inicializa con Vite y TypeScript
React app DEBE estar buildizada con Vite, TypeScript 5.x, y tener `tsconfig.json` configurado con `strict: true`.

**Scenario: Vite dev server funciona**
- Given: `frontend/` clonado
- When: Se ejecuta `npm install && npm run dev`
- Then: Dev server está disponible en http://localhost:5173 sin errores

**Scenario: TypeScript es strict**
- Given: `frontend/tsconfig.json` existe
- When: Se abre el archivo
- Then: Contiene `"strict": true`

### REQ-002: Estructura FSD completa
Frontend DEBE tener directorios: `src/shared/`, `src/entities/`, `src/features/`, `src/widgets/`, `src/pages/`, `src/app/` cada uno con `index.ts` que exporta públicamente.

**Scenario: FSD layers existen y son válidas**
- Given: `frontend/src/` existe
- When: Se verifica cada directorio FSD
- Then: Todos existen y tienen `index.ts`

### REQ-003: Tailwind CSS configurado
Tailwind DEBE estar configurado en Vite. Archivo `src/app/index.css` DEBE importar `@tailwind`.

**Scenario: Tailwind styles se aplican**
- Given: App React ejecutando
- When: Se abre DevTools y se inspecciona un elemento
- Then: Classes de Tailwind (e.g., `p-4`, `text-blue-500`) están presentes y activas

### REQ-004: Axios configurado con interceptores
DEBE existir cliente Axios singleton configurado en `src/shared/api/client.ts` con interceptor que:
1. Agrega token JWT al header Authorization en cada request
2. En respuesta 401, intenta renovar token automáticamente
3. Maneja errores de red y timeout

**Scenario: Interceptor agrega token a requests**
- Given: Token almacenado en authStore
- When: Se ejecuta `apiClient.get('/api/v1/productos')`
- Then: Request contiene header `Authorization: Bearer <token>`

**Scenario: 401 dispara renovación de token**
- Given: Access token expirado
- When: Endpoint retorna 401
- Then: Frontend automáticamente intenta refresh en POST /api/v1/auth/refresh sin notificar al usuario

### REQ-005: Zustand authStore inicializado
DEBE existir `src/features/auth/store/authStore.ts` con estados: `token`, `refreshToken`, `user`, `roles`, y acciones: `login()`, `logout()`, `setTokens()`.

**Scenario: Auth store persiste tokens en localStorage**
- Given: App React ejecutando
- When: Se ejecuta `authStore.setTokens({...tokens})`
- Then: Tokens se guardan en localStorage bajo clave `auth_store`

### REQ-006: React Router configurado
DEBE existir `src/app/router.tsx` con rutas básicas usando React Router v6:
- `/` — Home
- `/login` — Login page
- `/dashboard` — Admin/user dashboard (protegida)
- `/404` — Not Found

**Scenario: Rutas funcionan**
- Given: App ejecutando
- When: Se navega a `/login`
- Then: Se renderiza página de login sin errores

### REQ-007: TanStack Query (React Query) inicializado
DEBE existir `src/app/queryClient.ts` con configuración de QueryClient por defecto (staleTime, cacheTime, retry).

**Scenario: Query client está disponible en app**
- Given: `src/app/App.tsx` renderiza `<QueryClientProvider client={queryClient}>`
- When: Se renderiza la app
- Then: Hook `useQuery()` funciona sin errores

## Output Files

- `frontend/src/` — estructura FSD completa
- `frontend/vite.config.ts` — configuración Vite
- `frontend/tsconfig.json` — TypeScript strict
- `frontend/src/shared/api/client.ts` — Axios con interceptores
- `frontend/src/features/auth/store/authStore.ts` — Zustand store
- `frontend/src/app/router.tsx` — React Router
- `frontend/tailwind.config.js` — Tailwind
