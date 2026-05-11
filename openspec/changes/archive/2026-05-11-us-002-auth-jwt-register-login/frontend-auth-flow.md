# Frontend Auth Flow — Decisiones de diseño y guía de implementación

## Arquitectura del auth en frontend

```
                    authStore (Zustand + persist)
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     client.ts      auth.ts        componentes
   (interceptor)   (API layer)   (RegisterForm, etc.)
          │
     Axios HTTP
```

**Regla fundamental:** **el store es la única fuente de verdad.** Ningún componente ni función lee tokens de `localStorage` directamente.

---

## authStore (`features/auth/store/authStore.ts`)

### Decisiones de diseño

| Decisión | Alternativa descartada | Por qué |
|----------|----------------------|---------|
| `setAuth()` atómica | Llamar `setTokens` + `setUser` por separado | Evita estado parcial si un render ocurre entre las dos llamadas |
| `setAccessToken()` separado | Solo `setAuth()` | El interceptor solo actualiza el access token, no tiene el user object |
| Selectores exportados | Acceder al store completo | Reduce re-renders — el componente solo re-renderiza si cambia el selector |
| `clearAuth()` en lugar de `logout()` | `logout()` en el store | El store solo maneja estado; la lógica de negocio (revocar token) va en `auth.ts` |

### Estado persistido en localStorage

```ts
// Solo estos campos sobreviven un reload:
{
  user, accessToken, refreshToken, isAuthenticated
}
// isLoading NO persiste — es estado transitorio
```

### Uso en componentes

```ts
// ✅ Correcto — selector específico, no re-renderiza por otros cambios
const isAuthenticated = useAuthStore(selectIsAuthenticated)
const user = useAuthStore(selectUser)

// ❌ Evitar — re-renderiza ante cualquier cambio del store
const { isAuthenticated, user } = useAuthStore()
```

---

## Axios client (`shared/api/client.ts`)

### Single-flight refresh

**El problema:** si N requests llegan simultáneamente con un access token expirado, todas reciben 401 al mismo tiempo y todas intentarían hacer refresh — el segundo y tercer refresh usarían un token ya rotado, lo que dispara replay detection y revoca toda la familia.

**La solución:** cola de promises compartida:

```
Request 1 → 401 → inicia refresh → en cola: []
Request 2 → 401 → isRefreshing=true → encola
Request 3 → 401 → isRefreshing=true → encola

Refresh resuelve → new_token
→ resolve(pendingQueue[0]) → Request 2 reintenta
→ resolve(pendingQueue[1]) → Request 3 reintenta
```

```ts
// Estado interno del módulo (singleton)
let isRefreshing = false
let pendingQueue: Array<{ resolve, reject }> = []
```

### Por qué raw axios para el refresh

```ts
// ✅ Correcto — raw axios sin interceptores
const response = await axios.post('/auth/refresh', { refresh_token })

// ❌ Incorrecto — causaría loop infinito
// Si el refresh falla con 401, el interceptor volvería a intentar refresh...
const response = await client.post('/auth/refresh', { refresh_token })
```

### Flujo completo de un 401

```
1. Request → 401
2. ¿isRefreshing? → sí: encolar y esperar
                  → no: iniciar refresh
3. Refresh exitoso → setAccessToken(nuevo) + setRefreshToken(nuevo)
4. resolvePending(nuevo_token)
5. Reintentar request original con nuevo header
6. Refresh fallido → clearAuth() → redirect /login
```

---

## auth.ts — Capa de API

### Por qué las funciones actualizan el store internamente

```ts
// Antes — el componente tenía que conocer el store:
const resp = await registerUser(data)
setUser(resp.user)          // componente
setTokens(resp.access_token, resp.refresh_token)  // componente
localStorage.setItem(...)   // componente

// Ahora — el componente solo maneja UI:
await registerUser(data)
navigate('/dashboard')
```

Esto es el **principio de menor conocimiento**: el componente no necesita saber cómo se almacenan los tokens.

### logoutUser() sin parámetros

```ts
// ✅ Correcto — lee el refreshToken del store internamente
await logoutUser()

// ❌ No hacer — el componente no debería tener que manejar el token
await logoutUser(refreshToken)
```

---

## Guía de uso para nuevos features

### Login desde un componente

```tsx
import { loginUser } from '@/shared/api/auth'
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/store/authStore'

function LoginPage() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await loginUser(email, password)
      // Store ya actualizado internamente — navegar
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }
}
```

### Logout

```tsx
import { logoutUser } from '@/shared/api/auth'

const handleLogout = async () => {
  await logoutUser()  // revoca en backend + clearAuth()
  navigate('/login')
}
```

### Obtener user actual en cualquier componente

```tsx
import { useAuthStore, selectUser } from '@/features/auth/store/authStore'

function Navbar() {
  const user = useAuthStore(selectUser)
  return <span>{user?.nombre}</span>
}
```

### Obtener user fuera de React (en servicios/utils)

```ts
import { useAuthStore } from '@/features/auth/store/authStore'

// getState() funciona fuera de hooks — Zustand lo soporta
const { user, accessToken } = useAuthStore.getState()
```

---

## Decisiones de seguridad

| Decisión | Razonamiento |
|----------|-------------|
| Refresh token en Zustand persist (no solo memory) | Si el usuario cierra el tab, puede retomar la sesión sin re-login |
| Access token NO en cookie httpOnly | El interceptor necesita leerlo desde JS; las cookies httpOnly son más seguras pero requieren backend con soporte de cookies en todos los endpoints |
| Refresh via `POST /auth/refresh` (no cookie) | Más simple para un SPA; implica mayor responsabilidad en el cliente para proteger el refresh token |
| No refresh token en URL o headers de link | Previene leaks en logs de servidor y referer headers |
