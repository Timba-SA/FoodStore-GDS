/**
 * AdminDashboardPage — Business metrics with recharts.
 * Route: /admin/dashboard
 */

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
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

function KPICard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub?: string
  icon: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: kpi, isLoading: kpiLoading } = useDashboardMetrics()
  const { data: ventas = [] } = useVentasMetrics(7)
  const { data: topProductos = [] } = useProductosTop(5)
  const { data: estados = [] } = useEstadosPedidos()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold">Panel de Administración</h1>
          <p className="text-orange-100 mt-1">Métricas del negocio en tiempo real</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
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
          {/* Ventas line chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Ingresos últimos 7 días
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ventas}>
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) =>
                    `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Estado de pedidos
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={estados}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ estado, percent }: { estado: string; percent: number }) =>
                    `${estado} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {estados.map((entry, index) => (
                    <Cell
                      key={entry.estado}
                      fill={ESTADO_COLORS[entry.estado] ?? COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top products bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
            Productos más vendidos (unidades)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductos} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#ea580c" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  )
}
