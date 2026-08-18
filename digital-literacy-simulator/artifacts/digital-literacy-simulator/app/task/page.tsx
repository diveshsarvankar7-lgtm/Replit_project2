import { Suspense } from 'react'
import TaskPageContent from './task-page-content'

export default function TaskPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center px-6">
          <p className="text-xl font-semibold text-muted-foreground">Loading task…</p>
        </main>
      }
    >
      <TaskPageContent />
    </Suspense>
  )
}
