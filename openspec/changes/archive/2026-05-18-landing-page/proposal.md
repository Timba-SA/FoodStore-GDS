# Change Proposal: Landing Page — 2026-05-18

## Intent
Crear una landing page de alta calidad estética como punto de entrada principal de FoodStore.
Actualmente la ruta `/` muestra un `<h1>FoodStore</h1>` inline como placeholder dentro del MainLayout.
El objetivo es reemplazarla con una página memorable, clara, distinta y visualmente impactante.

## Scope
- **Nuevo archivo**: `frontend/src/pages/LandingPage.tsx`
- **Modificar**: `frontend/src/app/routes/router.tsx`
  — Extraer la ruta `/` del wrapper `<App>` (MainLayout) para que la landing sea full-screen sin sidebar/navbar del shell
- **Sin cambios de backend**

## Aesthetic Direction
**"Bazar de luz"** — Clarísimo, casi blanco. Fondo crema/arena con acento naranja quemado y verde menta.
Tipografía editorial: Fraunces (display serif variable con óptica) + DM Sans (body sans-serif humanista).
Layout asimétrico, sin padding-boxes genéricos. Un hero con texto enorme que ocupa el 80% del viewport.
Partículas de ingredientes flotantes (emojis/SVG) como decoración lúdica pero sofisticada.
Scroll reveal staggered. Formas orgánicas de fondo (blobs SVG). No glassmorphism. No gradientes morados.

## Sections
1. **Navbar** — sticky mínima, logo + botones login/catalogo
2. **Hero** — Headline editorial gigante + badge categoría flotante + CTA
3. **Trust strip** — íconos + números (ej: "140+ productos", "Envío el mismo día")
4. **Categories mosaic** — grid asimétrico de 5 categorías con hover cinematográfico
5. **Final CTA** — bloque de conversión al catálogo
6. **Footer** — minimal

## Approach
1. Crear `LandingPage.tsx` standalone (sin depender del MainLayout)
2. Importar Fraunces + DM Sans via Google Fonts en `index.html`
3. Actualizar `router.tsx`: ruta `/` sale del `<App>` wrapper → renderiza `<LandingPage />` directamente
4. Animaciones CSS puras (keyframes en Tailwind config)

## Risks
- Bajo: Solo frontend. Sin backend. Sin breaking changes en rutas existentes.
- Verificar que links apunten a rutas reales: `/catalogo`, `/login`, `/registro`
