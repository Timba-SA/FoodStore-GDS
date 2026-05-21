import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import LoginPage from '../../pages/LoginPage'
import RegisterPage from '../../pages/RegisterPage'
import CategoriasPage from '../../pages/CategoriasPage'
import IngredientesPage from '../../pages/IngredientesPage'
import CatalogoPage from '../../pages/CatalogoPage'
import AdminProductosPage from '../../pages/AdminProductosPage'
import MisDireccionesPage from '../../pages/MisDireccionesPage'
import MisPedidosPage from '../../pages/MisPedidosPage'
import CheckoutPage from '../../pages/CheckoutPage'
import AdminDashboardPage from '../../pages/AdminDashboardPage'
import AdminUsuariosPage from '../../pages/AdminUsuariosPage'
import AdminStockPage from '../../pages/AdminStockPage'
import AdminPedidosPage from '../../pages/AdminPedidosPage'
import PerfilPage from '../../pages/PerfilPage'
import ProtectedRoute from '../../shared/components/ProtectedRoute'
import LandingPage from '../../pages/LandingPage'
import CocinaPage from '../../pages/CocinaPage'


const DashboardPage = () => (
  <div className="container py-8">
    <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card">
          <p className="text-center text-gray-600">Card {i}</p>
        </div>
      ))}
    </div>
  </div>
)

const ForbiddenPage = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">403</h1>
      <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
      <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Volver al inicio
      </a>
    </div>
  </div>
)

const NotFoundPage = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
)

export const router = createBrowserRouter([
  {
    // Landing standalone — sin MainLayout (Sidebar/Navbar del shell)
    path: '/',
    element: <LandingPage />,
  },
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    path: 'registro',
    element: <RegisterPage />,
  },
  {
    // Shell de la app — layout route SIN path propio.
    // Envuelve todas las rutas de la app con MainLayout (Sidebar + Navbar).
    element: <App />,
    children: [
      {
        path: '403',
        element: <ForbiddenPage />,
      },
      {
        path: 'catalogo',
        element: <CatalogoPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'dashboard/direcciones',
            element: <MisDireccionesPage />,
          },
          {
            path: 'dashboard/pedidos',
            element: <MisPedidosPage />,
          },
          {
            path: 'dashboard/pedidos/:id/pagar',
            element: <CheckoutPage />,
          },
          {
            path: 'perfil',
            element: <PerfilPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          {
            path: 'admin/dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'admin/usuarios',
            element: <AdminUsuariosPage />,
          },
          {
            path: 'admin/pedidos',
            element: <AdminPedidosPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['admin', 'stock']} />,
        children: [
          {
            path: 'admin/categorias',
            element: <CategoriasPage />,
          },
          {
            path: 'admin/ingredientes',
            element: <IngredientesPage />,
          },
          {
            path: 'admin/productos',
            element: <AdminProductosPage />,
          },
          {
            path: 'admin/stock',
            element: <AdminStockPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['admin', 'pedidos', 'cocina']} />,
        children: [
          {
            path: 'cocina',
            element: <CocinaPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
