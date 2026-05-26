import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { playKdsAlert } from '../utils/audioAlert'

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const persisted = localStorage.getItem('kds_sound_enabled')
    if (persisted !== null) {
      setEnabled(persisted !== 'false')
    }
  }, [])

  const handleToggle = () => {
    const nextState = !enabled
    setEnabled(nextState)
    localStorage.setItem('kds_sound_enabled', String(nextState))
    
    if (nextState) {
      // Play a quick test sound to confirm audio is active and prompt browser audio permissions
      setTimeout(() => {
        playKdsAlert()
      }, 50)
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold tracking-wide border transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${
        enabled
          ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 focus:ring-orange-500 hover:border-slate-300'
          : 'bg-rose-50 text-rose-600 hover:bg-rose-100/70 border-rose-200 focus:ring-rose-500 hover:border-rose-300'
      }`}
      aria-label={enabled ? 'Mutear alertas de sonido' : 'Activar alertas de sonido'}
      title={enabled ? 'Mutear alertas de sonido' : 'Activar alertas de sonido'}
    >
      <span className="relative flex h-2 w-2">
        {enabled && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${enabled ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
      </span>

      {enabled ? (
        <Volume2 className="w-4.5 h-4.5 text-emerald-400 transition-transform hover:scale-110" />
      ) : (
        <VolumeX className="w-4.5 h-4.5 text-rose-400 transition-transform hover:scale-110" />
      )}

      <span className="font-semibold text-xs tracking-wider uppercase">
        {enabled ? 'Audio On' : 'Audio Off'}
      </span>
    </button>
  )
}
