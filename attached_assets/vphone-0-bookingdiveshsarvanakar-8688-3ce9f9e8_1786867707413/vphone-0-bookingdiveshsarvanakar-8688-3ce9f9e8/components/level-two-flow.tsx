'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ImageIcon, Mic, Paperclip, Play, Search, Send, Smartphone, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { recordTaskAttempt } from '@/lib/analytics'
import { pulseSuccess } from '@/lib/feedback'
import { HintPanel } from '@/components/hint-panel'
import { TaskControls } from '@/components/task-controls'
import { useLanguage, taskTitleKey } from '@/lib/i18n'

export type LevelTwoTask = 'whatsapp_text' | 'whatsapp_media' | 'search_hospital'

type Language = 'en' | 'hi' | 'mr'
type Props = { taskKey: LevelTwoTask; language?: Language; onComplete?: () => void }

export function LevelTwoFlow({ taskKey, language = 'en', onComplete }: Props) {
  const { t } = useLanguage()
  const [screen, setScreen] = useState<'home' | 'whatsapp' | 'chat' | 'gallery' | 'browser'>('home')
  const [message, setMessage] = useState('')
  const [sentText, setSentText] = useState(false)
  const [photoSent, setPhotoSent] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [voiceSent, setVoiceSent] = useState(false)
  const [searched, setSearched] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hintCopy: Record<LevelTwoTask, string> = {
    whatsapp_text: t('hintWhatsappText'),
    whatsapp_media: t('hintWhatsappMedia'),
    search_hospital: t('hintSearchHospital'),
  }

  const title = t(taskTitleKey(taskKey))

  const visibilityHandlerRef = useRef<(() => void) | null>(null)

  function clearTimers() {
    if (progressTimer.current) clearInterval(progressTimer.current)
    if (completionTimer.current) clearTimeout(completionTimer.current)
    if (visibilityHandlerRef.current) document.removeEventListener('visibilitychange', visibilityHandlerRef.current)
    progressTimer.current = null
    completionTimer.current = null
    visibilityHandlerRef.current = null
  }

  useEffect(() => () => clearTimers(), [])

  function wrong(messageText: string) {
    setHint(messageText)
    window.setTimeout(() => setHint(null), 2600)
  }

  async function finish() {
    if (completed) return
    setCompleted(true)
    clearTimers()
    await recordTaskAttempt({ levelNumber: 2, taskKey })
    onComplete?.()
  }

  function startRecording() {
    if (taskKey !== 'whatsapp_media' || screen !== 'chat' || !photoSent) return wrong(t('wrongRecordNote'))
    if (recording || completed) return
    clearTimers()
    setRecording(true)
    setRecordingProgress(0)
    const started = Date.now()
    const refreshProgress = () => setRecordingProgress(Math.min(100, ((Date.now() - started) / 2000) * 100))
    const completeRecording = () => {
      clearTimers()
      refreshProgress()
      setRecordingProgress(100)
      setRecording(false)
      setVoiceSent(true)
      pulseSuccess()
      void finish()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshProgress()
    }
    visibilityHandlerRef.current = onVisibilityChange
    document.addEventListener('visibilitychange', onVisibilityChange)
    progressTimer.current = setInterval(() => {
      if (document.visibilityState === 'visible') refreshProgress()
    }, 80)
    completionTimer.current = setTimeout(completeRecording, 2000)
  }

  function stopRecording() {
    clearTimers()
    if (recording && !completed) {
      setRecording(false)
      setVoiceSent(true)
      pulseSuccess()
      void finish()
    }
  }

  function repeatStep() {
    clearTimers()
    setRecording(false)
    setRecordingProgress(0)
    setMessage('')
    setHint(hintCopy[taskKey])
    window.setTimeout(() => setHint(null), 2600)
  }

  function startOver() {
    clearTimers()
    setScreen('home')
    setMessage('')
    setSentText(false)
    setPhotoSent(false)
    setRecording(false)
    setRecordingProgress(0)
    setVoiceSent(false)
    setSearched(false)
    setHint(null)
  }

  return (
    <div className="grid min-h-[620px] gap-6 px-[max(1rem,env(safe-area-inset-left))] pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))] lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6 lg:pb-6 lg:pt-6">
      <section className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <p className="text-base font-bold uppercase tracking-[0.18em] text-primary">{t('level')} 2 · {t('levelTwoSubtitle')}</p>
          <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-xl text-pretty text-xl leading-relaxed text-muted-foreground">{t('taskInstructions')}</p>
          <HintPanel taskKey={taskKey} hints={[hintCopy[taskKey], t('useHighlightedApp'), t('pauseReadInstruction')]} />
        </div>
        <div className="mt-8 rounded-2xl bg-secondary p-5">
          <p className="text-base font-bold text-muted-foreground">{t('guidedHintLabel')}</p>
          <p className="mt-2 text-xl font-semibold leading-relaxed">{hint ?? hintCopy[taskKey]}</p>
          {completed && <p className="mt-3 flex items-center gap-2 text-lg font-bold text-primary"><CheckCircle2 className="size-6" />{t('taskReturning')}</p>}
        </div>
      </section>

      <VirtualPhone2>
        {screen === 'home' && <HomeScreen2 t={t} onWhatsApp={() => { pulseSuccess(); setScreen('whatsapp') }} onBrowser={() => { pulseSuccess(); setScreen('browser') }} wrong={wrong} />}
        {screen === 'whatsapp' && <WhatsAppList t={t} onBack={() => setScreen('home')} onRahul={() => { pulseSuccess(); setScreen('chat') }} />}
        {screen === 'chat' && <RahulChat t={t} message={message} setMessage={setMessage} sentText={sentText} photoSent={photoSent} voiceSent={voiceSent} recording={recording} recordingProgress={recordingProgress} onBack={() => setScreen('whatsapp')} onSendText={() => { if (message.trim() === t('reachedSafelyMessage')) { setSentText(true); pulseSuccess(); if (taskKey === 'whatsapp_text') void finish() } else wrong(t('wrongSendTextNote')) }} onSuggestedSend={() => { setMessage(t('reachedSafelyMessage')); setSentText(true); pulseSuccess(); if (taskKey === 'whatsapp_text') void finish() }} onAttach={() => taskKey === 'whatsapp_media' ? setScreen('gallery') : wrong(t('wrongAttachNote'))} onRecordStart={startRecording} onRecordEnd={stopRecording} />}
        {screen === 'gallery' && <Gallery t={t} onBack={() => setScreen('chat')} onPhoto={() => { setPhotoSent(true); pulseSuccess(); setScreen('chat') }} />}
        {screen === 'browser' && <BrowserSearch t={t} searched={searched} onBack={() => setScreen('home')} onSearch={() => { pulseSuccess(); setSearched(true) }} onResult={() => searched ? (pulseSuccess(), void finish()) : wrong(t('wrongSearchNote'))} taskKey={taskKey} />}
      </VirtualPhone2>

      <TaskControls onRepeat={repeatStep} onStartOver={startOver} />
    </div>
  )
}

