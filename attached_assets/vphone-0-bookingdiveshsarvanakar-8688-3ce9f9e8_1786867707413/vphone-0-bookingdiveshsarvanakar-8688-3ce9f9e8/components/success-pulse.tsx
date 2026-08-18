'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { onSuccessPulse } from '@/lib/feedback'

/**
 * Global, app-wide success feedback. When any interaction calls `pulseSuccess()`,
 * a brief expanding ring + checkmark appears centered on screen. This makes a
 * correct tap unambiguous through motion and shape (not color alone), satisfying
 * the accessibility requirement.
 */
export function SuccessPulse() {
  const [pulseId, setPulseId] = useState(0)

  useEffect(() => {
    return onSuccessPulse(() => setPulseId((id) => id + 1))
  }, [])

  useEffect(() => {
    if (pulseId === 0) return
    const timeout = window.setTimeout(() => setPulseId(0), 650)
    return () => window.clearTimeout(timeout)
  }, [pulseId])

  if (pulseId === 0) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
    >
      <span className="absolute h-28 w-28 rounded-full bg-success/25 dls-ring" />
      <span className="dls-pop flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground shadow-xl">
        <Check className="h-11 w-11" strokeWidth={3} />
      </span>
    </div>
  )
}
