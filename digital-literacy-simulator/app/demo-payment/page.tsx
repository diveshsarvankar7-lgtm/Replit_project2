import { Suspense } from 'react'

import { DemoPaymentContent } from './demo-payment-content'

export default function DemoPaymentPage() {
  return (
    <Suspense fallback={<DemoPaymentFallback />}>
      <DemoPaymentContent />
    </Suspense>
  )
}

function DemoPaymentFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 text-center shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Practice only</p>
        <h1 className="mt-3 text-3xl font-black">Demo payment page</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Loading payment details…</p>
      </section>
    </main>
  )
}
