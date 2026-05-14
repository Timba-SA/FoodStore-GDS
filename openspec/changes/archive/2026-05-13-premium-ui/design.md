# Technical Design: Premium UI Upgrade

## Architecture / Patterns
- CSS Framework: Tailwind CSS v3.
- Global Font: `Outfit` (importado via Google Fonts en `index.html` y configurado en `tailwind.config.js`).
- Animaciones: Transiciones puramente de CSS (Tailwind `transition-*` utilities). No introduciremos Framer Motion para mantener el bundle ligero y seguir con las prácticas actuales.

## Key Changes
1. **Tipografía Global**: `font-sans` apuntará a `'Outfit', sans-serif`.
2. **Glassmorphism**: Se creará una utilidad o se usarán directamente clases de tailwind en los fondos superpuestos: `bg-white/80 backdrop-blur-md border-b border-gray-100`.
3. **Catálogo (`ProductoCard`)**:
   - Quitar bordes duros.
   - Usar `rounded-2xl` para suavizar esquinas.
   - En el `hover`: `hover:-translate-y-1 hover:shadow-xl transition-all duration-300`.
   - Modificar la disposición del texto para un look más "limpio" (minimalista).
4. **Layout y Navegación**:
   - Separar visualmente el Navbar del contenido principal usando un fondo sutil en el `body` (`bg-slate-50`).
5. **Formularios/Modales**:
   - Botones primarios (naranjas): `bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg`.
   - Inputs: `focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all`.

## Trade-offs
- No agregar librerías de animación complejas mantiene el código simple y el rendimiento alto.
- El uso de `backdrop-blur` puede ser ligeramente intensivo en GPUs muy antiguas, pero hoy en día es el estándar.
