export default function TaskLoading() {
  return <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row" aria-busy="true"><section className="flex-1 space-y-5"><div className="h-5 w-32 animate-pulse rounded bg-muted" /><div className="h-12 w-3/4 animate-pulse rounded-xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /></section><div className="h-[520px] w-full max-w-sm animate-pulse rounded-[2.4rem] bg-muted" /><span className="sr-only">Loading task</span></main>
}
