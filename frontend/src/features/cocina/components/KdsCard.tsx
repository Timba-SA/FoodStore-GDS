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
    // Sleek Premium Light Card
    cardClass = 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/50'
    waitBadgeClass = 'bg-slate-50 border-slate-100 text-slate-600'
    clockColorClass = 'text-emerald-500'
  } else if (waitMinutes < 20) {
    // Ambient Amber Card (10m to 20m)
    cardClass = 'bg-amber-50/20 border-amber-200 text-slate-800 hover:border-amber-300 shadow-[0_2px_15px_rgba(245,158,11,0.03)] hover:shadow-md hover:shadow-amber-100/30'
    waitBadgeClass = 'bg-amber-50 border-amber-100 text-amber-700 font-semibold'
    clockColorClass = 'text-amber-500'
  } else {
    // Flashing Pulsing Rose Red Card (>20m)
    cardClass = 'bg-rose-50/20 border-rose-200 text-slate-800 hover:border-rose-300 shadow-[0_2px_20px_rgba(244,63,94,0.06)] hover:shadow-md hover:shadow-rose-100/30 animate-[pulse_3s_infinite]'
    waitBadgeClass = 'bg-rose-50 border-rose-100 text-rose-700 font-extrabold'
    clockColorClass = 'text-rose-500 animate-pulse'
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
      <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-slate-400">
            Pedido
          </span>
          <h3 className="text-xl font-black text-slate-800 leading-tight">
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
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
          )}
        </div>
      </div>

      {/* Order details / Items */}
      <div className="flex-1 space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">
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
                  className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-sm flex flex-col gap-1 hover:border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span className="text-base font-extrabold text-orange-500">
                      {detalle.cantidad}x
                    </span>
                    <span className="text-slate-700 flex-1 ml-2 font-medium">
                      {detalle.nombre_snapshot || `Producto #${detalle.producto_id}`}
                    </span>
                  </div>

                  {exclusions.length > 0 && (
                    <div className="flex items-start gap-1 mt-1 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-1.5 px-2">
                      <UserMinus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-extrabold uppercase text-[9px] mr-1 text-rose-700">SIN:</strong>
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
          <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 text-xs flex gap-2">
            <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-700 uppercase tracking-widest text-[9px] block mb-1">
                Notas de Cliente
              </span>
              <p className="text-amber-800 leading-relaxed italic">
                "{order.notes || order.notas}"
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions Section */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={handleAction}
          disabled={isPending || (!isConfirmado && !isEnPreparacion)}
          className={`w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold tracking-wide uppercase transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${
            isConfirmado
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 focus:ring-orange-500 active:scale-95 cursor-pointer shadow-md hover:shadow-orange-100'
              : isEnPreparacion
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 focus:ring-emerald-500 active:scale-95 cursor-pointer shadow-md hover:shadow-emerald-100'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
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
