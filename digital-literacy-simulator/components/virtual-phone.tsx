'use client'

import { cn } from '@/lib/utils'
import { languages, getLanguage, setLanguage, type Language } from '@/lib/i18n'
import { BatteryFull, Signal, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

interface VirtualPhoneProps {
  children: ReactNode
  /** Optional label announced to screen readers describing the current screen. */
  screenLabel?: string
  className?: string
  /** When explicitly false, the status-bar Wi-Fi icon renders dimmed/off - used by the Wi-Fi task so the phone's own status bar reflects the practiced action. */
  wifi?: boolean
}

/**
 * Generic, reusable smartphone frame.
 * Renders a rounded device shell with a notch and a live status bar,
 * then a scrollable content area where any "app screen" is rendered as children.
 * Intentionally NOT tied to any specific task.
 */
export function VirtualPhone({
  children,
  screenLabel,
  className,
  wifi = true,
}: VirtualPhoneProps) {
  const time = useClock()
  const [language, setPhoneLanguage] = useState<Language>('en')

  useEffect(() => {
    setPhoneLanguage(getLanguage())
    const handleChange = () => setPhoneLanguage(getLanguage())
    window.addEventListener('dls-language-change', handleChange)
    return () => window.removeEventListener('dls-language-change', handleChange)
  }, [])

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[min(100%,360px)] select-none px-1 sm:px-0',
        'animate-[phone-in_0.35s_ease-out]',
        className,
      )}
    >
      {/* Device shell */}
      <div className="relative rounded-[2.6rem] border-4 border-neutral-800 bg-neutral-900 p-1.5 shadow-2xl sm:rounded-[3rem] sm:border-[6px] sm:p-2">
        {/* Screen */}
        <div
          role="group"
          aria-label={screenLabel ?? 'Smartphone screen'}
          className="relative flex h-[min(720px,calc(100dvh-170px))] min-h-[500px] flex-col overflow-hidden rounded-[2rem] bg-card sm:h-[720px] sm:rounded-[2.4rem]"
        >
          {/* Notch */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 flex h-7 w-40 -translate-x-1/2 items-center justify-center rounded-b-2xl bg-neutral-900">
            <div className="h-1.5 w-12 rounded-full bg-neutral-700" />
          </div>

          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pb-1 pt-3 text-sm font-bold text-foreground">
            <span aria-label={`Time ${time}`}>{time}</span>
            <div className="flex items-center gap-1.5">
              <select aria-label="Language" value={language} onChange={(event) => { const next = event.target.value as Language; setPhoneLanguage(next); setLanguage(next) }} className="bg-transparent text-xs font-bold text-foreground outline-none">
                {languages.map((item) => <option key={item.key} value={item.key}>{item.nativeLabel}</option>)}
              </select>
              <Signal className="h-4 w-4" aria-hidden="true" />
              {wifi ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4 opacity-50" />}
              <BatteryFull className="h-5 w-5" />
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="relative flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-2">
            <div className="h-1.5 w-32 rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  )
}

function useClock() {
  const [time, setTime] = useState('9:41')

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      )
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  return time
}
