import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '@/shared/api/auth'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginUser(email, password)
      navigate('/catalogo')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 text-red-700 px-4 py-3.5 rounded-2xl text-sm border border-red-200">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input pl-11"
            required
            autoComplete="email"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="password">Contraseña</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input pl-11"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3.5 text-base"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Ingresando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Iniciar Sesión
            <ArrowRight size={16} />
          </span>
        )}
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
          Registrate acá
        </Link>
      </p>
    </form>
  )
}
