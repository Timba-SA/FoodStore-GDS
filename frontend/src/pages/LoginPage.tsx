import LoginForm from '@/features/auth/LoginForm'
import { Utensils, Star } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-950/20 to-slate-900 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/20 overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-8 pt-10 pb-8 text-center relative overflow-hidden">
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            
            <div className="relative">
              <div className="mx-auto bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-black/10 border border-white/20">
                <Utensils size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Bienvenido</h1>
              <p className="text-orange-100/80 mt-2 text-sm">Ingresá a tu cuenta de FoodStore</p>

              {/* Stars decoration */}
              <div className="flex items-center justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-300 fill-amber-300" />
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <LoginForm />
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-slate-500/60 text-xs mt-6">
          © 2025 FoodStore · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
