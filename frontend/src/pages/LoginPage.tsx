/**
 * LoginPage — Diseño editorial "Bazar de Luz" para auth.
 * Usa la misma paleta y tipografía que la landing.
 */

import LoginForm from '@/features/auth/LoginForm'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Columna izquierda: ilustración editorial ─────────────── */}
      <div style={{
        background: '#1C140A',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem 3rem',
      }} className="hidden lg:flex">

        {/* Fondo con líneas de grilla */}
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {[20, 40, 65, 85].map(x => (
            <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
              stroke="#FAF7F2" strokeWidth="0.5" strokeOpacity="0.04" />
          ))}
          {[25, 50, 75].map(y => (
            <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
              stroke="#FAF7F2" strokeWidth="0.5" strokeOpacity="0.03" />
          ))}
          {/* Círculos decorativos */}
          <circle cx="75%" cy="55%" r="30%" fill="none" stroke="#B85C38" strokeWidth="0.6" strokeOpacity="0.12"/>
          <circle cx="75%" cy="55%" r="18%" fill="none" stroke="#B85C38" strokeWidth="0.4" strokeOpacity="0.08"/>
          {/* Blob naranja */}
          <path d="M80,400 C200,300 350,350 420,250 C490,150 480,80 550,40 L600,0 L600,600 L0,600 Z"
            fill="#B85C38" fillOpacity="0.06"/>
        </svg>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontVariationSettings: '"opsz" 72',
            fontWeight: 800,
            fontSize: '1.3rem',
            color: 'rgba(250,247,242,0.9)',
          }}>
            The Food<span style={{ color: '#D4795A' }}>Store</span>
          </span>
        </Link>

        {/* Cita central */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            width: '2rem',
            height: '2px',
            background: '#B85C38',
            borderRadius: 2,
            marginBottom: '1.5rem',
          }} />
          <blockquote style={{
            fontFamily: "'Fraunces', serif",
            fontVariationSettings: '"opsz" 144',
            fontWeight: 800,
            fontStyle: 'italic',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'rgba(250,247,242,0.92)',
            marginBottom: '1.25rem',
          }}>
            Cada plato<br/>comienza con<br/><span style={{ color: '#D4795A' }}>el ingrediente</span><br/>correcto.
          </blockquote>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
            fontWeight: 300,
            color: 'rgba(250,247,242,0.45)',
            letterSpacing: '0.04em',
          }}>
            Ingredientes artesanales · Origen local · Calidad premium
          </p>
        </div>

        {/* SVG hoja decorativa */}
        <svg aria-hidden style={{ position: 'absolute', bottom: '8%', right: '10%', opacity: 0.15 }}
          width="160" height="160" viewBox="0 0 48 48">
          <path d="M8 40C8 40 14 18 38 10C38 10 36 32 8 40Z" fill="#2E6B4F"/>
          <path d="M8 40C8 40 14 18 38 10" stroke="#2E6B4F" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <svg aria-hidden style={{ position: 'absolute', top: '20%', left: '6%', opacity: 0.1 }}
          width="100" height="100" viewBox="0 0 48 48">
          <ellipse cx="24" cy="30" rx="10" ry="14" fill="#B85C38"/>
          <path d="M24 16C24 16 20 20 24 30C28 20 24 16 24 16Z" fill="#B85C38"/>
          <path d="M24 8 L24 18" stroke="#B85C38" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Footer de la columna */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.72rem',
          color: 'rgba(250,247,242,0.25)',
          position: 'relative',
          zIndex: 1,
        }}>
          © {new Date().getFullYear()} FoodStore · Todos los derechos reservados
        </p>
      </div>

      {/* ── Columna derecha: formulario ──────────────────────────── */}
      <div style={{
        background: '#FAF7F2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        position: 'relative',
      }}>
        {/* Decoración sutil de fondo */}
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <circle cx="0" cy="0" r="30%" fill="#B85C38" fillOpacity="0.03"/>
          <circle cx="100%" cy="100%" r="35%" fill="#2E6B4F" fillOpacity="0.03"/>
        </svg>

        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
          {/* Logo mobile */}
          <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '2.5rem' }}
            className="lg:hidden">
            <span style={{
              fontFamily: "'Fraunces', serif",
              fontVariationSettings: '"opsz" 72',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: '#1C140A',
            }}>
              The Food<span style={{ color: '#B85C38' }}>Store</span>
            </span>
          </Link>

          {/* Encabezado */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-block',
              width: '1.5rem',
              height: '2px',
              background: '#B85C38',
              borderRadius: 2,
              marginBottom: '1rem',
            }} />
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontVariationSettings: '"opsz" 72',
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              color: '#1C140A',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              marginBottom: '0.6rem',
            }}>
              Bienvenido<br/>de vuelta.
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 300,
              color: '#6B5D4A',
            }}>
              Ingresá a tu cuenta para continuar.
            </p>
          </div>

          {/* Formulario */}
          <LoginForm />

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.75rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2D5C0' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B8E7B' }}>
              ¿Primera vez?
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E2D5C0' }} />
          </div>

          <Link to="/registro" style={{
            display: 'block',
            textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#1C140A',
            background: 'transparent',
            border: '1.5px solid #E2D5C0',
            padding: '0.8rem',
            borderRadius: '0.75rem',
            textDecoration: 'none',
            transition: 'border-color 0.2s, background 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#B85C38'
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(184,92,56,0.04)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#E2D5C0'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </div>
  )
}
