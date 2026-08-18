'use client'

import { useState, type PointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import { recordTaskAttempt } from '@/lib/analytics'
import { pulseSuccess } from '@/lib/feedback'
import { VirtualPhone } from '@/components/virtual-phone'
import { HintPanel } from '@/components/hint-panel'
import { TaskControls } from '@/components/task-controls'
import { useLanguage, taskTitleKey, interpolate } from '@/lib/i18n'

export type LevelOneTask = 'increase_text_size' | 'adjust_brightness' | 'connect_wifi'

export function LevelOneFlow({ taskKey, onComplete }: { taskKey: LevelOneTask; onComplete?: () => void }) {
  const router = useRouter()
  const { t } = useLanguage()
  const [complete, setComplete] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [phoneWifiOn, setPhoneWifiOn] = useState(taskKey !== 'connect_wifi')

  async function finish() {
    if (complete) return
    setComplete(true)
    pulseSuccess()
    void recordTaskAttempt({ levelNumber: 1, taskKey, attempts: attempts + 1 })
    window.setTimeout(() => onComplete?.(), 250)
  }

  function restart() {
    setComplete(false)
    setAttempts(0)
    setResetKey((value) => value + 1)
  }

  const title = t(taskTitleKey(taskKey))
  const hints =
    taskKey === 'increase_text_size'
      ? [t('phoneSettings') + ' \u2192 ' + t('phoneDisplay') + '.', t('textSizeLabel') + ' \u2192 max.']
      : taskKey === 'adjust_brightness'
        ? [t('phoneSettings') + ' \u2192 ' + t('phoneDisplay') + '.', t('brightnessLabel') + '.']
        : [t('phoneSettings') + ' \u2192 ' + t('phoneWifi') + '.', t('phoneWifi') + '.']

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 pb-40 pt-28 md:flex-row md:pb-8 md:pt-8">
      <section className="flex-1 md:max-w-md">
        <button onClick={() => router.back()} className="mb-6 rounded-xl px-2 py-2 font-bold text-muted-foreground">
          ← {t('back')}
        </button>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          {t('level')} 1 · {t('levelOneSubtitle')}
        </p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <p className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 font-semibold">
          {t('taskInstructions')}
        </p>
        <HintPanel taskKey={taskKey} hints={hints} />
        {complete && (
          <p role="status" className="mt-5 rounded-2xl bg-primary/10 p-4 font-bold text-primary">
            {t('taskReturning')}
          </p>
        )}
      </section>
      <div className="w-full max-w-sm flex-1">
        <VirtualPhone screenLabel={title} wifi={phoneWifiOn}>
          <LevelOnePhone key={resetKey} taskKey={taskKey} onComplete={finish} onWrong={() => setAttempts((value) => value + 1)} onWifiChange={setPhoneWifiOn} />
        </VirtualPhone>
      </div>
      <TaskControls onRepeat={restart} onStartOver={restart} />
    </main>
  )
}

