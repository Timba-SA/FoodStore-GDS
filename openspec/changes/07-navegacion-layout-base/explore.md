# Exploration: 07-navegacion-layout-base

## Objetivos
1. Diseñar e implementar un layout global que contenga un Sidebar (navegación vertical) y un Navbar (barra superior).
2. Adaptar la navegación de manera dinámica según los roles del usuario autenticado (`CLIENT`, `ADMIN`, `STOCK`, `PEDIDOS`).
3. Soportar navegación anónima (visitantes que ven el catálogo o van a login/registro).
4. Hacer el layout responsive (Sidebar colapsable en móviles).

## Contexto Actual
- Tenemos varias páginas creadas: `CatalogoPage`, `MisDireccionesPage`, `MisPedidosPage`, `AdminDashboardPage`, `AdminUsuariosPage`, `AdminStockPage`, `AdminPedidosPage`, `PerfilPage`, etc.
- Todas están registradas en `src/app/routes/router.tsx` pero por ahora se renderizan en `<App />` sin un marco común robusto, o cada página tiene su propio `header`.
- El manejo de sesión está en `src/features/auth/store/authStore.ts` con el hook `useAuthStore`, que tiene la propiedad `hasRole(role)` y expone el `user.roles`.

## Enfoques Posibles

### Opción 1: Layout Wrapper en el App.tsx
Envolver `<Outlet />` con un componente `MainLayout` que pinte el Sidebar a la izquierda y el Navbar arriba.
**Ventajas:** Fácil de implementar, todo se centraliza en un componente.
**Desventajas:** Ninguna. Es el estándar de la industria para SPAs tipo dashboard.

### Opción 2: Layouts múltiples
Un `AdminLayout` para rutas de `/admin` y un `ClientLayout` para rutas de cliente `/dashboard`.
**Ventajas:** Permite tener diseños completamente diferentes.
**Desventajas:** Duplica código de navegación si el Navbar superior es muy parecido. En nuestro caso, el Navbar es el mismo y el Sidebar solo filtra opciones por rol, por lo que la Opción 1 es mejor.

## Conclusión
Usaremos la Opción 1: un único `MainLayout` que utilice `useAuthStore` para renderizar condicionalmente los links del `Sidebar`. 
- El `Navbar` tendrá el logo a la izquierda, y un dropdown de usuario (Mi Perfil, Logout) a la derecha.
- El `Sidebar` iterará sobre una configuración de rutas protegidas y mostrará solo aquellas en las que el usuario tenga permiso.
