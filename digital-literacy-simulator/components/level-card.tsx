import type { LevelProgress } from '@/lib/progress'
import { cn } from '@/lib/utils'
import { CheckCircle2, Lock } from 'lucide-react'

export function LevelCard({ progress }: { progress: LevelProgress }) {
  const { level, tasksCompleted, tasksTotal, percent, unlocked, completed } =
    progress

  return (
    <div
      className={cn(
        'rounded-3xl border-2 bg-card p-6 transition-colors',
        completed
          ? 'border-success/50'
          : unlocked
            ? 'border-border'
            : 'border-border bg-muted/40',
      )}
      aria-label={`Level ${level.number}: ${level.title}. ${
        unlocked ? `${percent} percent complete` : 'Locked'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold',
              completed
                ? 'bg-success text-success-foreground'
                : unlocked
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {completed ? (
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            ) : unlocked ? (
              level.number
            ) : (
              <Lock className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <div>
            <h3 className="text-2xl font-extrabold leading-tight text-foreground">
              {level.title}
            </h3>
            <p className="mt-1 text-base font-medium text-muted-foreground">
              {level.subtitle}
            </p>
          </div>
        </div>

        {unlocked && (
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-base font-bold text-secondary-foreground">
            {tasksCompleted}/{tasksTotal}
          </span>
        )}
      </div>

      {unlocked ? (
        <div className="mt-5">
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                completed ? 'bg-success' : 'bg-primary',
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-base font-semibold text-muted-foreground">
            {completed ? 'Completed' : `${percent}% complete`}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-base font-semibold text-muted-foreground">
          Finish the level above to unlock this one.
        </p>
      )}
    </div>
  )
}
