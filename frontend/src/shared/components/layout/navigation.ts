/**
 * Centralised navigation configuration.
 *
 * roles: null  → public (no auth required)
 * roles: []    → any authenticated user
 * roles: [...]  → must have at least one of the listed roles
 */

export interface NavLink {
  label: string
  path: string
  icon: string // lucide-react icon name
  roles: string[] | null
  dividerBefore?: boolean
  hideWhenAuth?: boolean
}

export const NAVIGATION_LINKS: NavLink[] = [
  // ── Public ────────────────────────────────────────────────
  { label: 'Catálogo', path: '/catalogo', icon: 'Store', roles: null },
  { label: 'Iniciar Sesión', path: '/login', icon: 'LogIn', roles: null, hideWhenAuth: true },

  // ── Any authenticated user ─────────────────────────────────
  { label: 'Mi Perfil', path: '/perfil', icon: 'UserCircle', roles: [], dividerBefore: true },
  { label: 'Mis Pedidos', path: '/dashboard/pedidos', icon: 'Package', roles: [] },
  { label: 'Mis Direcciones', path: '/dashboard/direcciones', icon: 'MapPin', roles: [] },

  // ── Stock + Admin ──────────────────────────────────────────
  {
    label: 'Control Stock',
    path: '/admin/stock',
    icon: 'Layers',
    roles: ['admin', 'stock'],
    dividerBefore: true,
  },
  { label: 'Productos', path: '/admin/productos', icon: 'Box', roles: ['admin', 'stock'] },
  { label: 'Categorías', path: '/admin/categorias', icon: 'Tags', roles: ['admin', 'stock'] },
  {
    label: 'Ingredientes',
    path: '/admin/ingredientes',
    icon: 'Apple',
    roles: ['admin', 'stock'],
  },

  // ── Pedidos + Admin ────────────────────────────────────────
  {
    label: 'Gestión Pedidos',
    path: '/admin/pedidos',
    icon: 'ClipboardList',
    roles: ['admin', 'pedidos'],
    dividerBefore: true,
  },

  // ── Admin only ─────────────────────────────────────────────
  {
    label: 'Métricas',
    path: '/admin/dashboard',
    icon: 'LineChart',
    roles: ['admin'],
    dividerBefore: true,
  },
  { label: 'Usuarios', path: '/admin/usuarios', icon: 'Users', roles: ['admin'] },
]
