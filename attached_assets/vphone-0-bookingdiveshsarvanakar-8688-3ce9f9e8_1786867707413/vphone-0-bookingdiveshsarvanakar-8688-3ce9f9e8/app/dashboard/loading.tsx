export default function DashboardLoading() {
  return <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-8" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded-lg bg-muted" /><div className="h-32 animate-pulse rounded-3xl bg-muted" /><div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-3xl bg-muted" /><div className="h-48 animate-pulse rounded-3xl bg-muted" /></div><span className="sr-only">Loading dashboard</span></main>
}
