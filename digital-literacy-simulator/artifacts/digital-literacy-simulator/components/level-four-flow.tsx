'use client'

import { useEffect, useRef, useState } from 'react'
import { recordTaskAttempt } from '@/lib/analytics'
import { pulseSuccess } from '@/lib/feedback'
import { HintPanel } from '@/components/hint-panel'
import { TaskControls } from '@/components/task-controls'
import { VirtualPhone } from '@/components/virtual-phone'
import { useLanguage, interpolate } from '@/lib/i18n'

export type LevelFourTask = 'identify_fake_sms' | 'otp_scam' | 'emergency_scenario'

type Language = 'en' | 'hi' | 'mr'
type Props = { taskKey: LevelFourTask; language?: Language; participantName?: string; onComplete?: () => void }

const buttonClass = 'w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-left font-semibold transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function LevelFourFlow({ taskKey, participantName = 'Participant', onComplete }: Props) {
  const { t } = useLanguage()
  const [step, setStep] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState('')
  const startedAtRef = useState(() => Date.now())[0]
  const [completed, setCompleted] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const finish = async (correct = true) => {
    if (completed) return
    setCompleted(true)
    pulseSuccess()
    // Save in the background: completion must never wait on mobile analytics/network.
    void recordTaskAttempt({
      levelNumber: 4,
      taskKey,
      choiceCorrect: correct,
      attempts: attempts + 1,
      metadata: taskKey === 'emergency_scenario' ? { elapsed_seconds: Math.round((Date.now() - startedAtRef) / 1000) } : {},
    })
    window.setTimeout(() => onComplete?.(), 250)
  }

  const wrong = (text: string) => { setAttempts((value) => value + 1); setMessage(text) }
  const restart = () => { setStep(0); setMessage(''); setCompleted(false); setResetKey((value) => value + 1) }

  if (taskKey === 'identify_fake_sms') return <Shell key={resetKey} taskKey={taskKey} title={t('safetyCheckTitle')} instruction={t('smsInstruction')} message={message} onRepeat={() => { setStep(0); setMessage('') }} onStartOver={restart}>
    {step === 0 ? <>
      <article className="rounded-2xl bg-secondary p-4"><p className="font-bold">{t('messageALabel')}</p><p className="mt-2">{t('messageAContent')}</p></article>
      <article className="rounded-2xl bg-destructive/10 p-4"><p className="font-bold">{t('messageBLabel')}</p><p className="mt-2">{t('messageBContent')}</p></article>
      <button className={buttonClass} onClick={() => setStep(1)}>{t('messageALabel')}</button><button className={buttonClass} onClick={() => setStep(2)}>{t('messageBLabel')}</button>
    </> : step === 1 ? <><p className="rounded-xl bg-secondary p-4">{t('smsExplanation')}</p><button className={buttonClass} onClick={() => setStep(0)}>{t('tryAgainBtn')}</button></> : <><p className="rounded-xl bg-secondary p-4">{t('whatShouldYouDo')}</p><button className={buttonClass} onClick={() => wrong(t('wrongClickLink'))}>{t('clickLinkBtn')}</button><button className={buttonClass} onClick={() => finish()}>{t('safeSmsChoiceBtn')}</button></>}
  </Shell>

  if (taskKey === 'otp_scam') return <Shell key={resetKey} taskKey={taskKey} title={t('incomingCallTitle')} instruction={t('otpInstruction')} message={message} onRepeat={() => setMessage('')} onStartOver={restart}>
    <div className="rounded-2xl bg-secondary p-4"><p className="font-bold">{t('bankSupportCalling')}</p><p className="mt-2">{t('otpTranscript')}</p></div>
    {[t('otpOptionTellOtp'), t('otpOptionSendPin'), t('otpOptionDecline'), t('otpOptionClickLink')].map((option, index) => <button key={option} className={buttonClass} onClick={() => index === 2 ? finish() : wrong(t('otpWrongMessage'))}>{option}</button>)}
  </Shell>

  return <EmergencyFlow finish={finish} message={message} onWrong={wrong} resetKey={resetKey} onStartOver={restart} />
}

