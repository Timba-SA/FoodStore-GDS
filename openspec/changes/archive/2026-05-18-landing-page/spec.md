# Spec: Landing Page — 2026-05-18

## Overview
Landing page pública en la ruta `/`, renderizada fuera del `MainLayout` existente, con diseño de alta identidad visual.

---

## Functional Requirements

### RF-01: Ruta independiente
- La ruta `/` DEBE renderizar `<LandingPage />` directamente, sin el `MainLayout` (Sidebar + Navbar del shell de la app).
- Las rutas hijas de `<App>` (catálogo, login, admin, etc.) NO DEBEN verse afectadas.

### RF-02: Navbar de la landing
- DEBE tener logo textual "FoodStore" a la izquierda.
- DEBE mostrar dos CTAs: "Iniciar sesión" → `/login` y "Ver catálogo" → `/catalogo`.
- DEBE ser sticky (pegada al top al hacer scroll).

### RF-03: Hero section
- DEBE mostrar un headline principal de al menos 4 palabras impactantes.
- DEBE tener un CTA primario que lleve al catálogo (`/catalogo`).
- DEBE incluir un badge/chip con texto de propuesta de valor.
- DEBE tener elementos decorativos (blobs de fondo, emojis/iconos flotantes).

### RF-04: Trust/stats strip
- DEBE mostrar al menos 3 métricas: número de productos, envío, categorías.

### RF-05: Categories mosaic
- DEBE mostrar al menos 4 categorías de ejemplo en un grid asimétrico.
- DEBE tener hover con efecto de escala/color.
- Al clickear, navega a `/catalogo`.

### RF-06: Final CTA
- DEBE tener un bloque de conversión final con headline + botón al catálogo.

### RF-07: Footer
- DEBE tener logo + copyright + links a `/catalogo` y `/login`.

---

## Non-Functional Requirements

### RNF-01: Performance
- La landing DEBE cargar sin llamadas a la API (datos de categorías son estáticos/hardcoded como placeholder).
- Fuentes: cargadas via Google Fonts con `display=swap`.

### RNF-02: Responsive
- DEBE ser funcional y visualmente correcta en mobile (min 375px) y desktop (max 1440px).

### RNF-03: Accesibilidad
- Heading structure: un único `<h1>` en el hero. Las secciones con `<h2>`.
- Links con texto descriptivo, no "click aquí".

---

## Scenarios

### Scenario 1: Usuario anónimo llega al home
**Given** que el usuario no está logueado y navega a `/`
**When** carga la página
**Then** ve la landing page con navbar, hero, trust strip, mosaic y CTA
**And** NO ve el sidebar ni la navbar del shell de la app

### Scenario 2: Usuario clickea "Ver catálogo"
**Given** el usuario está en la landing
**When** clickea el CTA principal o "Ver catálogo" en la navbar
**Then** es redirigido a `/catalogo`

### Scenario 3: Usuario clickea "Iniciar sesión"
**Given** el usuario está en la landing
**When** clickea "Iniciar sesión"
**Then** es redirigido a `/login`

### Scenario 4: Ruta `/catalogo` sigue funcionando
**Given** el cambio en el router
**When** el usuario navega a `/catalogo`
**Then** ve el `CatalogoPage` dentro del `MainLayout` (con sidebar y navbar del shell) — sin regresión
