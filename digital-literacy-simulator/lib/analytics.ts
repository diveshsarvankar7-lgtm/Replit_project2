'use client'

import { createClient } from '@/lib/supabase/client'
import { addLocalAttempt, getSessionId } from '@/lib/session'

export type TaskAttemptPayload = {
  levelNumber: number
  taskKey: string
  status?: string
  attempts?: number
  choiceCorrect?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Records a completed task attempt. Completely safe to call: it never throws,
 * and silently no-ops when Supabase is not configured or the network fails.
 * This guarantees the guided simulator always continues (and navigates) even
 * when analytics cannot be persisted.
 */
export async function recordTaskAttempt(payload: TaskAttemptPayload): Promise<void> {
  try {
    const supabase = createClient()
    const localAttempt = {
      level_number: payload.levelNumber,
      task_key: payload.taskKey,
      status: payload.status ?? 'completed',
      ...(payload.attempts !== undefined ? { attempts: payload.attempts } : {}),
      ...(payload.choiceCorrect !== undefined ? { choice_correct: payload.choiceCorrect } : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    }
    if (!supabase) {
      addLocalAttempt(localAttempt)
      window.dispatchEvent(new Event('dls:attempt-completed'))
      return
    }
    const sessionId = getSessionId()
    if (!sessionId) {
      addLocalAttempt(localAttempt)
      window.dispatchEvent(new Event('dls:attempt-completed'))
      return
    }
    const insert = supabase.from('task_attempts').insert({
      session_id: sessionId,
      level_number: payload.levelNumber,
      task_key: payload.taskKey,
      status: payload.status ?? 'completed',
      ...(payload.attempts !== undefined ? { attempts: payload.attempts } : {}),
      ...(payload.choiceCorrect !== undefined ? { choice_correct: payload.choiceCorrect } : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    })
    // Analytics must never block task progression on slow Android networks.
    const result = await Promise.race([
      insert,
      new Promise<{ error: Error }>((resolve) => window.setTimeout(() => resolve({ error: new Error('analytics timeout') }), 1200)),
    ])
    if (result.error) throw result.error
    window.dispatchEvent(new Event('dls:attempt-completed'))
  } catch (error) {
    console.log('[v0] recordTaskAttempt skipped:', error)
    addLocalAttempt({
      level_number: payload.levelNumber,
      task_key: payload.taskKey,
      status: payload.status ?? 'completed',
      ...(payload.attempts !== undefined ? { attempts: payload.attempts } : {}),
      ...(payload.choiceCorrect !== undefined ? { choice_correct: payload.choiceCorrect } : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    })
  }
}

/** Safely increments the hint-used counter. Never throws. */
export async function recordHintUsed(taskKey: string): Promise<void> {
  try {
    const supabase = createClient()
    if (!supabase) return
    const sessionId = getSessionId()
    if (!sessionId) return
    await supabase.rpc('increment_hint_used', {
      p_session_id: sessionId,
      p_task_key: taskKey,
    })
  } catch (error) {
    console.log('[v0] recordHintUsed skipped:', error)
  }
}
