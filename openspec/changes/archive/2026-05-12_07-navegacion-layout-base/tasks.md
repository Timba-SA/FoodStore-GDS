# Implementation Tasks: 07-navegacion-layout-base

## Phase 1: Configuration & Setup
- [x] 1.1 Install `lucide-react` dependency for standardized icons across the layout.
- [x] 1.2 Create `frontend/src/shared/components/layout/navigation.ts` defining the `NAVIGATION_LINKS` array with roles and paths.

## Phase 2: Core Components Construction
- [x] 2.1 Create `frontend/src/shared/components/layout/Sidebar.tsx` to render the vertical menu filtering `NAVIGATION_LINKS` based on `useAuthStore` roles. Use `NavLink` from `react-router-dom`.
- [x] 2.2 Create `frontend/src/shared/components/layout/Navbar.tsx` featuring the mobile menu toggle button, logo, and a user dropdown (Profile, Logout) reading state from `useAuthStore`.
- [x] 2.3 Create `frontend/src/shared/components/layout/MainLayout.tsx` which stitches together `Sidebar`, `Navbar`, and `<Outlet />` with responsive flexbox/grid tailwind classes.

## Phase 3: Integration & Cleanup
- [x] 3.1 Refactor `frontend/src/App.tsx` to wrap its rendering tree in `<MainLayout>` instead of just `<Outlet />`.
- [x] 3.2 Remove redundant headers or navigation blocks in existing pages (like the temporary ones in `DashboardPage`, `HomePage` or any manually crafted navigation wrappers). Keep the specific page headers (like the gradient headers in Admin pages) but ensure they look good inside the layout.
- [x] 3.3 Verify the Logout action successfully clears the store (`clearAuth`) and redirects to `/login`.

## Phase 4: Validation
- [x] 4.1 Login as `ADMIN` and verify all admin links appear in the sidebar.
- [x] 4.2 Login as `CLIENT` and verify only customer links appear in the sidebar.
- [x] 4.3 Verify mobile responsiveness (sidebar hides by default, toggles via navbar hamburger button).
