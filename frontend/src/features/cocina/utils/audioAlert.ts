/**
 * Programmatic Web Audio API audio warning chord synthesis playing D5 & A5.
 * Handles browser autoplay locks and localStorage mute state configuration gracefully.
 */

let audioCtx: AudioContext | null = null

export function playKdsAlert() {
  try {
    // Check if sound is enabled in local storage (defaults to true)
    const soundEnabled = localStorage.getItem('kds_sound_enabled') !== 'false'
    if (!soundEnabled) {
      return
    }

    // Lazy initialize the AudioContext to avoid eager autoplay warnings
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // If context is suspended (often due to autoplay policies), try to resume
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch((err) => {
        console.warn('KDS Audio: Failed to resume audio context due to user interaction lock:', err)
      })
      // If we couldn't resume synchronously, return to avoid breaking execution
      if (audioCtx.state === 'suspended') {
        return
      }
    }

    const now = audioCtx.currentTime

    // Main gain node for volume control and exponential decay
    const gainNode = audioCtx.createGain()
    gainNode.gain.setValueAtTime(0.15, now) // Gentle volume
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)

    // Oscillator 1: D5 (587.33 Hz) - Warm root note
    const osc1 = audioCtx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)

    // Oscillator 2: A5 (880.00 Hz) - Perfect fifth above D5
    const osc2 = audioCtx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.00, now)

    // Route audio graph: oscillators -> gainNode -> speakers (destination)
    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    // Start oscillators instantly and stop after 0.6 seconds
    osc1.start(now)
    osc2.start(now)

    osc1.stop(now + 0.6)
    osc2.stop(now + 0.6)
  } catch (error) {
    console.warn('KDS Audio: Web Audio API error or not supported in this browser:', error)
  }
}
