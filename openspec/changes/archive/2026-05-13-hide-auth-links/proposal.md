# Proposal: Hide Auth Links

## Intent
El botón "Iniciar Sesión" y otros enlaces exclusivos de visitantes se muestran actualmente incluso cuando el usuario ya ha iniciado sesión. El objetivo es ocultar dinámicamente estos enlaces para mejorar la UX.

## Proposed Approach
- Agregar la propiedad opcional `hideWhenAuth?: boolean` en la interfaz `NavLink` (`navigation.ts`).
- Configurar el enlace de "Iniciar Sesión" con `hideWhenAuth: true`.
- Actualizar la lógica `canSee` en `Sidebar.tsx` (y cualquier barra de navegación futura) para que evalúe esta nueva propiedad y devuelva `false` si el usuario ya está autenticado.
