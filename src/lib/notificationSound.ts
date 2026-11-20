const SOUND_ENABLED_KEY = "jssg_sound_notifications_enabled"

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass()
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/** Check if payment notification sound is enabled (defaults to true). */
export function isNotificationSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_ENABLED_KEY)
    return val === null ? true : val === "true"
  } catch {
    return true
  }
}

/** Set payment notification sound enabled/disabled. */
export function setNotificationSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
  } catch {
    // ignore
  }
}

/**
 * Plays a pleasant, gentle 2-tone melodic chime for payments and contributions
 * using the browser's native Web Audio API (Zero external assets required).
 */
export function playNotificationChime(): void {
  if (!isNotificationSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // First tone (higher gentle bell)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Second tone (harmonious chord note)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(880, now + 0.08) // A5
    gain2.gain.setValueAtTime(0, now + 0.08)
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.6)
  } catch (err) {
    // Non-blocking if browser audio policy prevents autoplay
    console.debug("Payment chime audio unavailable:", err)
  }
}
