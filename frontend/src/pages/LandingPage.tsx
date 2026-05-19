/**
 * LandingPage v2 — Bazar de Luz
 *
 * Sin emojis: usa SVGs ilustrativos propios.
 * Nav progresiva: solo "Iniciar sesión" al inicio;
 * "Ver catálogo" aparece al hacer scroll.
 */

import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { queryClient } from '@/shared/query/queryClient'
import './landing.css'

/* ─── Paleta ────────────────────────────────────────────────────────────── */
const BURNT    = '#B85C38'
const BURNT_LT = '#D4795A'
const MINT     = '#2E6B4F'
const INK      = '#1C140A'
const CREAM    = '#FAF7F2'

/* ─── SVGs ilustrativos (sin emojis) ───────────────────────────────────── */
function IconLeaf({ color = MINT, size = 48 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M8 40C8 40 14 18 38 10C38 10 36 32 8 40Z" fill={color} opacity=".9"/>
      <path d="M8 40C8 40 14 18 38 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 40C14 30 22 22 34 16" stroke="white" strokeWidth="1" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}

function IconGrain({ color = BURNT, size = 48 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <ellipse cx="24" cy="30" rx="10" ry="14" fill={color} opacity=".85"/>
      <path d="M24 16C24 16 20 20 24 30C28 20 24 16 24 16Z" fill={color}/>
      <path d="M24 8 L24 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 10 L22 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M28 10 L26 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconDrop({ color = BURNT_LT, size = 48 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 8 C24 8 10 22 10 31 A14 14 0 0 0 38 31 C38 22 24 8 24 8Z" fill={color} opacity=".85"/>
      <path d="M16 30 Q18 24 24 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
    </svg>
  )
}

function IconStar({ color = BURNT, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden>
      <path d="M8 1 L9.5 6 L14.5 6 L10.5 9.5 L12 14.5 L8 11 L4 14.5 L5.5 9.5 L1.5 6 L6.5 6 Z"/>
    </svg>
  )
}

function IconArrowRight({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}

/* ─── Datos estáticos (solo métricas fijas) ─────────────────────────────── */

const FEATURES = [
  {
    Icon: IconLeaf,
    iconColor: MINT,
    title: 'Del campo al mostrador',
    body: 'Trabajamos directamente con productores locales para que cada ingrediente llegue en su punto óptimo de frescura.',
  },
  {
    Icon: IconGrain,
    iconColor: BURNT,
    title: 'Selección artesanal',
    body: 'Cada producto es elegido a mano. Sin rellenos, sin intermediarios: solo lo que vale la pena poner en tu cocina.',
  },
  {
    Icon: IconDrop,
    iconColor: BURNT_LT,
    title: 'Sabor que se nota',
    body: 'La calidad premium no es marketing: es la diferencia real que sentís desde el primer plato que preparás.',
  },
]

const CATEGORIES = [
  { label: 'Carnes & Aves',      slug: 'carnes-y-aves',      accent: BURNT,   bg: '#FDF0E8', border: '#C4622D22', span: 'lp-cat-span2' },
  { label: 'Lácteos selectos',   slug: 'lacteos-selectos',   accent: '#9C5A28', bg: '#FBF5EC', border: '#A85C2A18', span: 'lp-cat-span1' },
  { label: 'Verduras frescas',   slug: 'verduras-frescas',   accent: MINT,    bg: '#EBF4EE', border: '#3D7A5E18', span: 'lp-cat-span1' },
  { label: 'Pastas & Granos',    slug: 'pastas-y-granos',    accent: '#7A5230', bg: '#F8EDE3', border: '#8B5E3C18', span: 'lp-cat-span2' },
]

/* ══════════════════════════════════════════════════════════════════════════ */
/*  Componentes                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

/* ── Nav ────────────────────────────────────────────────────────────────── */
function LandingNav() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const menuRef                   = useRef<HTMLDivElement>(null)
  const navigate                  = useNavigate()

  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user            = useAuthStore(s => s.user)
  const clearAuth       = useAuthStore(s => s.clearAuth)
  const isAdmin         = user?.roles?.includes('admin') ?? false

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleLogout() {
    clearAuth()
    queryClient.clear()
    setMenuOpen(false)
    navigate('/')
  }

  const dropItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.6rem 0.875rem', borderRadius: '0.6rem',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500,
    color: INK, textDecoration: 'none', transition: 'background 0.15s',
    width: '100%', border: 'none', cursor: 'pointer', background: 'none',
    textAlign: 'left' as const,
  }

  return (
    <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
      <Link to="/" className="lp-logo">
        The Food<span>Store</span>
      </Link>

      <div className="lp-nav-actions">
        {isAuthenticated && user ? (
          /* ── Autenticado: avatar + dropdown ─────────────── */
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: '0.875rem', color: INK,
                padding: '0.4rem 0.75rem',
                borderRadius: '2rem',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(28,20,10,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              <div style={{
                width: '1.9rem', height: '1.9rem', borderRadius: '50%',
                background: INK, color: CREAM,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
              }}>
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nombre}
              </span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.5"
                style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
                background: '#FFFFFF', borderRadius: '1rem',
                boxShadow: '0 8px 32px rgba(28,20,10,0.12)',
                border: '1px solid rgba(28,20,10,0.08)',
                overflow: 'hidden', minWidth: '190px', zIndex: 100,
              }}>
                {/* Header */}
                <div style={{ padding: '0.875rem 1rem', background: '#FAF7F2', borderBottom: '1px solid #E2D5C0' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: INK, margin: 0 }}>{user.nombre}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '0.72rem', color: '#9B8E7B', margin: 0 }}>{user.email}</p>
                </div>

                <div style={{ padding: '0.4rem' }}>
                  {/* Catálogo */}
                  <Link to="/catalogo" onClick={() => setMenuOpen(false)} style={dropItemStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAF7F2' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                      <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    Catálogo
                  </Link>

                  {/* Panel Admin (solo admins) */}
                  {isAdmin && (
                    <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}
                      style={{ ...dropItemStyle, color: BURNT }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF5F0' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect width="7" height="9" x="3" y="3" rx="1"/>
                        <rect width="7" height="5" x="14" y="3" rx="1"/>
                        <rect width="7" height="9" x="14" y="12" rx="1"/>
                        <rect width="7" height="5" x="3" y="16" rx="1"/>
                      </svg>
                      Panel Admin
                    </Link>
                  )}

                  <div style={{ height: '1px', background: '#E2D5C0', margin: '0.3rem 0.875rem' }}/>

                  {/* Cerrar sesión */}
                  <button onClick={handleLogout} style={{ ...dropItemStyle, color: '#C0392B' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── No autenticado: Iniciar sesión ──────────────── */
          <Link to="/login" className="lp-btn-ghost">Iniciar sesión</Link>
        )}


      </div>
    </nav>
  )
}

/* ── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="lp-hero">
      {/* Líneas de fondo — grid arquitectónico sutil */}
      <div className="lp-hero-bg-lines" aria-hidden>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          {/* Líneas verticales */}
          {[15, 35, 60, 80].map(x => (
            <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
              stroke="#1C140A" strokeWidth="0.5" strokeOpacity="0.04" />
          ))}
          {/* Línea diagonal derecha */}
          <line x1="75%" y1="0" x2="110%" y2="85%"
            stroke="#B85C38" strokeWidth="1" strokeOpacity="0.08" />
          {/* Círculo decorativo */}
          <circle cx="78%" cy="50%" r="22%"
            fill="none" stroke="#B85C38" strokeWidth="0.8" strokeOpacity="0.07"/>
          <circle cx="78%" cy="50%" r="14%"
            fill="none" stroke="#B85C38" strokeWidth="0.5" strokeOpacity="0.05"/>
        </svg>
      </div>

      {/* Floaters SVG — ilustraciones que flotan */}
      <div className="lp-floater lp-drift"
        style={{ top: '14%', right: '10%', opacity: 0.55 }}>
        <IconLeaf color={MINT} size={72} />
      </div>
      <div className="lp-floater lp-drift2"
        style={{ top: '55%', right: '6%', opacity: 0.45 }}>
        <IconGrain color={BURNT} size={56} />
      </div>
      <div className="lp-floater lp-drift3"
        style={{ top: '28%', right: '28%', opacity: 0.3 }}>
        <IconDrop color={BURNT_LT} size={44} />
      </div>

      {/* Blob orgánico */}
      <svg aria-hidden style={{ position: 'absolute', right: '-10%', bottom: '-5%',
        opacity: 0.06, pointerEvents: 'none', width: '55%' }} viewBox="0 0 600 600">
        <path d="M300,40 C430,20 580,130 565,275 C550,420 425,510 295,525 C165,540 30,445 25,305 C20,165 170,60 300,40Z" fill={BURNT}/>
      </svg>

      <div className="lp-hero-content">
        <div className="lp-eyebrow lp-rise">
          <span className="lp-eyebrow-line" />
          Sabores que cuentan historias
        </div>

        <h1 className="lp-h1 lp-rise-d1">
          Tu cocina,<br />
          <em>al siguiente</em><br />
          nivel.
        </h1>

        <p className="lp-subtitle lp-rise-d2">
          Ingredientes frescos, artesanales y de calidad premium, cuidadosamente
          seleccionados para elevar cada plato que preparás.
        </p>

        {/* Trigger ref para la visibilidad del botón de catálogo en la nav */}
        <div className="lp-hero-cta-row lp-rise-d3">
          <Link to="/login" className="lp-cta-main">
            Crear cuenta gratis
            <IconArrowRight size={16} color={CREAM} />
          </Link>
          <Link to="/catalogo" className="lp-cta-link">
            <IconStar size={10} color={BURNT} />
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Stats ──────────────────────────────────────────────────────────────── */
const STATS = [
  { value: '140+', label: 'Productos artesanales' },
  { value: '5',    label: 'Categorías curadas' },
  { value: '24h',  label: 'Entrega express' },
  { value: '100%', label: 'Origen local' },
]

