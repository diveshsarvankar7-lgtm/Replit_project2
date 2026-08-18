'use client'

const EVENT = 'dls-success-pulse'

/**
 * Signals a successful tap/action. Triggers the global visual pulse overlay and
 * a short device vibration (where supported). Safe to call anywhere on the client.
 */
export function pulseSuccess() {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(EVENT))
    if ('vibrate' in navigator) navigator.vibrate?.(35)
  } catch {
    // no-op: feedback is best-effort and must never break a flow
  }
}

export function onSuccessPulse(handler: () => void) {
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