function VirtualPhone2({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex h-[600px] w-full max-w-[340px] flex-col overflow-hidden rounded-[2.4rem] border-[10px] border-foreground/90 bg-background shadow-2xl"><div className="flex items-center justify-between bg-foreground px-5 py-2 text-sm font-bold text-background"><span>9:41</span><span className="flex items-center gap-2"><Wifi className="size-3" />100%</span></div><div className="min-h-0 flex-1">{children}</div></div>
}

function HomeScreen2({ onWhatsApp, onBrowser, wrong, t }: { onWhatsApp: () => void; onBrowser: () => void; wrong: (text: string) => void; t: (key: any) => string }) {
  return <div className="flex h-full flex-col bg-secondary p-5"><div className="mb-6"><p className="text-4xl font-extrabold">9:41</p></div><div className="grid grid-cols-3 gap-4">{[
    { key: 'whatsapp', label: 'WhatsApp', icon: 'W', action: onWhatsApp },
    { key: 'browser', label: t('phoneBrowser'), icon: 'G', action: onBrowser },
    { key: 'settings', label: t('phoneSettings'), icon: 'S', action: () => wrong(t('wrongAppNote')) },
  ].map((app) => <button key={app.key} type="button" onClick={app.action} className="flex min-h-[76px] flex-col items-center gap-2 rounded-2xl p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">{app.icon}</span><span className="text-sm font-bold">{app.label}</span></button>)}</div><p className="mt-auto text-center text-sm font-semibold text-muted-foreground">{t('chooseAppToBegin')}</p></div>
}

function WhatsAppList({ onBack, onRahul, t }: { onBack: () => void; onRahul: () => void; t: (key: any) => string }) {
  return <div className="flex h-full flex-col bg-card"><PhoneHeader title="WhatsApp" onBack={onBack} t={t} /><button type="button" onClick={onRahul} className="flex items-center gap-3 border-b border-border p-4 text-left hover:bg-secondary"><span className="grid size-12 place-items-center rounded-full bg-primary font-black text-primary-foreground">R</span><span><strong className="block text-lg">Rahul</strong><span className="text-sm text-muted-foreground">{t('rahulGreeting')}</span></span></button></div>
}

function RahulChat({ message, setMessage, sentText, photoSent, voiceSent, recording, recordingProgress, onBack, onSendText, onSuggestedSend, onAttach, onRecordStart, onRecordEnd, t }: { message: string; setMessage: (value: string) => void; sentText: boolean; photoSent: boolean; voiceSent: boolean; recording: boolean; recordingProgress: number; onBack: () => void; onSendText: () => void; onSuggestedSend: () => void; onAttach: () => void; onRecordStart: () => void; onRecordEnd: () => void; t: (key: any) => string }) {
  return <div className="flex h-full flex-col bg-secondary pb-24"><PhoneHeader title="Rahul" onBack={onBack} t={t} /><div className="flex-1 space-y-3 overflow-y-auto p-4"><div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card p-3 text-base">{t('rahulPrompt')}</div>{sentText && <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary p-3 text-base text-primary-foreground">{t('reachedSafelyMessage')}</div>}{photoSent && <div className="ml-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tr-sm bg-primary p-3 text-base text-primary-foreground"><ImageIcon className="size-5" /> {t('familyPhotoLabel')}</div>}{voiceSent && <div className="ml-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tr-sm bg-primary p-3 text-base text-primary-foreground"><Play className="size-5 fill-current" /> {t('voiceMessageLabel')}</div>}{recording && <div className="ml-auto min-w-40 rounded-2xl bg-destructive p-3 text-base text-destructive-foreground"><div className="mb-2 flex items-center justify-between"><span>{t('recordingLabel')}</span><span>{Math.ceil(recordingProgress / 50)}s</span></div><div className="h-2 overflow-hidden rounded-full bg-destructive-foreground/30"><div className="h-full bg-destructive-foreground transition-[width]" style={{ width: `${recordingProgress}%` }} /></div></div>}</div><div className="border-t border-border bg-card p-3"><button type="button" onClick={onSuggestedSend} className="mb-3 w-full rounded-xl border-2 border-primary/30 bg-primary/10 px-3 py-2 text-left text-sm font-bold text-primary">{t('reachedSafelyMessage')}</button><div className="flex items-center gap-2"><button type="button" onClick={onAttach} aria-label="Attach" className="grid size-12 place-items-center rounded-full p-2 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Paperclip className="size-6" /></button><input aria-label="Message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t('messagePlaceholder')} className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring" /><button type="button" onClick={onSendText} aria-label="Send message" className="grid size-12 place-items-center rounded-full bg-primary p-3 text-primary-foreground"><Send className="size-5" /></button><button type="button" aria-label="Record voice message" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onRecordStart() }} onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); onRecordEnd() }} onPointerCancel={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); onRecordEnd() }} onLostPointerCapture={onRecordEnd} onPointerLeave={onRecordEnd} onPointerCancel={onRecordEnd} className={cn('grid size-12 place-items-center touch-none rounded-full p-3 text-primary', recording && 'bg-destructive text-destructive-foreground')}><Mic className="size-6" /></button></div></div></div>
}

