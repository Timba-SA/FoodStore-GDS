import { Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold">FoodStore</h1>
          <ul className="flex gap-4">
            <li><a href="/" className="text-gray-600 hover:text-gray-900">Home</a></li>
            <li><a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a></li>
            <li><a href="/login" className="text-gray-600 hover:text-gray-900">Login</a></li>
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="container text-center text-gray-600">
          <p>&copy; 2024 FoodStore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
