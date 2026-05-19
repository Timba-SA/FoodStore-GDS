# Design: Landing Page — 2026-05-18

## Aesthetic Direction: "Bazar de Luz"

### Concepto
Inspirado en los mercados mediterráneos a plena luz del día: luminoso, orgánico, lleno de vida pero ordenado.
No es un e-commerce genérico. Es un espacio editorial que comunica calidad artesanal y frescura.

### Paleta
| Token         | Valor          | Uso                                    |
|---------------|----------------|----------------------------------------|
| `--cream`     | `#FAF7F2`      | Fondo principal (crema arena)          |
| `--sand`      | `#F0EAD6`      | Secciones alternas, cards              |
| `--burnt`     | `#C4622D`      | Acento primario (naranja quemado)      |
| `--burnt-lt`  | `#E8846A`      | Hover states, gradientes suaves        |
| `--mint`      | `#3D7A5E`      | Acento secundario (verde menta oscuro) |
| `--ink`       | `#1A1208`      | Textos principales (casi negro cálido) |
| `--muted`     | `#7A6B55`      | Textos secundarios (marrón suave)      |

### Tipografía
- **Display (h1, h2 grandes)**: `Fraunces` — serif variable con eje óptico, da personalidad editorial fuerte.
  - `font-variation-settings: "opsz" 144` para el hero (máxima expresión)
- **Body**: `DM Sans` — humanista, legible, moderna sin ser genérica.
- Cargadas via: `<link>` en `index.html` con `display=swap`

### Layout
- Grid CSS puro en el mosaic de categorías (no grid de Tailwind estándar)
- Jerarquía visual por tamaño extremo: h1 del hero en `clamp(4rem, 10vw, 9rem)`
- Asimetría intencional: texto a la izquierda, decoración a la derecha
- Blobs SVG como formas de fondo (no imágenes, inline SVG)
- Ingredientes emoji flotantes con animación CSS `float` staggered

### Animaciones
- `@keyframes float` — ya definida en `tailwind.config.js`; extender con `float-slow` y `float-fast` para stagger
- `@keyframes slideUp` — entrada del hero (opacity 0 → 1, translateY 20px → 0)
- `@keyframes fadeInLeft` / `fadeInRight` — entrada de secciones al scroll (CSS puro, no JS)
- Category cards: `transform: scale(1.03)` en hover + `transition: 300ms cubic-bezier(0.34,1.56,0.64,1)` (spring)

---

## Component Architecture

```
LandingPage.tsx
├── <LandingNav />         — Navbar standalone (no es la Navbar del shell)
├── <HeroSection />        — Hero editorial full-height
├── <TrustStrip />         — Métricas de confianza
├── <CategoriesMosaic />   — Grid asimétrico de categorías
├── <FinalCTA />           — Bloque de conversión
└── <LandingFooter />      — Footer mínimo
```

Todos los componentes son **sub-componentes internos de `LandingPage.tsx`** (no archivos separados).
Razón: la landing es una unidad cohesiva. Crear archivos separados para 6 componentes de una sola página crea sobre-ingeniería innecesaria.

---

## Router Architecture

### Situación actual
```
router
└── path "/" → <App> (MainLayout)
    ├── index → <HomePage />  ← placeholder inline, 3 líneas
    ├── "catalogo" → <CatalogoPage />
    └── ...resto de rutas
```

### Nueva estructura
```
router
├── path "/" → <LandingPage />   ← standalone, SIN App wrapper
└── path "/" → <App> (MainLayout)   ← MISMO path, pero con children
    ├── "catalogo" → <CatalogoPage />  ← sigue funcionando
    └── ...resto de rutas
```

**Decisión de implementación**: React Router v6 permite múltiples entradas en el array de rutas con el mismo path. Vamos a usar `path: '/'` para la landing y modificar el wrapper de `<App>` quitando el `index: true` de `<HomePage>`. La ruta de `<App>` cambia de `path: '/'` a `path: '/'` pero sin el `index` — solo con sus rutas hijas que empiezan en sub-paths.

**Alternativa considerada**: Crear una ruta en path vacío `""` y mover todo a `/app`. Descartada por impacto en URLs existentes.

**Implementación concreta**:
```tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,   // ← Nueva entrada, sin App
  },
  {
    path: '/',
    element: <App />,           // ← Sigue igual, pero sin el index hijo
    children: [
      // ← REMOVIDO: { index: true, element: <HomePage /> }
      { path: 'login', element: <LoginPage /> },
      { path: 'catalogo', element: <CatalogoPage /> },
      // ...resto igual
    ],
  },
])
```

---

## Tailwind Config Changes
Agregar nuevas animaciones en `tailwind.config.js`:
```js
keyframes: {
  'slide-up': {
    '0%': { opacity: '0', transform: 'translateY(30px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  'fade-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
}
animation: {
  'slide-up': 'slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
  'slide-up-delay': 'slide-up 0.8s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
  'slide-up-delay-2': 'slide-up 0.8s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
  'fade-in': 'fade-in 1s 0.4s both',
  'float-slow': 'float 4s ease-in-out infinite',
  'float-fast': 'float 2.5s ease-in-out infinite',
}
```
