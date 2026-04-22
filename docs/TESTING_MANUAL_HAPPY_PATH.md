"""
MANUAL TESTING CHECKLIST - US-001-Auth Registration Happy Path

This checklist verifies the successful registration flow end-to-end.
Requires: PostgreSQL running, backend and frontend servers running

Prerequisites:
- Backend: uvicorn app.main:app --reload (http://localhost:8000)
- Frontend: npm run dev (http://localhost:5173)
- Database: PostgreSQL 15+ with foodstore_db created
- Run migrations: alembic upgrade head
- Seed data: python -m app.db.seed

Test Duration: ~10 minutes
"""

HAPPY_PATH_CHECKLIST = """
═══════════════════════════════════════════════════════════════════════════════
1. REGISTRATION PAGE LOADS
═══════════════════════════════════════════════════════════════════════════════

□ Navigate to http://localhost:5173/register
□ Page title "Crear cuenta" displays correctly
□ Page contains "O inicia sesión si ya tienes cuenta" link pointing to /login
□ All form fields visible:
  □ Nombre (text input, placeholder "Tu nombre completo")
  □ Email (email input, placeholder "tu@email.com")
  □ Contraseña (password input, placeholder "Mínimo 8 caracteres")
  □ Confirmar contraseña (password input, placeholder "Repite tu contraseña")
  □ Teléfono (opcional) (tel input, placeholder "+54 1234 567890")
□ Submit button visible with text "Crear cuenta"
□ No validation errors shown initially
□ No error messages displayed


═══════════════════════════════════════════════════════════════════════════════
2. FORM SUBMISSION - VALID DATA
═══════════════════════════════════════════════════════════════════════════════

□ Fill Nombre: "Juan Pérez"
□ Fill Email: "juan.perez@example.com" (UNIQUE email, not yet registered)
□ Fill Contraseña: "MySecurePassword123!"
□ Fill Confirmar contraseña: "MySecurePassword123!"
□ Fill Teléfono: "+5491123456789"
□ Click "Crear cuenta" button
□ Button text changes to "Registrando..."
□ Button becomes disabled (cannot click again)
□ Form fields become disabled (cannot type)
□ No validation errors appear


═══════════════════════════════════════════════════════════════════════════════
3. BACKEND RESPONSE - 201 CREATED
═══════════════════════════════════════════════════════════════════════════════

□ Backend receives POST /api/v1/auth/register request
□ Backend validates:
  □ Email unique (not already in database)
  □ Nombre valid (2-100 chars, not empty)
  □ Password valid (min 8 chars)
  □ Email format valid
□ Backend returns HTTP 201 Created with JSON response:
  □ access_token: JWT string with format "xxx.xxx.xxx"
  □ refresh_token: UUID format string
  □ token_type: "Bearer"
  □ user object:
    □ id: positive integer
    □ nombre: "Juan Pérez"
    □ email: "juan.perez@example.com"
    □ numero_telefono: "+5491123456789"
    □ roles: ["customer"]
    □ creado_en: ISO datetime string
    □ actualizado_en: ISO datetime string


═══════════════════════════════════════════════════════════════════════════════
4. FRONTEND STATE UPDATES
═══════════════════════════════════════════════════════════════════════════════

□ Zustand store (authStore) updated:
  □ user.id set correctly
  □ user.nombre set to "Juan Pérez"
  □ user.email set to "juan.perez@example.com"
  □ user.roles contains "customer"
  □ accessToken set to JWT from response
  □ refreshToken set to UUID from response
  □ isAuthenticated set to true
□ localStorage contains:
  □ "access_token" key with JWT value
  □ "refresh_token" key with UUID value
  □ "auth-storage" key with full auth state (from Zustand persist)


═══════════════════════════════════════════════════════════════════════════════
5. PAGE REDIRECT
═══════════════════════════════════════════════════════════════════════════════

□ Page automatically redirects from /register to /dashboard
□ URL bar shows http://localhost:5173/dashboard
□ Dashboard loads successfully
□ Dashboard can access authenticated user data (name, email, etc)


═══════════════════════════════════════════════════════════════════════════════
6. DATABASE VERIFICATION
═══════════════════════════════════════════════════════════════════════════════

Query database to verify registration:

SELECT u.id, u.nombre, u.email, u.numero_telefono, u.hashed_password, u.activo
FROM usuarios u
WHERE u.email = 'juan.perez@example.com';

Expected:
□ One row returned
□ nombre: "Juan Pérez"
□ email: "juan.perez@example.com"
□ numero_telefono: "+5491123456789"
□ hashed_password: bcrypt hash (starts with $2, not plain password)
□ activo: true

Check user role:

SELECT r.nombre FROM roles r
JOIN usuario_roles ur ON r.id = ur.rol_id
WHERE ur.usuario_id = <id_from_above>;

Expected:
□ One row returned
□ nombre: "customer"


═══════════════════════════════════════════════════════════════════════════════
7. REFRESH TOKEN VERIFICATION
═══════════════════════════════════════════════════════════════════════════════

SELECT rt.id, rt.usuario_id, rt.token, rt.expires_at, rt.is_revoked
FROM refresh_tokens rt
WHERE rt.usuario_id = <user_id_from_step_6>;

Expected:
□ One row created
□ token: UUID format string (matches what's in localStorage)
□ is_revoked: false
□ expires_at: approximately 7 days from now


═══════════════════════════════════════════════════════════════════════════════
8. LOGOUT AND RE-AUTHENTICATION
═══════════════════════════════════════════════════════════════════════════════

□ Click logout button on dashboard
□ Redirect to /login
□ localStorage cleared (access_token and refresh_token removed)
□ authStore reset (user null, accessToken null, refreshToken null)
□ isAuthenticated: false
□ Navigate back to /register
□ Page loads successfully (not redirected to /dashboard)


═══════════════════════════════════════════════════════════════════════════════
FINAL VERIFICATION
═══════════════════════════════════════════════════════════════════════════════

□ No console errors in browser DevTools
□ No console errors in backend terminal
□ No database constraint violations
□ All HTTP requests return expected status codes
□ All timestamps in correct timezone
□ All user data persists across page refreshes
"""

print(HAPPY_PATH_CHECKLIST)
