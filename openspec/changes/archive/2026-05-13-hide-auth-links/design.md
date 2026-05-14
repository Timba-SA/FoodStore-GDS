# Technical Design: Hide Auth Links

## Approach
Instead of hardcoding the exclusion of the `/login` path, we will make the navigation configuration declarative. 

1. **`navigation.ts`**: Update `NavLink` to accept an optional `hideWhenAuth?: boolean` field. Apply it to the 'Iniciar Sesión' link.
2. **`Sidebar.tsx`**: Modify the `canSee` function. If `isAuthenticated` is true and `link.hideWhenAuth` is true, return `false` early.

This is O(1) in complexity and maintains our clean data-driven navigation pattern.