function EmergencyFlow({ finish, message, onWrong, resetKey, onStartOver }: { finish: () => void; message: string; onWrong: (text: string) => void; resetKey: number; onStartOver: () => void }) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const startedAtRef = useRef(Date.now())
  useEffect(() => {
    let id: number | null = null
    const refresh = () => {
      setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }
    const start = () => {
      refresh()
      if (id === null && document.visibilityState === 'visible') id = window.setInterval(refresh, 1000)
    }
    const stop = () => {
      if (id !== null) window.clearInterval(id)
      id = null
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }
    start()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
  const advance = (next: number) => { pulseSuccess(); setPhase(next) }
  const instruction = phase === 0 ? t('callEmergencyContact') : phase < 2 ? t('letCallEnd') : phase === 2 ? t('openLocationShareSheetInstr') : t('selectContactConfirmInstr')
  return <Shell key={resetKey} taskKey="emergency_scenario" title={interpolate(t('emergencyHelpTitle'), { seconds: String(seconds) })} instruction={instruction} message={message} onRepeat={() => setPhase((value) => Math.max(0, value - 1))} onStartOver={onStartOver}>
    {phase === 0 ? (
      <>
        <button className={`${buttonClass} border-primary`} onClick={() => advance(1)}>{t('emergencyContactLabel')}</button>
        <button className={buttonClass} onClick={() => onWrong(t('wrongEmergencyContact'))}>{t('unknownNumberBtn')}</button>
      </>
    ) : phase === 1 ? (
      <>
        <div className="rounded-2xl bg-secondary p-5 text-center"><p className="text-lg font-bold">{t('simulatedCallText')}</p><p className="mt-2 text-muted-foreground">{t('callConnectedText')}</p></div>
        <button className="w-full rounded-xl bg-destructive px-4 py-4 font-bold text-destructive-foreground" onClick={() => advance(2)}>{t('endCallBtn')}</button>
      </>
    ) : phase === 2 ? (
      <>
        <button className={buttonClass} onClick={() => advance(3)}>{t('openLocationShareBtn')}</button>
        <button className={buttonClass} onClick={() => onWrong(t('wrongOpenLocationFirst'))}>{t('openCameraBtn')}</button>
      </>
    ) : phase === 3 ? (
      <>
        <p className="rounded-2xl bg-secondary p-5 text-center font-bold">{t('shareLocationVia')}</p>
        <button className={buttonClass} onClick={() => advance(4)}>{t('emergencyContactLabel')}</button>
      </>
    ) : phase === 4 ? (
      <>
        <p className="rounded-2xl bg-secondary p-5 text-center font-bold">{t('emergencyContactSelected')}</p>
        <button className={buttonClass} onClick={finish}>{t('confirmSendBtn')}</button>
      </>
    ) : (
      <p role="status" className="rounded-2xl bg-primary/10 p-5 text-center font-bold text-primary">{t('locationSharedText')}</p>
    )}
  </Shell>
}

function Shell({ taskKey, title, instruction, message, children, onRepeat, onStartOver }: { taskKey: LevelFourTask; title: string; instruction: string; message: string; children: React.ReactNode; onRepeat?: () => void; onStartOver?: () => void }) {
  const { t } = useLanguage()
  const hints = taskKey === 'identify_fake_sms' ? [t('hintSms1'), t('hintSms2')] : taskKey === 'otp_scam' ? [t('hintOtp1'), t('hintOtp2')] : [t('hintEmergency1'), t('hintEmergency2')]
  const phoneAppLabel = taskKey === 'identify_fake_sms' ? t('appMessagesLabel') : t('appPhoneLabel')
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 pb-40 pt-28 md:flex-row md:pb-8 md:pt-8">
      <section className="flex-1 md:max-w-md">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">{t('level')} 4</p>
        <h1 className="mt-2 text-4xl font-black text-balance">{title}</h1>
        <p className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 font-semibold">{instruction}</p>
        {message && <p role="status" className="mt-4 rounded-xl bg-secondary p-3 text-sm">{message}</p>}
        <HintPanel taskKey={taskKey} hints={hints} />
      </section>
      <div className="w-full max-w-sm flex-1">
        <VirtualPhone screenLabel={title}>
          <div className="flex h-full flex-col bg-card">
            <div className="border-b border-border p-4 text-center"><strong className="text-lg">{phoneAppLabel}</strong></div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>
          </div>
        </VirtualPhone>
      </div>
      <TaskControls onRepeat={onRepeat} onStartOver={onStartOver} />
    </main>
  )
}
