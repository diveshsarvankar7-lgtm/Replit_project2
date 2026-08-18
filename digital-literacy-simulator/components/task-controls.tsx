'use client'

import { RotateCcw, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

/**
 * Persistent per-task controls shown on every task screen. Fixed to the
 * bottom-left so a stuck participant can always repeat the current step or
 * restart the whole task. (The Need Help button lives bottom-right.)
 */
export function TaskControls({
  onRepeat,
  onStartOver,
}: {
  onRepeat?: () => void
  onStartOver?: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className="relative order-3 flex w-full flex-wrap gap-2 pt-1 md:fixed md:bottom-4 md:left-4 md:z-40 md:w-auto md:max-w-[calc(100vw-11rem)] md:flex-col md:pt-0">
      {onRepeat && (
        <button
          type="button"
          onClick={onRepeat}
          className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 text-sm font-bold text-foreground shadow-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 md:min-h-[52px] md:gap-2 md:px-4 md:text-base"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          {t('repeatStep')}
        </button>
      )}
      {onStartOver && (
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 text-sm font-bold text-foreground shadow-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 md:min-h-[52px] md:gap-2 md:px-4 md:text-base"
        >
          <RefreshCw className="h-5 w-5" aria-hidden="true" />
          {t('startOver')}
        </button>
      )}
    </div>
  )
}
