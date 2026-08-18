'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { recordTaskAttempt } from '@/lib/analytics'
import { pulseSuccess } from '@/lib/feedback'
import { HintPanel } from '@/components/hint-panel'
import { TaskControls } from '@/components/task-controls'
import { useLanguage, taskTitleKey, interpolate } from '@/lib/i18n'
import { VirtualPhone } from '@/components/virtual-phone'

export type LevelThreeTask = 'maps_directions' | 'upi_payment' | 'medicine_reminder'
type Language = 'en' | 'hi' | 'mr'
type Props = { taskKey: LevelThreeTask; language?: Language; onComplete?: () => void }
const button = 'rounded-2xl bg-primary px-5 py-4 font-bold text-primary-foreground'

export function LevelThreeFlow({ taskKey, onComplete }: Props) {
  const { t } = useLanguage()
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState('100')
  const [label, setLabel] = useState<string>(t('takeMedicineDefault'))
  const [daily, setDaily] = useState(true)
  const [notice, setNotice] = useState('')
  const [qr, setQr] = useState('')
  useEffect(() => { if (taskKey !== 'upi_payment') return; void QRCode.toDataURL(`${window.location.origin}/demo-payment?receiver=Local%20Grocery%20Store&amount=100`, { width: 240, margin: 2 }).then(setQr) }, [taskKey])
  function finish() { pulseSuccess(); void recordTaskAttempt({ levelNumber: 3, taskKey }); setNotice(t('taskCompleteLevel4Unlocked')); onComplete?.() }
  function restart() { setStep(0); setNotice(''); setQuery(''); setAmount('100'); setLabel(t('takeMedicineDefault')); setDaily(true) }
  function repeatStep() { setStep((value) => Math.max(0, value - 1)); setNotice('') }
  function next() { pulseSuccess(); setStep((value) => value + 1) }
  const maps = taskKey === 'maps_directions'; const payment = taskKey === 'upi_payment'
  const titles = maps ? [t('stepOpenMaps'), t('stepSearchHospital'), t('stepChooseHospital'), t('stepTapDirections')] : payment ? [t('stepOpenUpi'), t('stepScanQr'), t('stepVerifyReceiver'), t('stepPayConfirm')] : [t('stepOpenReminders'), t('stepAddReminder'), t('stepSetDetails'), t('stepSaveReminder')]
  const hints = maps ? [t('hintMapsType'), t('hintMapsChoose'), t('hintMapsDirections')] : payment ? [t('hintPaymentScan'), t('hintPaymentVerify'), t('hintPaymentConfirm')] : [t('hintReminderAdd'), t('hintReminderKeep'), t('hintReminderRepeat')]
  return <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 pb-28 pt-8 text-foreground md:px-8 md:pb-8"><header className="flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-primary">{t('level')} 3</p><h1 className="text-3xl font-black">{t('levelThreeSubtitle')}</h1></div><button onClick={() => window.history.back()} className="rounded-xl border border-border px-4 py-2 font-bold">{t('exitLabel')}</button></header><section className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><aside className="rounded-3xl border border-border bg-card p-5"><p className="font-bold text-muted-foreground">{t('guidedTaskLabel')}</p><h2 className="mt-2 text-2xl font-black">{titles[Math.min(step,3)]}</h2><p className="mt-3 leading-6 text-muted-foreground">{t('takeActionNote')}</p><HintPanel taskKey={taskKey} hints={hints} /><div className="mt-6 flex flex-wrap gap-2">{titles.map((title,index)=><span key={title} className={`rounded-full px-3 py-1 text-xs font-bold ${index<=step?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground'}`}>{index+1}. {title}</span>)}</div></aside><div className="w-full max-w-sm flex-1"><VirtualPhone screenLabel={titles[Math.min(step,3)]}><div key={step} className="h-full animate-[dls-screen-in_280ms_cubic-bezier(0.22,1,0.36,1)]">{maps?<MapsScreen t={t} step={step} query={query} setQuery={setQuery} onNext={next} onFinish={finish}/>:payment?<PaymentScreen t={t} step={step} amount={amount} setAmount={setAmount} qr={qr} onNext={next} onFinish={finish}/>:<ReminderScreen t={t} step={step} label={label} setLabel={setLabel} daily={daily} setDaily={setDaily} onNext={next} onFinish={finish}/>}</div></VirtualPhone></div></section>{notice&&<p role="status" className="rounded-2xl bg-primary/10 p-4 text-center font-bold text-primary">{notice}</p>}<TaskControls onRepeat={repeatStep} onStartOver={restart} /></main>
}
function MapsScreen({t,step,query,setQuery,onNext,onFinish}:{t:(k:any)=>string;step:number;query:string;setQuery:(v:string)=>void;onNext:()=>void;onFinish:()=>void}){return <div className="flex min-h-[470px] flex-col gap-5"><p className="text-sm font-bold text-muted-foreground">{t('mapsAppLabel')}</p><h2 className="text-2xl font-black">{t('findNearbyCare')}</h2>{step===0&&<button className={button} onClick={onNext}>{t('stepOpenMaps')}</button>}{step===1&&<><label htmlFor="map-search" className="font-bold">{t('searchForPlace')}</label><input id="map-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('hospitalPlaceholder')} className="rounded-2xl border border-border bg-background p-4"/><button className={button} onClick={()=>query.toLowerCase().includes('hospital')&&onNext()}>{t('searchHospitalBtn')}</button></>}{step===2&&<div className="flex flex-col gap-3"><button className="rounded-2xl border-2 border-primary p-4 text-left font-bold" onClick={onNext}>{t('cityHospitalName')} <span className="float-right text-muted-foreground">2.1 km</span></button><button className="rounded-2xl border border-border p-4 text-left" onClick={onNext}>{t('communityHospitalName')} <span className="float-right text-muted-foreground">4.8 km</span></button></div>}{step===3&&<><div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-3xl bg-secondary"><div className="absolute h-1 w-full rotate-12 bg-border"/><div className="absolute h-full w-1 rotate-12 bg-border"/><span className="z-10 rounded-full bg-primary px-4 py-3 font-black text-primary-foreground">{t('pinCityHospital')}</span></div><button className={button} onClick={onFinish}>{t('directionsBtn')}</button></>}{step>3&&<div className="rounded-2xl bg-primary/10 p-6 text-center"><p className="text-4xl font-black">{t('twelveMins')}</p><p className="font-bold text-muted-foreground">{t('byCarToHospital')}</p></div>}</div>}
function PaymentScreen({t,step,amount,setAmount,qr,onNext,onFinish}:{t:(k:any)=>string;step:number;amount:string;setAmount:(v:string)=>void;qr:string;onNext:()=>void;onFinish:()=>void}){return <div className="flex min-h-[470px] flex-col gap-5"><div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 text-center text-sm font-black">{t('upiSimNote')}</div><h2 className="text-2xl font-black">{t('upiPayLabel')}</h2>{step===0&&<button className={button} onClick={onNext}>{t('scanQrBtn')}</button>}{step===1&&<><ScanFrame t={t} qr={qr} /><button className={button} onClick={onNext}>{t('continueBtn')}</button></>}{step===2&&<><p className="rounded-2xl bg-secondary p-5 text-center text-xl font-black">{t('localGroceryStore')}</p><p className="text-sm text-muted-foreground">{t('verifyReceiverNote')}</p><button className={button} onClick={onNext}>{t('nameMatchesBtn')}</button></>}{step===3&&<><label htmlFor="amount" className="font-bold">{t('amountLabel')}</label><input id="amount" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" className="rounded-2xl border border-border bg-background p-4 text-2xl font-black"/><button className={button} onClick={onNext}>{interpolate(t('payAmountBtn'), { amount: amount || '0' })}</button></>}{step===4&&<><p className="rounded-2xl bg-secondary p-5 font-bold">{interpolate(t('reviewPaymentNote'), { amount })}</p><button className={button} onClick={onFinish}>{t('confirmBtn')}</button></>}{step>4&&<div className="rounded-2xl bg-primary/10 p-6 text-center"><p className="text-2xl font-black">{t('paymentSuccessTitle')}</p><p className="mt-3 text-sm font-bold">{t('upiSimNote')}</p></div>}</div>}
function ReminderScreen({t,step,label,setLabel,daily,setDaily,onNext,onFinish}:{t:(k:any)=>string;step:number;label:string;setLabel:(v:string)=>void;daily:boolean;setDaily:(v:boolean)=>void;onNext:()=>void;onFinish:()=>void}){return <div className="flex min-h-[470px] flex-col gap-5"><p className="text-sm font-bold text-muted-foreground">{t('clockRemindersLabel')}</p><h2 className="text-2xl font-black">{t('medicineRemindersTitle')}</h2>{step===0&&<button className={button} onClick={onNext}>{t('openRemindersBtn')}</button>}{step===1&&<button className={button} onClick={onNext}>{t('addReminderBtn')}</button>}{step===2&&<><label className="font-bold">{t('timeLabel')}<input type="time" defaultValue="20:00" className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-2xl font-black"/></label><label className="font-bold">{t('reminderLabelField')}<input id="reminder-label" value={label} onChange={e=>setLabel(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background p-4"/></label><label className="flex items-center justify-between rounded-2xl bg-secondary p-4 font-bold">{t('repeatDailyLabel')}<input type="checkbox" checked={daily} onChange={e=>setDaily(e.target.checked)}/></label><button className={button} onClick={onFinish}>{t('saveBtn')}</button></>}{step>2&&<div className="rounded-2xl bg-secondary p-5"><p className="text-2xl font-black">{interpolate(t('bellLabel'), { label })}</p><p className="mt-2 font-bold text-muted-foreground">{t('everyDay8pm')}</p></div>}</div>}

