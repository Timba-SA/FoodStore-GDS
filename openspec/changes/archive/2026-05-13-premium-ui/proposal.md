# Change Proposal: Premium UI Upgrade

## Intent
Mejorar significativamente el aspecto visual y la experiencia de usuario (UX/UI) de la aplicación, llevándola de un diseño básico a una estética premium, moderna y profesional.

## Scope
- Tipografía global (reemplazar fuente por defecto).
- Refactor de la paleta de colores o su uso (más gradientes, grises cálidos).
- Introducción de Glassmorphism (`backdrop-blur`) en Navbar y Modales.
- Rediseño de las tarjetas (`ProductoCard`) con animaciones sutiles (`hover:-translate-y-1`, sombras suaves).
- Mejoras en inputs y botones para dar feedback premium (anillos de foco, micro-animaciones).

## Approach
1. Importar fuente de Google Fonts (`Outfit` o `Inter`).
2. Configurar `tailwind.config.js` para usar la nueva fuente.
3. Actualizar los componentes clave del frontend agregando utilidades de Tailwind (`shadow-2xl`, `backdrop-blur-md`, `transition-all duration-300`).
4. Recrear las tarjetas de catálogo para que se parezcan a diseños editoriales o de high-end e-commerce.
