/**
 * RegisterPage — Diseño editorial "Bazar de Luz" para registro.
 */

import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/authStore'
import { registerUser, RegisterRequest } from '../shared/api/auth'
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'

const CREAM = '#FAF7F2'
const INK   = '#1C140A'
const BURNT = '#B85C38'
const MUTED = '#6B5D4A'
const LINE  = '#E2D5C0'

function FieldWrapper({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#C0392B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={12}/> {error}
        </span>
      )}
    </div>
  )
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.9rem',
  color: INK,
  background: '#FFFFFF',
  border: `1.5px solid ${hasError ? '#C0392B' : LINE}`,
  borderRadius: '0.75rem',
  padding: '0.75rem 0.875rem 0.75rem 2.75rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
})

function InputIcon({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9B8E7B', pointerEvents: 'none' }}>
      {children}
    </div>
  )
}

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<RegisterRequest>({ nombre: '', email: '', password: '', numero_telefono: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  if (isAuthenticated) return <Navigate to="/catalogo" replace />

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (fieldErrors[e.target.name]) setFieldErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n })
    setError(null)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.nombre.trim() || formData.nombre.trim().length < 2) errs.nombre = 'Mínimo 2 caracteres'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email inválido'
    if (formData.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (formData.password !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setIsLoading(true)
    try {
      await registerUser({ nombre: formData.nombre.trim(), email: formData.email.trim(), password: formData.password, numero_telefono: formData.numero_telefono || undefined })
      navigate('/catalogo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Columna izquierda: panel oscuro ─────────────────────── */}
      <div style={{ background: INK, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2.5rem 3rem' }} className="hidden lg:flex">
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {[20, 40, 65, 85].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke={CREAM} strokeWidth="0.5" strokeOpacity="0.04"/>)}
          <circle cx="75%" cy="55%" r="30%" fill="none" stroke={BURNT} strokeWidth="0.6" strokeOpacity="0.12"/>
          <path d="M-20,500 C100,400 300,420 400,300 C500,180 480,80 600,20 L600,600 L0,600 Z" fill="#2E6B4F" fillOpacity="0.06"/>
        </svg>

        <Link to="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: '"opsz" 72', fontWeight: 800, fontSize: '1.3rem', color: 'rgba(250,247,242,0.9)' }}>
            The Food<span style={{ color: '#D4795A' }}>Store</span>
          </span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '2rem', height: '2px', background: BURNT, borderRadius: 2, marginBottom: '1.5rem' }} />
          <blockquote style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: '"opsz" 144', fontWeight: 800, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'rgba(250,247,242,0.92)', marginBottom: '1.25rem' }}>
            Tu próxima<br/>comida favorita<br/>empieza<br/><span style={{ color: '#D4795A' }}>acá.</span>
          </blockquote>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: 'rgba(250,247,242,0.4)' }}>
            Sumate a cientos de cocineros que ya eligieron calidad.
          </p>
        </div>

        {/* SVGs decorativos */}
        <svg aria-hidden style={{ position: 'absolute', bottom: '12%', right: '8%', opacity: 0.12 }} width="140" height="140" viewBox="0 0 48 48">
          <path d="M8 40C8 40 14 18 38 10C38 10 36 32 8 40Z" fill="#2E6B4F"/>
        </svg>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: 'rgba(250,247,242,0.2)', position: 'relative', zIndex: 1 }}>
          © {new Date().getFullYear()} FoodStore
        </p>
      </div>

      {/* ── Columna derecha: formulario ──────────────────────────── */}
      <div style={{ background: CREAM, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', overflowY: 'auto', position: 'relative' }}>
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <circle cx="100%" cy="0" r="28%" fill={BURNT} fillOpacity="0.03"/>
          <circle cx="0" cy="100%" r="32%" fill="#2E6B4F" fillOpacity="0.03"/>
        </svg>

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          {/* Logo mobile */}
          <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '2rem' }} className="lg:hidden">
            <span style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: '"opsz" 72', fontWeight: 800, fontSize: '1.3rem', color: INK }}>
              The Food<span style={{ color: BURNT }}>Store</span>
            </span>
          </Link>

          {/* Encabezado */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ width: '1.5rem', height: '2px', background: BURNT, borderRadius: 2, marginBottom: '1rem' }} />
            <h1 style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: '"opsz" 72', fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: INK, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              Crear tu cuenta.
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: 300, color: MUTED }}>
              Rápido, gratis y sin complicaciones.
            </p>
          </div>

          {/* Error global */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#FEF2F2', color: '#C0392B', border: '1px solid #FCA5A5', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <AlertCircle size={15}/> {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <FieldWrapper label="Nombre completo" error={fieldErrors.nombre}>
              <div style={{ position: 'relative' }}>
                <InputIcon><User size={15}/></InputIcon>
                <input id="nombre" name="nombre" type="text" required placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} disabled={isLoading}
                  style={inputStyle(!!fieldErrors.nombre)}
                  onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.nombre ? '#C0392B' : LINE }}
                />
              </div>
            </FieldWrapper>

            <FieldWrapper label="Email" error={fieldErrors.email}>
              <div style={{ position: 'relative' }}>
                <InputIcon><Mail size={15}/></InputIcon>
                <input id="email" name="email" type="email" required placeholder="tu@email.com" value={formData.email} onChange={handleChange} disabled={isLoading}
                  style={inputStyle(!!fieldErrors.email)}
                  onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.email ? '#C0392B' : LINE }}
                />
              </div>
            </FieldWrapper>

            <FieldWrapper label="Contraseña" error={fieldErrors.password}>
              <div style={{ position: 'relative' }}>
                <InputIcon><Lock size={15}/></InputIcon>
                <input id="password" name="password" type={showPwd ? 'text' : 'password'} required placeholder="Mínimo 8 caracteres" value={formData.password} onChange={handleChange} disabled={isLoading}
                  style={{ ...inputStyle(!!fieldErrors.password), paddingRight: '2.75rem' }}
                  onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.password ? '#C0392B' : LINE }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7B', padding: 0 }}>
                  {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </FieldWrapper>

            <FieldWrapper label="Confirmar contraseña" error={fieldErrors.confirmPassword}>
              <div style={{ position: 'relative' }}>
                <InputIcon><Lock size={15}/></InputIcon>
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} required placeholder="Repetí tu contraseña" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(null) }} disabled={isLoading}
                  style={{ ...inputStyle(!!fieldErrors.confirmPassword), paddingRight: '2.75rem' }}
                  onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.confirmPassword ? '#C0392B' : LINE }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8E7B', padding: 0 }}>
                  {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </FieldWrapper>

            <FieldWrapper label="Teléfono (opcional)" error={fieldErrors.numero_telefono}>
              <div style={{ position: 'relative' }}>
                <InputIcon><Phone size={15}/></InputIcon>
                <input id="numero_telefono" name="numero_telefono" type="tel" placeholder="+54 11 1234 5678" value={formData.numero_telefono} onChange={handleChange} disabled={isLoading}
                  style={inputStyle(!!fieldErrors.numero_telefono)}
                  onFocus={e => { e.currentTarget.style.borderColor = BURNT }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.numero_telefono ? '#C0392B' : LINE }}
                />
              </div>
            </FieldWrapper>

            <button type="submit" disabled={isLoading} style={{
              marginTop: '0.5rem',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              color: CREAM,
              background: isLoading ? '#9B8E7B' : INK,
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s',
              boxShadow: '0 4px 20px rgba(28,20,10,0.18)',
            }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#2e2010' }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = INK }}
            >
              {isLoading ? 'Creando cuenta...' : (<><span>Crear mi cuenta</span><ArrowRight size={16}/></>)}
            </button>
          </form>

          {/* Divisor y link a login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 1rem' }}>
            <div style={{ flex: 1, height: '1px', background: LINE }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B8E7B' }}>¿Ya tenés cuenta?</span>
            <div style={{ flex: 1, height: '1px', background: LINE }} />
          </div>

          <Link to="/login" style={{
            display: 'block', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: INK,
            background: 'transparent', border: `1.5px solid ${LINE}`, padding: '0.8rem', borderRadius: '0.75rem', textDecoration: 'none', transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BURNT }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = LINE }}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