function LevelOnePhone({
  taskKey,
  onComplete,
  onWrong,
  onWifiChange,
}: {
  taskKey: LevelOneTask
  onComplete: () => void
  onWrong: () => void
  onWifiChange: (wifi: boolean) => void
}) {
  const { t } = useLanguage()
  const [app, setApp] = useState<'home' | 'settings' | 'display' | 'wifi'>('home')
  const [textSize, setTextSize] = useState(1)
  const [brightness, setBrightness] = useState(70)
  const [wifi, setWifi] = useState(false)
  const [network, setNetwork] = useState('')
  const [dragging, setDragging] = useState<'text' | 'brightness' | null>(null)

  const setSliderFromPointer = (event: PointerEvent<HTMLDivElement>, kind: 'text' | 'brightness') => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    if (kind === 'text') {
      const next = Math.round(1 + ratio * 2)
      setTextSize(next)
      if (taskKey === 'increase_text_size' && next >= 3) onComplete()
    } else {
      const next = Math.round(10 + ratio * 90)
      setBrightness(next)
      if (taskKey === 'adjust_brightness' && Math.abs(next - 70) > 20) onComplete()
    }
  }

  const adjustSliderWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>, kind: 'text' | 'brightness') => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (kind === 'text') {
      const next = event.key === 'Home' ? 1 : event.key === 'End' ? 3 : Math.max(1, Math.min(3, textSize + (event.key === 'ArrowRight' ? 1 : -1)))
      setTextSize(next)
      if (taskKey === 'increase_text_size' && next >= 3) onComplete()
    } else {
      const next = event.key === 'Home' ? 10 : event.key === 'End' ? 100 : Math.max(10, Math.min(100, brightness + (event.key === 'ArrowRight' ? 10 : -10)))
      setBrightness(next)
      if (taskKey === 'adjust_brightness' && Math.abs(next - 70) > 20) onComplete()
    }
  }

  if (app === 'home')
    return (
      <Frame title={t('phoneHome')}>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { pulseSuccess(); setApp('settings') }} className="rounded-2xl bg-secondary p-5 font-bold transition-transform active:scale-95">
            {t('phoneSettings')}
          </button>
          <button onClick={onWrong} className="rounded-2xl bg-secondary p-5 font-bold transition-transform active:scale-95">
            {t('phoneCameraApp')}
          </button>
        </div>
      </Frame>
    )

  if (app === 'settings')
    return (
      <Frame title={t('phoneSettings')} back={() => setApp('home')}>
        <button
          onClick={() => { pulseSuccess(); taskKey === 'connect_wifi' ? setApp('wifi') : setApp('display') }}
          className="w-full rounded-2xl bg-secondary p-5 text-left font-bold transition-transform active:scale-[.98]"
        >
          {taskKey === 'connect_wifi' ? t('phoneWifi') : t('phoneDisplay')}
        </button>
      </Frame>
    )

  if (app === 'wifi')
    return (
      <Frame title={t('phoneWifi')} back={() => setApp('settings')}>
        <div className="flex items-center justify-between rounded-2xl bg-secondary p-4 font-bold">
          <span>{t('phoneWifi')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={wifi}
            onClick={() => setWifi((value) => { onWifiChange(!value); return !value })}
            className={`relative h-8 w-14 rounded-full p-1 transition-colors ${wifi ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`block h-6 w-6 rounded-full bg-background shadow transition-transform ${wifi ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        {wifi && (
          <div className="mt-4 flex flex-col gap-3">
            <button onClick={() => setNetwork('Community-Center-WiFi')} className="rounded-2xl border border-border p-4 text-left font-bold">
              Community-Center-WiFi
            </button>
            <button onClick={() => setNetwork('Library-Guest')} className="rounded-2xl border border-border p-4 text-left">
              Library-Guest
            </button>
            {network && (
              <button onClick={() => onComplete()} className="rounded-2xl bg-primary p-4 font-bold text-primary-foreground">
                {interpolate(t('connectToNetwork'), { network })}
              </button>
            )}
          </div>
        )}
      </Frame>
    )

  return (
    <Frame title={t('phoneDisplay')} back={() => setApp('settings')}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold">{t('textSizeLabel')}</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{textSize}/3</span>
          </div>
          <div
            role="slider"
            aria-label={t('textSizeLabel')}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={textSize}
            tabIndex={0}
            onKeyDown={(event) => adjustSliderWithKeyboard(event, 'text')}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging('text'); setSliderFromPointer(event, 'text') }}
            onPointerMove={(event) => { if (dragging === 'text') setSliderFromPointer(event, 'text') }}
            onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setDragging(null) }} onPointerCancel={() => setDragging(null)} onLostPointerCapture={() => setDragging(null)}
            className="relative h-8 touch-none cursor-grab rounded-full bg-muted active:cursor-grabbing"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${((textSize - 1) / 2) * 100}%` }} />
            <span className="absolute top-1 h-6 w-6 rounded-full border-2 border-primary bg-background shadow" style={{ left: `calc(${((textSize - 1) / 2) * 100}% - 12px)` }} />
          </div>
        </div>
        <p style={{ fontSize: `${1 + textSize * 0.35}rem` }} className="rounded-2xl bg-secondary p-4 font-bold">
          {t('sampleTextChanges')}
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold">{t('brightnessLabel')}</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{brightness}%</span>
          </div>
          <div
            role="slider"
            aria-label={t('brightnessLabel')}
            aria-valuemin={10}
            aria-valuemax={100}
            aria-valuenow={brightness}
            tabIndex={0}
            onKeyDown={(event) => adjustSliderWithKeyboard(event, 'brightness')}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging('brightness'); setSliderFromPointer(event, 'brightness') }}
            onPointerMove={(event) => { if (dragging === 'brightness') setSliderFromPointer(event, 'brightness') }}
            onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setDragging(null) }} onPointerCancel={() => setDragging(null)} onLostPointerCapture={() => setDragging(null)}
            className="relative h-8 touch-none cursor-grab rounded-full bg-muted active:cursor-grabbing"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${((brightness - 10) / 90) * 100}%` }} />
            <span className="absolute top-1 h-6 w-6 rounded-full border-2 border-primary bg-background shadow" style={{ left: `calc(${((brightness - 10) / 90) * 100}% - 12px)` }} />
          </div>
        </div>
        <div style={{ opacity: brightness / 100 }} className="rounded-2xl bg-primary p-5 text-center font-bold text-primary-foreground">
          {t('brightnessPreview')}
        </div>
      </div>
    </Frame>
  )
}

function Frame({ title, back, children }: { title: string; back?: () => void; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-[520px] flex-col bg-card p-5 text-foreground">
      <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
        {back ? <button onClick={back} className="font-bold text-primary">{t('back')}</button> : <span />}
        <h2 className="font-black">{title}</h2>
        <span className="w-10" />
      </header>
      <div>{children}</div>
    </div>
  )
}
