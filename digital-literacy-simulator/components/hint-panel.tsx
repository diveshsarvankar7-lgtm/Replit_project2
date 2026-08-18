'use client'

import { useEffect, useState } from 'react'
import { recordHintUsed } from '@/lib/analytics'
import { getLanguage, t, type Language } from '@/lib/i18n'

interface HintPanelProps {
  hints: string[]
  taskKey: string
}

export function HintPanel({ hints, taskKey }: HintPanelProps) {
  const [language, setLanguage] = useState<Language>('en')
  const [index, setIndex] = useState(-1)

  useEffect(() => {
    setLanguage(getLanguage())
    const handleChange = () => setLanguage(getLanguage())
    window.addEventListener('dls-language-change', handleChange)
    return () => window.removeEventListener('dls-language-change', handleChange)
  }, [])

  function showNextHint() {
    const nextIndex = Math.min(index + 1, hints.length - 1)
    setIndex(nextIndex)
    void recordHintUsed(taskKey)
  }

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-primary">{t(language, 'hintLabel')}</p>
        <button type="button" onClick={showNextHint} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          {t(language, 'showHint')}
        </button>
      </div>
      {index >= 0 && <p className="mt-3 text-sm leading-relaxed text-foreground">{hints[index]}</p>}
    </div>
  )
}
