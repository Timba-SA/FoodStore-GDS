import LoginForm from '@/features/auth/LoginForm'
import { Utensils } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Utensils size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Bienvenido</h1>
          <p className="text-orange-100 mt-2">Ingresá a tu cuenta de FoodStore</p>
        </div>
        
        <div className="p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
