import { createBrowserRouter } from 'react-router-dom'
import App from './App'

// Pages
const HomePage = () => (
  <div className="flex h-screen items-center justify-center">
    <h1 className="text-4xl font-bold">FoodStore</h1>
  </div>
)

const LoginPage = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
      <div className="card">
        <p className="text-gray-600 text-center">Login page coming soon...</p>
      </div>
    </div>
  </div>
)

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
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
