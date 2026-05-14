# Implementation Tasks

- [x] 1. Update `NavLink` interface in `navigation.ts` to include `hideWhenAuth?: boolean`.
- [x] 2. Update the "Iniciar Sesión" object in `NAVIGATION_LINKS` to set `hideWhenAuth: true`.
- [x] 3. Update `canSee` in `Sidebar.tsx` to return `false` if `isAuthenticated && link.hideWhenAuth`.
