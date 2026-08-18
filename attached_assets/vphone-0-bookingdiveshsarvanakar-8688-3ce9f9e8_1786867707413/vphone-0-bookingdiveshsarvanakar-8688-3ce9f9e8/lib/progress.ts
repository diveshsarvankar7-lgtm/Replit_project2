import { LEVELS, type LevelDef } from '@/lib/levels'

export type TaskAttemptRow = {
  level_number: number
  task_key: string
  status: string
}

export type LevelProgress = {
  level: LevelDef
  tasksTotal: number
  tasksCompleted: number
  percent: number
  unlocked: boolean
  completed: boolean
}

/**
 * Compute per-level progress from raw task attempts.
 * A task counts as complete if it has at least one 'completed' attempt.
 * A level unlocks once the previous level is fully complete (Level 1 always unlocked).
 */
export function computeProgress(attempts: TaskAttemptRow[]): LevelProgress[] {
  const completedKeys = new Set(
    attempts.filter((a) => a.status === 'completed').map((a) => a.task_key),
  )

  const result: LevelProgress[] = []
  let previousComplete = true

  for (const level of LEVELS) {
    const tasksTotal = level.tasks.length
    const tasksCompleted = level.tasks.filter((t) =>
      completedKeys.has(t.key),
    ).length
    const percent =
      tasksTotal === 0 ? 0 : Math.round((tasksCompleted / tasksTotal) * 100)
    const completed = tasksCompleted === tasksTotal
    const unlocked = previousComplete

    result.push({
      level,
      tasksTotal,
      tasksCompleted,
      percent,
      unlocked,
      completed,
    })

    previousComplete = completed
  }

  return result
}

/** Find the next incomplete task across all unlocked levels. */
export function findNextTask(
  progress: LevelProgress[],
  attempts: TaskAttemptRow[],
): { levelNumber: number; taskKey: string } | null {
  const completedKeys = new Set(
    attempts.filter((a) => a.status === 'completed').map((a) => a.task_key),
  )

  for (const lp of progress) {
    if (!lp.unlocked) break
    for (const task of lp.level.tasks) {
      if (!completedKeys.has(task.key)) {
        return { levelNumber: lp.level.number, taskKey: task.key }
      }
    }
  }
  return null
}
