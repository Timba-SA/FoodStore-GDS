# Design: 07-navegacion-layout-base

## Architecture

We will implement a responsive shell architecture using React components and Tailwind CSS. The design will be composed of three main parts:
1. `MainLayout.tsx`: The wrapper component that establishes the CSS grid/flex structure.
2. `Sidebar.tsx`: A vertical navigation panel on the left (hidden off-canvas on mobile).
3. `Navbar.tsx`: A top horizontal bar with user profile actions and a mobile menu toggle.

## File Structure

```
frontend/src/shared/components/layout/
├── MainLayout.tsx     # The shell container
├── Sidebar.tsx        # Vertical navigation
├── Navbar.tsx         # Top bar
└── navigation.ts      # Shared configuration array for navigation links
```

## Component Details

### `navigation.ts`
Exports an array `NAVIGATION_LINKS`:
```ts
export interface NavLink {
  label: string;
  path: string;
  icon: string; // We'll use lucide-react icons mapped by a simple switch or directly passing the component
  roles: string[] | null; // null means public, otherwise requires one of the roles
}
```

### `Sidebar.tsx`
- Reads `NAVIGATION_LINKS`.
- Obtains the current user roles via `useAuthStore()`.
- Filters the links: `link.roles === null || link.roles.some(r => userRoles.includes(r))`
- Uses `NavLink` from `react-router-dom` to apply an `active` CSS class to the currently selected route.

### `Navbar.tsx`
- Left side: Logo or App Name + Mobile Menu Toggle (hamburger icon).
- Right side: 
  - If authenticated: User Name / Email dropdown with links to "Mi Perfil" (`/perfil`) and a "Cerrar Sesión" button.
  - If anonymous: "Iniciar Sesión" (`/login`) button.

### `MainLayout.tsx`
```tsx
export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

## Routing Integration
In `src/app/routes/router.tsx`, replace the `<App />` root logic if necessary, or simply make `<App />` render `<MainLayout />`. Since `<App />` currently just renders `<Outlet />`, we can modify `src/App.tsx` to render `<MainLayout />` directly, keeping `router.tsx` unchanged in structure.

## Icons
We will install `lucide-react` (if not already installed, though it might be present or we can install it) for standardized SVG icons.

## Data Fetching / Store Updates
- `useAuthStore`'s `clearAuth()` action will be used by the Logout button.
- Upon calling `clearAuth()`, we will redirect to `/login` using `useNavigate()`.