function StatsStrip() {
  return (
    <section className="lp-stats">
      <div className="lp-stats-grid">
        {STATS.map(s => (
          <div key={s.label}>
            <div className="lp-stat-val">{s.value}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Features ───────────────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section className="lp-features">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="lp-section-label">
          <span style={{ display: 'inline-block', width: '1.5rem', height: '1.5px', background: BURNT, borderRadius: 2 }}/>
          Por qué elegirnos
        </div>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontVariationSettings: '"opsz" 72',
          fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
          fontWeight: 800,
          color: INK,
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          marginBottom: '2.5rem',
          maxWidth: 520,
        }}>
          La diferencia está en los detalles.
        </h2>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon">
                <f.Icon color={f.iconColor} size={28} />
              </div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-body">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Categories ─────────────────────────────────────────────────────────── */
function CategoriesSection() {
  return (
    <section className="lp-cats">
      <div className="lp-cats-header">
        <h2 className="lp-cats-h2">Todo lo que<br/>tu cocina necesita.</h2>
        <Link to="/catalogo" className="lp-cta-link">
          Ver todas las categorías <IconArrowRight size={14} color={BURNT} />
        </Link>
      </div>
      <div className="lp-cats-grid">
        {CATEGORIES.map((c, i) => (
          <Link
            key={i}
            to={`/catalogo?categoria=${c.slug}`}
            className={`lp-cat-card ${c.span}`}
            style={{ background: c.bg, borderColor: c.border }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${c.accent}22` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ width: 40, height: 40 }}>
              {i % 2 === 0
                ? <IconLeaf color={c.accent} size={40} />
                : <IconGrain color={c.accent} size={40} />
              }
            </div>
            <span className="lp-cat-name">{c.label}</span>
            <span className="lp-cat-cta" style={{ color: c.accent }}>
              Explorar <IconArrowRight size={12} color={c.accent} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="lp-final">
      {/* Arco de fondo */}
      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <ellipse cx="50%" cy="50%" rx="45%" ry="80%" fill={BURNT} fillOpacity="0.05"/>
        <ellipse cx="50%" cy="50%" rx="32%" ry="60%" fill={BURNT} fillOpacity="0.04"/>
      </svg>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
        <div className="lp-section-label" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span style={{ display: 'inline-block', width: '1.5rem', height: '1.5px', background: BURNT_LT, borderRadius: 2 }}/>
          <span style={{ color: BURNT_LT }}>Empezá hoy mismo</span>
          <span style={{ display: 'inline-block', width: '1.5rem', height: '1.5px', background: BURNT_LT, borderRadius: 2 }}/>
        </div>
        <h2 className="lp-final-h2">
          Ingredientes que<br/><em>inspiran.</em>
        </h2>
        <p className="lp-final-sub">
          Sumate a cientos de cocineros que ya descubrieron la diferencia de cocinar con lo mejor.
        </p>
        <Link to="/catalogo" className="lp-cta-main" style={{
          background: CREAM,
          color: INK,
          boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
          display: 'inline-flex',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0E8D8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = CREAM }}
        >
          Ir al catálogo ahora
          <IconArrowRight size={16} color={INK} />
        </Link>
      </div>
    </section>
  )
}

function LandingFooter() {
  const navLinks = [
    { label: 'Catálogo', to: '/catalogo' },
    { label: 'Iniciar sesión', to: '/login' },
    { label: 'Crear cuenta', to: '/registro' },
  ]
  
  const techStack = [
    { name: 'React', license: 'MIT License' },
    { name: 'TypeScript', license: 'Apache 2.0' },
    { name: 'Vite', license: 'MIT License' },
    { name: 'FastAPI', license: 'MIT License' },
    { name: 'PostgreSQL', license: 'PostgreSQL License' },
    { name: 'Zustand & TanStack', license: 'MIT License' },
  ]

  return (
    <footer className="lp-footer">
      <div className="lp-footer-grid">
        <div className="lp-footer-brand">
          <Link to="/" className="lp-logo" style={{ fontSize: '1.4rem', color: 'rgba(250,247,242,0.9)' }}>
            The Food<span>Store</span>
          </Link>
          <p className="lp-footer-tagline">
            Ingredientes de calidad premium para llevar tu cocina al siguiente nivel. Proyecto desarrollado con pasión y arquitectura moderna.
          </p>
        </div>

        <div className="lp-footer-column">
          <h4 className="lp-footer-heading">Navegación</h4>
          <div className="lp-footer-links-col">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className="lp-footer-link">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="lp-footer-column">
          <h4 className="lp-footer-heading">Stack & Licencias Open Source</h4>
          <div className="lp-footer-tech-list">
            {techStack.map(t => (
              <div key={t.name} className="lp-tech-item">
                <span className="lp-tech-name">{t.name}</span>
                <span className="lp-tech-license">{t.license}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <span className="lp-footer-copy">© {new Date().getFullYear()} The FoodStore Project. Desarrollado para demostración académica.</span>
        <span className="lp-footer-love">Construido con código abierto.</span>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  Componente principal                                                      */
/* ══════════════════════════════════════════════════════════════════════════ */



export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: CREAM, minHeight: '100vh' }}>
      <LandingNav />
      <HeroSection />
      <StatsStrip />
      <FeaturesSection />
      <CategoriesSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  )
}
