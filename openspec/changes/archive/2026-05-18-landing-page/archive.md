# Archive Report: Landing Page — 2026-05-18

**Archivado:** 2026-05-18  
**Status:** ✅ COMPLETADO Y ARCHIVADO

---

## Resumen Ejecutivo

Implementación de la Landing Page premium "Bazar de Luz" como punto de entrada standalone de FoodStore. La página vive en la ruta `/` completamente desacoplada del `MainLayout` de la aplicación (sin sidebar ni navbar de la app interna). También se incluyeron mejoras adicionales a navigation, Navbar, Login y Register.

---

## Tareas Completadas

### Fase 1: Setup
- ✅ **1.1** Fuentes `Fraunces` y `DM Sans` en `frontend/index.html`
- ✅ **1.2** Animaciones extendidas en `tailwind.config.js` + archivo `landing.css` dedicado

### Fase 2: Implementación
- ✅ **2.1** `LandingPage.tsx` v2 con SVGs ilustrativos propios (sin emojis), nav progresiva con `IntersectionObserver`, hero arquitectónico con líneas SVG de grilla, floaters animados con drift physics
- ✅ **2.2** Router reestructurado: landing en `path: '/'` standalone, app como layout route sin path
- ✅ **2.3** (adicional) `navigation.ts`: Catálogo movido a `roles: []` (solo usuarios autenticados)
- ✅ **2.4** (adicional) `Navbar.tsx`: botón Iniciar Sesión eliminado — solo el sidebar lo muestra
- ✅ **2.5** (adicional) `LoginPage.tsx`: diseño split editorial panel oscuro + formulario crema
- ✅ **2.6** (adicional) `RegisterPage.tsx`: mismo sistema de diseño, con show/hide password e inputs editoriales
- ✅ **2.7** (adicional) `LoginForm.tsx`: rediseñado con la paleta editorial, inputs estilizados

### Fase 3: Verificación
- ✅ **3.1** `/` renderiza la landing sin sidebar/navbar del shell (verificado con browser subagent en Docker)
- ✅ **3.2** `/catalogo` sigue funcionando dentro del MainLayout
- ✅ **3.3** `/login` y `/registro` funcionan con el nuevo diseño editorial
- ✅ **3.4** Navegación landing → catálogo y landing → login fluida
- ✅ **3.5** Build de producción exitoso en Docker Nginx

---

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `frontend/index.html` | Fuentes Google Fonts, meta description SEO |
| `frontend/tailwind.config.js` | Animaciones extendidas |
| `frontend/src/pages/landing.css` | CSS dedicado de la landing (NEW) |
| `frontend/src/pages/LandingPage.tsx` | Landing completa v2 (NEW) |
| `frontend/src/pages/LoginPage.tsx` | Rediseño editorial split layout |
| `frontend/src/pages/RegisterPage.tsx` | Rediseño editorial split layout |
| `frontend/src/features/auth/LoginForm.tsx` | Inputs y botón editoriales |
| `frontend/src/app/routes/router.tsx` | Landing standalone, layout route |
| `frontend/src/shared/components/layout/navigation.ts` | Catálogo → autenticado only |
| `frontend/src/shared/components/layout/Navbar.tsx` | Eliminado botón Login del navbar |

---

## Decisiones Arquitectónicas

1. **Landing standalone**: En React Router v6, la landing vive en `path: '/'` fuera del layout route de la app. La app entera es un `element: <App />` sin `path` propio — sus rutas hijas (`/catalogo`, `/login`, etc.) siguen usando `MainLayout` con sidebar y navbar interna.

2. **Catálogo protegido**: El catálogo solo aparece en el sidebar cuando el usuario está autenticado (`roles: []`). Los usuarios anónimos solo ven "Iniciar Sesión" en el sidebar.

3. **CSS dedicado vs. Tailwind inline**: La landing usa un archivo `landing.css` con clases propias para evitar la proliferación de clases Tailwind utilitarias en el JSX y mantener la paleta editorial aislada del sistema de diseño general de la app.
