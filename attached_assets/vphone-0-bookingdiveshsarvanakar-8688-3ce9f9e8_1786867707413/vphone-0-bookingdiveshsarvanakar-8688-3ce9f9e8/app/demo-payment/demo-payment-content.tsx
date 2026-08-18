'use client'

import { useSearchParams } from 'next/navigation'

export function DemoPaymentContent() {
  const params = useSearchParams()
  const receiver = params.get('receiver') ?? 'Local Grocery Store'
  const amount = params.get('amount') ?? '100'

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 text-center shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Practice only</p>
        <h1 className="mt-3 text-3xl font-black">Demo payment page</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">This QR code opened a safe training page. No payment or bank information is collected.</p>
        <div className="mt-6 rounded-2xl bg-secondary p-5 text-left">
          <p className="text-sm font-bold text-muted-foreground">Receiver</p>
          <p className="text-xl font-black">{receiver}</p>
          <p className="mt-4 text-sm font-bold text-muted-foreground">Amount</p>
          <p className="text-xl font-black">₹{amount}</p>
        </div>
      </section>
    </main>
  )
}
