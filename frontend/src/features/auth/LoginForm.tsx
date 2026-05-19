import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '@/shared/api/auth'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'

const BURNT = '#B85C38'
const INK   = '#1C140A'
const CREAM = '#FAF7F2'
const MUTED = '#6B5D4A'
const LINE  = '#E2D5C0'

export default function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginUser(email, password)
      navigate('/catalogo')
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem',
    color: INK,
    background: '#FFFFFF',
    border: `1.5px solid ${LINE}`,
    borderRadius: '0.75rem',
    padding: '0.75rem 0.875rem 0.75rem 2.75rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#FEF2F2', color: '#C0392B', border: '1px solid #FCA5A5', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
          <AlertCircle size={15}/> {error}
        </div>
      )}

      {/* Email */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label htmlFor="login-email" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          Email
        </label>
        <div style={{ position: 'relative' }}>
          <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9B8E7B', pointerEvents: 'none' }}/>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@email.com"
            style={inputBase}
            onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
            onBlur={e => { e.currentTarget.style.borderColor = LINE }}
          />
        </div>
      </div>

      {/* Contraseña */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label htmlFor="login-password" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          Contraseña
        </label>
        <div style={{ position: 'relative' }}>
          <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9B8E7B', pointerEvents: 'none' }}/>
          <input
            id="login-password"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={{ ...inputBase, paddingRight: '2.75rem' }}
            onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
            onBlur={e => { e.currentTarget.style.borderColor = LINE }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7B', padding: 0 }}
          >
            {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: '0.25rem',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: '0.95rem',
          color: CREAM,
          background: loading ? '#9B8E7B' : INK,
          border: 'none',
          borderRadius: '0.75rem',
          padding: '0.9rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'background 0.2s',
          boxShadow: '0 4px 20px rgba(28,20,10,0.18)',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2e2010' }}
        onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = INK }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Ingresando...
          </span>
        ) : (
          <><span>Iniciar Sesión</span><ArrowRight size={16}/></>
        )}
      </button>
    </form>
  )
}
