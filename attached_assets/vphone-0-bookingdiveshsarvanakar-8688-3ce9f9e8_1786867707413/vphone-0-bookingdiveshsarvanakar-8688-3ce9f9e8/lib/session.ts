// Lightweight "active participant" tracking via localStorage.
// This app has NO auth — a participant id identifies the active learner.

const PARTICIPANT_KEY = 'dls_participant_id'
const SESSION_KEY = 'dls_session_id'
const NAME_KEY = 'dls_participant_name'
const ATTEMPTS_KEY = 'dls_local_attempts'

export type LocalAttempt = {
  level_number: number
  task_key: string
  status: string
  attempts?: number
  choice_correct?: boolean
  metadata?: Record<string, unknown>
}

export function setActiveSession(participantId: string, sessionId: string, name?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PARTICIPANT_KEY, participantId)
  window.localStorage.setItem(SESSION_KEY, sessionId)
  if (name) window.localStorage.setItem(NAME_KEY, name)
}

export function getParticipantId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(PARTICIPANT_KEY)
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_KEY)
}

export function getParticipantName(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(NAME_KEY)
}

/** Generates a stable id, falling back gracefully when crypto is unavailable. */
export function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getLocalAttempts(): LocalAttempt[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as LocalAttempt[]) : []
  } catch {
    return []
  }
}

function sanitizeJson(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' || typeof value === 'symbol' ? undefined : value
  }
  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  if (Array.isArray(value)) return value.map((item) => sanitizeJson(item, seen)).filter((item) => item !== undefined)
  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (key.startsWith('__react')) continue
    const safe = sanitizeJson(item, seen)
    if (safe !== undefined) output[key] = safe
  }
  return output
}

export function addLocalAttempt(attempt: LocalAttempt): void {
  if (typeof window === 'undefined') return
  const attempts = getLocalAttempts()
  const next = attempts.filter(
    (item) => !(item.task_key === attempt.task_key && item.status === 'completed'),
  )
  // Only persist plain JSON data. A React click event can accidentally be passed
  // to a completion handler; never allow DOM/Fiber objects into localStorage.
  const safeAttempt: LocalAttempt = {
    level_number: Number(attempt.level_number),
    task_key: String(attempt.task_key),
    status: String(attempt.status),
    ...(attempt.attempts !== undefined ? { attempts: Number(attempt.attempts) } : {}),
    ...(attempt.choice_correct !== undefined ? { choice_correct: Boolean(attempt.choice_correct) } : {}),
    ...(attempt.metadata && typeof attempt.metadata === 'object' ? { metadata: sanitizeJson(attempt.metadata) as Record<string, unknown> } : {}),
  }
  next.push(safeAttempt)
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next))
}

export function clearActiveSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PARTICIPANT_KEY)
  window.localStorage.removeItem(SESSION_KEY)
  window.localStorage.removeItem(NAME_KEY)
  window.localStorage.removeItem(ATTEMPTS_KEY)
}
