'use client'

import { ActionButton } from '@/components/action-button'
import { LevelCard } from '@/components/level-card'
import { createClient } from '@/lib/supabase/client'
import { getParticipantId, getSessionId, getParticipantName, getLocalAttempts } from '@/lib/session'
import {
  computeProgress,
  findNextTask,
  type TaskAttemptRow,
} from '@/lib/progress'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

type DashboardData = {
  name: string
  attempts: TaskAttemptRow[]
}

async function fetchDashboard(
  participantId: string,
  sessionId: string,
): Promise<DashboardData> {
  const supabase = createClient()

  // Offline mode: read the name saved locally at intake, no attempts persisted.
  if (!supabase) {
    return { name: getParticipantName() ?? 'friend', attempts: getLocalAttempts() }
  }

  try {
    const [{ data: participant }, { data: attempts }] = await Promise.all([
      supabase.from('participants').select('name').eq('id', participantId).single(),
      supabase
        .from('task_attempts')
        .select('level_number, task_key, status')
        .eq('session_id', sessionId),
    ])

    return {
      name: participant?.name ?? getParticipantName() ?? 'friend',
      attempts: (attempts as TaskAttemptRow[]) ?? [],
    }
  } catch (error) {
    console.log('[v0] dashboard fetch failed, showing local data:', error)
    return { name: getParticipantName() ?? 'friend', attempts: getLocalAttempts() }
  }
}

export function DashboardClient() {
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)
  const [ids, setIds] = useState<{
    participantId: string | null
    sessionId: string | null
  } | null>(null)

  useEffect(() => {
    const participantId = getParticipantId()
    const sessionId = getSessionId()
    if (!participantId || !sessionId) {
      router.replace('/intake')
      return
    }
    setIds({ participantId, sessionId })
  }, [router])

  const { data, isLoading, mutate } = useSWR(
    ids?.participantId && ids?.sessionId
      ? ['dashboard', ids.participantId, ids.sessionId]
      : null,
    ([, pid, sid]) => fetchDashboard(pid, sid),
  )

  useEffect(() => {
    const refresh = () => { void mutate() }
    window.addEventListener('dls:attempt-completed', refresh)
    return () => window.removeEventListener('dls:attempt-completed', refresh)
  }, [mutate])

  if (!ids || isLoading || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-xl font-semibold text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const progress = computeProgress(data.attempts)
  const nextTask = findNextTask(progress, data.attempts)
  const allDone = nextTask === null

  return (
    <main className="mx-auto max-w-2xl px-6 pb-40 pt-24 sm:py-10">
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-base font-bold text-secondary-foreground">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Your practice space
        </span>
        <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
          Welcome, {data.name}
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-muted-foreground">
          {allDone
            ? 'You have completed every level. Wonderful work!'
            : 'Pick up right where you left off, one small step at a time.'}
        </p>
      </header>

      {!allDone && (
        <div className="mb-8 rounded-3xl border-2 border-primary/30 bg-primary/5 p-6">
          <p className="text-lg font-semibold text-muted-foreground">
            Up next
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            Level {nextTask.levelNumber}
          </p>
          <ActionButton
            size="lg"
            className="mt-5 w-full"
            disabled={navigating}
            onClick={() => {
              if (navigating) return
              setNavigating(true)
              router.push(
                `/task?level=${nextTask.levelNumber}&task=${encodeURIComponent(nextTask.taskKey)}`,
              )
            }}
          >
            Continue
            <ArrowRight className="h-6 w-6" aria-hidden="true" />
          </ActionButton>
        </div>
      )}

      <h2 className="mb-4 text-2xl font-extrabold text-foreground">
        Your 4 levels
      </h2>
      <div className="flex flex-col gap-4">
        {progress.map((lp) => (
          <LevelCard key={lp.level.number} progress={lp} />
        ))}
      </div>

      <a
        href="/admin"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-border bg-card px-5 py-3 text-center font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
      >
        Open facilitator performance panel
      </a>
    </main>
  )
}
