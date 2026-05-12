# Proposal: 07-navegacion-layout-base

## Descripción
Implementaremos un `MainLayout` que unifique la experiencia de la aplicación. Remodelaremos el componente `<App />` para que utilice este nuevo layout en lugar de renderizar `<Outlet />` directamente sin estructura.

## Estructura del Layout
El `MainLayout` tendrá:
1. **Sidebar (Izquierda)**: Fijo en pantallas grandes, colapsable o accesible mediante un menú hamburguesa en pantallas pequeñas.
2. **Navbar (Arriba)**: Ocupará el ancho restante. Contendrá botón para abrir/cerrar sidebar en mobile y el menú de usuario (Logout, Perfil) a la derecha.
3. **Main Content (Centro-Derecha)**: `<Outlet />` donde se renderizará el contenido específico de cada ruta (Dashboard, Usuarios, Catálogo, etc).

## Configuración de Rutas y Permisos
Definiremos un arreglo de navegación en `src/shared/config/navigation.ts` que determine qué links mostrar basándonos en los roles:

```typescript
export const NAVIGATION_LINKS = [
  // Públicos / Cliente
  { label: 'Catálogo', path: '/catalogo', icon: 'Store', roles: null }, // Público
  { label: 'Mi Carrito', path: '/carrito', icon: 'ShoppingCart', roles: ['customer'] },
  { label: 'Mis Pedidos', path: '/dashboard/pedidos', icon: 'Package', roles: ['customer'] },
  { label: 'Mis Direcciones', path: '/dashboard/direcciones', icon: 'MapPin', roles: ['customer'] },
  
  // Admin & Pedidos
  { label: 'Gestión Pedidos', path: '/admin/pedidos', icon: 'ClipboardList', roles: ['admin', 'pedidos'] },
  
  // Admin & Stock
  { label: 'Control Stock', path: '/admin/stock', icon: 'Layers', roles: ['admin', 'stock'] },
  { label: 'Productos', path: '/admin/productos', icon: 'Box', roles: ['admin', 'stock'] },
  { label: 'Categorías', path: '/admin/categorias', icon: 'Tags', roles: ['admin', 'stock'] },
  { label: 'Ingredientes', path: '/admin/ingredientes', icon: 'Apple', roles: ['admin', 'stock'] },
  
  // Solo Admin
  { label: 'Métricas Negocio', path: '/admin/dashboard', icon: 'LineChart', roles: ['admin'] },
  { label: 'Usuarios', path: '/admin/usuarios', icon: 'Users', roles: ['admin'] },
]
```

## Cambios en Archivos Existentes
- `src/App.tsx`: Se eliminará el header básico existente y se envolverá en `MainLayout`.
- `src/pages/*.tsx`: Las páginas que actualmente tienen su propio `header` estático (como `AdminDashboardPage` con `header className="bg-gradient..."`) mantendrán su diseño interno, pero estarán contenidas dentro del área de contenido del layout.
- `src/shared/api/client.ts` / `auth.ts`: Aseguraremos que el logout redirija correctamente.

## Impacto
El usuario experimentará una navegación consistente, similar a un dashboard profesional. Los usuarios no autorizados no verán enlaces a los cuales no tienen acceso (fail-safe en el frontend + validación en el router).
