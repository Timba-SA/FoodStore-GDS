import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, Play, CheckCircle, FileText, UserMinus } from 'lucide-react'
import { useIngredientes } from '@/entities/ingrediente/hooks'
import { useUpdateKdsOrderStatus } from '../api/cocinaApi'
import type { KdsOrder } from '../types'

interface Props {
  order: KdsOrder
}

export function KdsCard({ order }: Props) {
  const { data: ingredientes = [] } = useIngredientes()
  const { mutate: updateStatus, isPending } = useUpdateKdsOrderStatus()
  const [waitText, setWaitText] = useState('')
  const [waitMinutes, setWaitMinutes] = useState(0)

  // Calculate and update the timer
  useEffect(() => {
    const calculateTime = () => {
      const createdTime = new Date(order.created_at).getTime()
      const now = Date.now()
      const diffMs = now - createdTime
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      
      setWaitMinutes(mins)
      setWaitText(`${mins}m ${secs}s`)
    }

    calculateTime()
    const interval = setInterval(calculateTime, 15000)
    return () => clearInterval(interval)
  }, [order.created_at])

  // Determine styling based on wait time minutes
  let cardClass = ''
  let waitBadgeClass = ''
  let clockColorClass = ''

  if (waitMinutes < 10) {
    // Sleek Dark Slate Card
    cardClass = 'bg-slate-900 border-slate-800 text-slate-100 hover:border-slate-700/80'
    waitBadgeClass = 'bg-slate-800 border-slate-700 text-slate-300'
    clockColorClass = 'text-emerald-400'
  } else if (waitMinutes < 20) {
    // Ambient Amber Card (10m to 20m)
    cardClass = 'bg-slate-900 border-amber-500/40 text-slate-100 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
    waitBadgeClass = 'bg-amber-950/40 border-amber-500/20 text-amber-300'
    clockColorClass = 'text-amber-400'
  } else {
    // Flashing Pulsing Rose Red Card (>20m)
    cardClass = 'bg-slate-900 border-rose-500/80 text-slate-100 hover:border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-[pulse_3s_infinite]'
    waitBadgeClass = 'bg-rose-950/60 border-rose-500/40 text-rose-300 font-extrabold'
    clockColorClass = 'text-rose-400 animate-pulse'
  }

  const handleAction = () => {
    if (order.estado_nombre === 'confirmado') {
      updateStatus({ id: order.id, nuevo_estado: 'en_preparacion' })
    } else if (order.estado_nombre === 'en_preparacion') {
      updateStatus({ id: order.id, nuevo_estado: 'en_camino' })
    }
  }

  const isConfirmado = order.estado_nombre === 'confirmado'
  const isEnPreparacion = order.estado_nombre === 'en_preparacion'

  return (
    <div
      className={`flex flex-col h-full rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden ${cardClass}`}
    >
      {/* Visual background atmospheric lights for alerting */}
      {waitMinutes >= 10 && waitMinutes < 20 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      )}
      {waitMinutes >= 20 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Card Header */}
      <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-slate-400">
            Pedido
          </span>
          <h3 className="text-xl font-black text-slate-100 leading-tight">
            #{order.numero_pedido}
          </h3>
        </div>

        {/* Wait time badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${waitBadgeClass}`}
        >
          <Clock className={`w-3.5 h-3.5 ${clockColorClass}`} />
          <span>{waitText || '0m 0s'}</span>
          {waitMinutes >= 20 && (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          )}
        </div>
      </div>

      {/* Order details / Items */}
      <div className="flex-1 space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-2">
            Detalles
          </span>
          <ul className="space-y-3">
            {order.detalles.map((detalle) => {
              // Resolve custom exclusion/personalization ingredient names
              const exclusions =
                detalle.personalizacion && detalle.personalizacion.length > 0
                  ? detalle.personalizacion.map((id) => {
                      const ing = ingredientes.find((i) => i.id === id)
                      return ing ? ing.nombre : `ID ${id}`
                    })
                  : []

              return (
                <li
                  key={detalle.id}
                  className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 text-sm flex flex-col gap-1 hover:border-slate-800 transition"
                >
                  <div className="flex justify-between items-center font-bold text-slate-200">
                    <span className="text-base font-extrabold text-orange-400">
                      {detalle.cantidad}x
                    </span>
                    <span className="text-slate-100 flex-1 ml-2 font-medium">
                      {detalle.nombre_snapshot || `Producto #${detalle.producto_id}`}
                    </span>
                  </div>

                  {exclusions.length > 0 && (
                    <div className="flex items-start gap-1 mt-1 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/10 rounded-lg p-1.5 px-2">
                      <UserMinus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-extrabold uppercase text-[9px] mr-1">SIN:</strong>
                        {exclusions.join(', ')}
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Customer notes */}
        {order.notes || order.notas ? (
          <div className="bg-amber-950/15 border border-amber-500/10 rounded-xl p-3 text-xs flex gap-2">
            <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-300 uppercase tracking-widest text-[9px] block mb-1">
                Notas de Cliente
              </span>
              <p className="text-amber-200/90 leading-relaxed italic">
                "{order.notes || order.notas}"
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions Section */}
      <div className="mt-5 pt-3 border-t border-slate-800">
        <button
          onClick={handleAction}
          disabled={isPending || (!isConfirmado && !isEnPreparacion)}
          className={`w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold tracking-wide uppercase transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            isConfirmado
              ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400 focus:ring-orange-500 active:scale-95 cursor-pointer'
              : isEnPreparacion
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 focus:ring-emerald-500 active:scale-95 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          } ${isPending ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isConfirmado ? (
            <>
              <Play className="w-4 h-4 text-white animate-pulse" />
              <span>Tomar Pedido</span>
            </>
          ) : isEnPreparacion ? (
            <>
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Terminar Pedido</span>
            </>
          ) : (
            <span>Completado</span>
          )}
        </button>
      </div>
    </div>
  )
}
