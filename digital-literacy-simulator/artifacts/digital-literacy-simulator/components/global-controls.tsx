'use client'

import { useEffect, useState } from 'react'
import { languages, getLanguage, setLanguage, type Language } from '@/lib/i18n'

/** Persistent language control rendered on every screen. */
export function GlobalControls() {
  const [language, setLocalLanguage] = useState<Language>('en')

  useEffect(() => {
    setLocalLanguage(getLanguage())
    const handleChange = () => setLocalLanguage(getLanguage())
    window.addEventListener('dls-language-change', handleChange)
    return () => window.removeEventListener('dls-language-change', handleChange)
  }, [])

  function choose(next: Language) {
    setLocalLanguage(next)
    setLanguage(next)
  }

  return (
    <>
      {/* Language toggle — top, centered, out of the way of content */}
      <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2">
        <div
          role="group"
          aria-label={language === 'hi' ? 'भाषा' : language === 'mr' ? 'भाषा' : 'Language'}
          className="flex items-center gap-1 rounded-full border-2 border-border bg-card/95 p-1 shadow-lg backdrop-blur"
        >
          {languages.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => choose(item.key)}
              aria-pressed={language === item.key}
              className={`min-h-[40px] rounded-full px-4 text-base font-bold transition-colors ${
                language === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.nativeLabel}
            </button>
          ))}
        </div>
      </div>


    </>
  )
}
