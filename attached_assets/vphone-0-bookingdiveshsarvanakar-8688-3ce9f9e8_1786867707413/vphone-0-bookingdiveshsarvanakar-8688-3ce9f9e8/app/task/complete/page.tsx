'use client'

import { useRouter } from 'next/navigation'
import { clearActiveSession } from '@/lib/session'

export default function TaskCompletePage() {
  const router = useRouter()
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Session complete</p>
        <h1 className="mt-3 text-4xl font-black text-balance">Thank you for practicing with us.</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">You completed every activity in this session. Your progress has been saved for the facilitator.</p>
        <button type="button" onClick={() => { clearActiveSession(); router.replace('/intake') }} className="mt-8 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground">Start new session</button>
      </section>
    </main>
  )
}
