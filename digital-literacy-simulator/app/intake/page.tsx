'use client'

import { ActionButton } from '@/components/action-button'
import { createClient } from '@/lib/supabase/client'
import { setActiveSession, generateLocalId, clearActiveSession } from '@/lib/session'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { languages, setLanguage, type Language } from '@/lib/i18n'

export default function IntakePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [language, setSelectedLanguage] = useState<Language>('en')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const ageNum = Number.parseInt(age, 10)

    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 120) {
      setError('Please enter a valid age.')
      return
    }

    setSubmitting(true)
    try {
      // A new participant starting the simulator must never inherit a
      // previous participant's locally-cached progress. Wipe it before
      // creating anything new for this submission.
      clearActiveSession()

      const supabase = createClient()

      // Offline mode: no Supabase configured. The simulator is fully usable
      // without a backend, so create a local session and continue.
      if (!supabase) {
        setActiveSession(generateLocalId(), generateLocalId(), trimmedName)
        router.push('/task?level=1&task=increase_text_size')
        return
      }

      const withLanguage = await supabase
        .from('participants')
        .insert({ name: trimmedName, age: ageNum, language })
        .select('id')
        .single()
      const { data: participant, error: pErr } = withLanguage.error
        ? await supabase.from('participants').insert({ name: trimmedName, age: ageNum }).select('id').single()
        : withLanguage

      if (pErr || !participant) throw pErr ?? new Error('No participant returned')

      const { data: session, error: sErr } = await supabase
        .from('sessions')
        .insert({ participant_id: participant.id, current_level: 1 })
        .select('id')
        .single()

      if (sErr || !session) throw sErr ?? new Error('No session returned')

      setActiveSession(participant.id, session.id, trimmedName)
       router.push('/task?level=1&task=increase_text_size')
    } catch (err) {
      console.log('[v0] intake error, falling back to local session:', err)
      // Never strand the participant — fall back to a local session.
      setActiveSession(generateLocalId(), generateLocalId(), trimmedName)
      router.push('/task?level=1&task=increase_text_size')
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 pb-28 pt-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-xl py-2 pr-3 text-lg font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-balance text-4xl font-extrabold leading-tight text-foreground">
          Let&apos;s get you set up
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-muted-foreground">
          Just two quick things. No password needed.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-2xl font-bold text-foreground">Choose your language</legend>
            <div className="grid grid-cols-3 gap-3">
              {languages.map((item) => (
                <button key={item.key} type="button" onClick={() => { setSelectedLanguage(item.key); setLanguage(item.key) }} className={`min-h-16 rounded-2xl border-2 px-3 text-lg font-bold ${language === item.key ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-foreground'}`} aria-pressed={language === item.key}>
                  {item.nativeLabel}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            <label htmlFor="name" className="text-2xl font-bold text-foreground">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Margaret"
              className="min-h-[64px] rounded-2xl border-2 border-input bg-card px-5 text-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="age" className="text-2xl font-bold text-foreground">
              Your age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 68"
              className="min-h-[64px] rounded-2xl border-2 border-input bg-card px-5 text-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-destructive/10 px-5 py-4 text-lg font-semibold text-destructive"
            >
              {error}
            </p>
          )}

          <ActionButton type="submit" size="lg" disabled={submitting} className="mr-36 w-[calc(100%-9rem)] sm:mr-0 sm:w-auto">
            {submitting ? 'Setting up…' : 'Continue'}
          </ActionButton>
        </form>
      </div>
    </main>
  )
}