// Deterministic pseudo-random module pattern so it looks like a real QR code
// (fixed corner "finder" squares + a stable pseudo-random data grid) rather
// than an actual encodable payload - this is a visual practice prop only.
function qrModules(size = 21) {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const finder = (r: number, c: number) => { for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { const border = i === 0 || i === 6 || j === 0 || j === 6; const core = i >= 2 && i <= 4 && j >= 2 && j <= 4; grid[r + i][c + j] = border || core } }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0)
  let seed = 42
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) { const inFinder = (r < 8 && c < 8) || (r < 8 && c > size - 9) || (r > size - 9 && c < 8); if (!inFinder) grid[r][c] = rand() > 0.55 }
  return grid
}

function ScanFrame({ t, qr }: { t: (key: any) => string; qr: string }) {
  const modules = qrModules()
  const size = modules.length
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-56 w-56 overflow-hidden rounded-2xl border-8 border-primary bg-white p-3">
        {qr ? <img src={qr} alt="Scannable demo payment QR code" className="h-full w-full" /> : <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" shapeRendering="crispEdges">
          {modules.map((row, r) => row.map((on, c) => on && <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#111" />))}
        </svg>}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary/80 shadow-[0_0_12px_2px_rgba(0,0,0,0.3)]" style={{ animation: 'qr-scan-sweep 1.6s ease-in-out infinite' }} />
      </div>
      <p className="text-sm font-bold text-muted-foreground">{t('scanFrameHint')}</p>
      <style>{`@keyframes qr-scan-sweep { 0% { top: 0%; } 50% { top: 96%; } 100% { top: 0%; } }`}</style>
    </div>
  )
}
