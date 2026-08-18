'use client'

import { useState } from 'react'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? 'Incorrect password.')
      }
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Facilitator view</p>
        <h1 className="mt-3 text-4xl font-black">Research analytics</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">Enter the facilitator password to continue.</p>
        <label htmlFor="admin-password" className="mt-8 block text-lg font-bold">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-3 min-h-14 w-full rounded-2xl border-2 border-input bg-background px-4 text-xl focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
          required
        />
        {error && <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 font-semibold text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="mt-6 min-h-14 w-full rounded-2xl bg-primary px-5 py-3 text-lg font-bold text-primary-foreground disabled:opacity-60">
          {loading ? 'Checking…' : 'Unlock analytics'}
        </button>
      </form>
    </main>
  )
}