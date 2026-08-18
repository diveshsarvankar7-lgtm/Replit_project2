'use client'

import { TaskFlow } from '@/components/task-flow'
import { LevelOneFlow, type LevelOneTask } from '@/components/level-one-flow'
import { LevelTwoFlow, type LevelTwoTask } from '@/components/level-two-flow'
import { LevelThreeFlow, type LevelThreeTask } from '@/components/level-three-flow'
import { LevelFourFlow, type LevelFourTask } from '@/components/level-four-flow'
import { getLevel, LEVELS } from '@/lib/levels'
import { taskTitleKey, useLanguage } from '@/lib/i18n'
import { useRouter, useSearchParams } from 'next/navigation'

function getNextAssessmentTask(levelNumber: number, currentKey: string) {
  const currentLevelIndex = LEVELS.findIndex((item) => item.number === levelNumber)
  const currentLevel = LEVELS[currentLevelIndex]
  const currentTaskIndex = currentLevel?.tasks.findIndex((item) => item.key === currentKey) ?? -1
  if (currentLevel && currentTaskIndex >= 0 && currentTaskIndex < currentLevel.tasks.length - 1) {
    return { levelNumber, task: currentLevel.tasks[currentTaskIndex + 1], levelComplete: false }
  }
  const nextLevel = LEVELS[currentLevelIndex + 1]
  if (nextLevel) return { levelNumber: nextLevel.number, task: nextLevel.tasks[0], levelComplete: true }
  return { levelNumber: null, task: null, levelComplete: true }
}

export default function TaskPageContent() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  const levelNumber = Number(searchParams.get('level'))
  const taskKey = searchParams.get('task') ?? ''
  const level = getLevel(levelNumber)
  const task = level?.tasks.find((item) => item.key === taskKey)
  const next = level ? getNextAssessmentTask(level.number, taskKey) : null
  const continueAfterComplete = () => {
    if (next?.task && next.levelNumber) {
       router.replace(`/task?level=${next.levelNumber}&task=${next.task.key}`)
    } else {
      router.replace('/task/complete')
    }
  }

  if (!level || !task) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">{t('taskError')}</h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground"
          >
            Return to dashboard
          </button>
        </div>
      </main>
    )
  }

  if (level.number === 1 && ['increase_text_size', 'adjust_brightness', 'connect_wifi'].includes(task.key)) {
    return <LevelOneFlow taskKey={task.key as LevelOneTask} onComplete={continueAfterComplete} />
  }

  if (level.number === 2 && ['whatsapp_text', 'whatsapp_media', 'search_hospital'].includes(task.key)) {
    return <LevelTwoFlow taskKey={task.key as LevelTwoTask} language={language} onComplete={continueAfterComplete} />
  }

  if (level.number === 3 && ['maps_directions', 'upi_payment', 'medicine_reminder'].includes(task.key)) {
    return <LevelThreeFlow taskKey={task.key as LevelThreeTask} language={language} onComplete={continueAfterComplete} />
  }

  if (level.number === 4 && ['identify_fake_sms', 'otp_scam', 'emergency_scenario'].includes(task.key)) {
    return <LevelFourFlow taskKey={task.key as LevelFourTask} language={language} onComplete={continueAfterComplete} />
  }

  return (
    <TaskFlow
      levelNumber={level.number}
      taskKey={task.key}
      taskTitle={t(taskTitleKey(task.key))}
      taskDescription={t('taskInstructions')}
      onBack={() => router.back()}
      onComplete={continueAfterComplete}
    />
  )
}
