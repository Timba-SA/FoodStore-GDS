# Tasks: Landing Page — 2026-05-18

## Status: [x] Apply completado

---

## Fase 1: Setup

- [x] **1.1** Agregar fuentes `Fraunces` y `DM Sans` en `frontend/index.html` via Google Fonts
- [x] **1.2** Extender animaciones en `frontend/tailwind.config.js` (`slide-up`, `slide-up-delay`, `slide-up-delay-2`, `fade-in`, `float-slow`, `float-fast`)

## Fase 2: Implementación

- [x] **2.1** Crear `frontend/src/pages/LandingPage.tsx` con todos los sub-componentes internos:
  - [x] `LandingNav` — navbar sticky standalone
  - [x] `HeroSection` — hero editorial con blob SVG, emojis flotantes, headline y CTA
  - [x] `TrustStrip` — barra de métricas (3 stats)
  - [x] `CategoriesMosaic` — grid asimétrico de 4-5 categorías con hover spring
  - [x] `FinalCTA` — bloque de conversión final
  - [x] `LandingFooter` — footer mínimo con links
- [x] **2.2** Modificar `frontend/src/app/routes/router.tsx`:
  - Agregar nueva entrada `path: '/'` → `<LandingPage />` (sin `<App>` wrapper)
  - Remover `{ index: true, element: <HomePage /> }` del array de children de `<App>`

## Fase 3: Verificación

- [ ] **3.1** Verificar que `/` renderiza la landing sin sidebar/navbar del shell
- [ ] **3.2** Verificar que `/catalogo` sigue funcionando dentro del MainLayout
- [ ] **3.3** Verificar que `/login` sigue funcionando
- [ ] **3.4** Verificar navegación landing → catálogo y landing → login
- [ ] **3.5** Verificar responsive mobile (min 375px)
