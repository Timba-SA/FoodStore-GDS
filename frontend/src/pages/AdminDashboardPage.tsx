/**
 * AdminDashboardPage — Business metrics with recharts. Premium redesign.
 * Route: /admin/dashboard
 */

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import {
  useDashboardMetrics,
  useVentasMetrics,
  useProductosTop,
  useEstadosPedidos,
} from '@/entities/admin/hooks'

const COLORS = ['#ea580c', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmado: '#3b82f6',
  en_preparacion: '#8b5cf6',
  en_camino: '#6366f1',
  entregado: '#10b981',
  cancelado: '#ef4444',
}

function KPICard({ label, value, sub, icon }: {
  label: string; value: string; sub?: string; icon: string
}) {
  return (
    <div className="card group hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 px-4 py-3">
        <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
        <p className="text-base font-extrabold text-orange-600">
          ${Number(payload[0]?.value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

export default function AdminDashboardPage() {
  const { data: kpi, isLoading: kpiLoading } = useDashboardMetrics()
  const { data: ventas = [] } = useVentasMetrics(7)
  const { data: topProductos = [] } = useProductosTop(5)
  const { data: estados = [] } = useEstadosPedidos()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-40 bg-amber-500/5 rounded-full blur-2xl" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Panel de Control</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Administración</h1>
          <p className="text-slate-400 mt-1 text-sm">Métricas del negocio en tiempo real</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8 -mt-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-slate-100" />
            ))
          ) : kpi ? (
            <>
              <KPICard label="Total Pedidos" value={kpi.total_pedidos.toString()} icon="📦" />
              <KPICard
                label="Ingresos Totales"
                value={`$${kpi.total_ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                icon="💰"
              />
              <KPICard label="Pedidos Hoy" value={kpi.pedidos_hoy.toString()} icon="🚀" />
              <KPICard
                label="Ingresos Hoy"
                value={`$${kpi.ingresos_hoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                sub={kpi.top_producto ? `Top: ${kpi.top_producto.nombre}` : undefined}
                icon="📈"
              />
            </>
          ) : null}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line chart */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Ingresos — Últimos 7 días
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ventas} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Outfit' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Outfit' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="url(#orangeGradient)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Estado de Pedidos
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={estados}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  label={false}
                >
                  {estados.map((entry, index) => (
                    <Cell
                      key={entry.estado}
                      fill={ESTADO_COLORS[entry.estado] ?? COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600, fontFamily: 'Outfit' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Productos más vendidos (unidades)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductos} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Outfit' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                width={160}
                tick={{ fontSize: 12, fill: '#475569', fontFamily: 'Outfit' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Outfit' }}
              />
              <Bar dataKey="cantidad" radius={[0, 8, 8, 0]}>
                {topProductos.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#ea580c' : i === 1 ? '#f97316' : '#fb923c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  )
}