function Gallery({ onBack, onPhoto, t }: { onBack: () => void; onPhoto: () => void; t: (key: any) => string }) {
  const items = [t('familyPhotoLabel'), t('photoGarden'), t('photoLunch'), t('photoHoliday')]
  return <div className="flex h-full flex-col bg-card"><PhoneHeader title={t('choosePhotoLabel')} onBack={onBack} t={t} /><div className="grid grid-cols-2 gap-3 p-4">{items.map((label, index) => <button key={label} type="button" onClick={onPhoto} className="group overflow-hidden rounded-xl border border-border text-left"><div className={cn('grid aspect-square place-items-center text-3xl font-black text-primary-foreground', index % 2 ? 'bg-accent' : 'bg-primary')}>{index + 1}</div><span className="block p-2 text-sm font-bold">{label}</span></button>)}</div></div>
}

function BrowserSearch({ searched, onBack, onSearch, onResult, taskKey, t }: { searched: boolean; onBack: () => void; onSearch: () => void; onResult: () => void; taskKey: LevelTwoTask; t: (key: any) => string }) {
  const results = [t('resultCityHospital'), t('resultSunriseClinic'), t('resultMedicalCentre')]
  return <div className="flex h-full flex-col bg-card"><PhoneHeader title={t('phoneBrowser')} onBack={onBack} t={t} /><div className="space-y-4 p-4"><div className="flex gap-2"><input readOnly value={t('hospitalNearMeQuery')} aria-label="Search query" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-3 text-base font-semibold" /><button type="button" onClick={onSearch} aria-label="Search" className="grid size-12 place-items-center rounded-xl bg-primary p-3 text-primary-foreground"><Search className="size-5" /></button></div><button type="button" onClick={onSearch} className="rounded-full bg-secondary px-3 py-2 text-sm font-bold text-primary">{t('searchHospitalButtonLabel')}</button>{searched && <div className="space-y-3"><p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t('nearbyResultsLabel')}</p>{results.map((result, index) => <button key={result} type="button" onClick={index === 0 ? onResult : () => {}} className="block w-full rounded-xl border border-border p-3 text-left"><strong className="block text-base">{result}</strong><span className="text-sm text-primary">{index === 0 ? t('directionsLabel') : t('viewDetailsLabel')}</span></button>)}</div>}</div></div>
}

function PhoneHeader({ title, onBack, t }: { title: string; onBack: () => void; t: (key: any) => string }) {
  return <div className="flex items-center gap-3 border-b border-border bg-card p-4"><button type="button" onClick={onBack} aria-label="Back" className="grid size-11 place-items-center rounded-lg p-1 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft className="size-6" /></button><Smartphone className="size-5 text-primary" /><strong className="text-lg">{title}</strong></div>
}
