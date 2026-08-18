'use client'

import { useEffect, useState } from 'react'
import type { Language } from '@/lib/i18n'

import {
  Camera,
  Clock,
  Compass,
  type LucideIcon,
  Map,
  MessageCircle,
  MessageSquare,
  Phone,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'

type AppTile = {
  key: string
  label: string
  Icon: LucideIcon
  /** Tailwind classes for the icon tile background. */
  tile: string
}

// Common apps used throughout the practice activities.
const APPS: AppTile[] = [
  { key: 'settings', label: 'Settings', Icon: Settings, tile: 'bg-slate-500' },
  { key: 'contacts', label: 'Contacts', Icon: Users, tile: 'bg-amber-500' },
  { key: 'phone', label: 'Phone', Icon: Phone, tile: 'bg-green-600' },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, tile: 'bg-emerald-500' },
  { key: 'camera', label: 'Camera', Icon: Camera, tile: 'bg-neutral-700' },
  { key: 'maps', label: 'Maps', Icon: Map, tile: 'bg-teal-600' },
  { key: 'upi', label: 'UPI Pay', Icon: Wallet, tile: 'bg-indigo-600' },
  { key: 'messages', label: 'Messages', Icon: MessageSquare, tile: 'bg-sky-500' },
  { key: 'clock', label: 'Reminders', Icon: Clock, tile: 'bg-rose-500' },
  { key: 'browser', label: 'Browser', Icon: Compass, tile: 'bg-blue-600' },
]

const PHONE_LABELS: Record<Language, Record<string, string>> = {
  en: { settings: 'Settings', contacts: 'Contacts', phone: 'Phone', whatsapp: 'WhatsApp', camera: 'Camera', maps: 'Maps', upi: 'UPI Pay', messages: 'Messages', clock: 'Reminders', browser: 'Browser' },
  hi: { settings: 'सेटिंग्स', contacts: 'कॉन्टैक्ट्स', phone: 'फोन', whatsapp: 'WhatsApp', camera: 'कैमरा', maps: 'मैप्स', upi: 'UPI Pay', messages: 'संदेश', clock: 'रिमाइंडर', browser: 'ब्राउज़र' },
  mr: { settings: 'सेटिंग्ज', contacts: 'कॉन्टॅक्ट्स', phone: 'फोन', whatsapp: 'WhatsApp', camera: 'कॅमेरा', maps: 'मॅप्स', upi: 'UPI Pay', messages: 'संदेश', clock: 'रिमाइंडर', browser: 'ब्राउझर' },
}

function getPhoneLabels(language: Language) { return PHONE_LABELS[language] }
function getPhoneLabel(key: string, language: Language) { return PHONE_LABELS[language][key] ?? key }

interface PhoneHomeScreenProps {
  onOpenApp?: (key: string) => void
  openApp?: string | null
  taskKey?: string
  language?: Language
  onCloseApp?: () => void
}

export function PhoneHomeScreen({
  onOpenApp,
  openApp,
  taskKey,
  language = 'en',
  onCloseApp,
}: PhoneHomeScreenProps) {
  const [clock, setClock] = useState({ time: '', date: '' })

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setClock({
        time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        date: now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
      })
    }

    updateClock()
    const interval = window.setInterval(updateClock, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  if (openApp) {
    return <PhoneAppScreen appKey={openApp} taskKey={taskKey} language={language} onClose={onCloseApp} />
  }

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-sky-100 to-indigo-100 px-5 pb-6 pt-4">
      {/* Date / clock header */}
      <header className="mb-6 mt-2 text-center text-slate-800">
        <p className="text-5xl font-extrabold tracking-tight">
          {clock.time || '—'}
        </p>
        <p className="mt-1 text-base font-semibold text-slate-600">{clock.date || 'Loading date'}</p>
      </header>

      {/* App grid */}
      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        {APPS.map(({ key, Icon, tile }) => { const label = getPhoneLabel(key, language); return (
          <button
            key={key}
            type="button"
            onClick={() => onOpenApp?.(key)}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tile} shadow-md`}
            >
              <Icon className="h-7 w-7 text-white" strokeWidth={2.25} />
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {label}
            </span>
          </button>
        )})}
      </div>

      <div className="flex-1" />

      {/* Dock */}
      <div className="mt-6 flex items-center justify-around rounded-3xl bg-white/50 px-4 py-3 backdrop-blur">
        {[APPS[2], APPS[3], APPS[4], APPS[9]].map(({ key, Icon, tile }) => { const label = getPhoneLabel(key, language); return (
          <button
            key={`dock-${key}`}
            type="button"
            onClick={() => onOpenApp?.(key)}
            aria-label={label}
            className="focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 rounded-2xl"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tile} shadow-md`}
            >
              <Icon className="h-7 w-7 text-white" strokeWidth={2.25} />
            </span>
          </button>
        )})}
      </div>
    </div>
  )
}

function PhoneAppScreen({
  appKey,
  taskKey,
  language,
  onClose,
}: {
  appKey: string
  taskKey?: string
  language: Language
  onClose?: () => void
}) {
  const labels = getPhoneLabels(language)
  const taskHint: Record<string, string> = language === 'hi'
    ? { increase_text_size: 'डिस्प्ले और टेक्स्ट आकार', adjust_brightness: 'ब्राइटनेस', connect_wifi: 'Wi-Fi', add_contact: 'नया कॉन्टैक्ट जोड़ें', make_call: 'कॉन्टैक्ट और हाल की कॉल', send_whatsapp: 'चैट और नया संदेश', take_photo: 'कैमरा व्यूफाइंडर', set_reminder: 'नया रिमाइंडर', search_browser: 'वेब पर खोजें', upi_payment: 'सुरक्षित रूप से पैसे भेजें', share_location: 'अपना स्थान साझा करें' }
    : language === 'mr'
      ? { increase_text_size: 'डिस्प्ले आणि मजकूर आकार', adjust_brightness: 'ब्राइटनेस', connect_wifi: 'Wi-Fi', add_contact: 'नवीन कॉन्टॅक्ट जोडा', make_call: 'कॉन्टॅक्ट आणि अलीकडील कॉल', send_whatsapp: 'चॅट आणि नवीन संदेश', take_photo: 'कॅमेरा व्ह्यूफाइंडर', set_reminder: 'नवीन रिमाइंडर', search_browser: 'वेबवर शोधा', upi_payment: 'सुरक्षितपणे पैसे पाठवा', share_location: 'तुमचे लोकेशन शेअर करा' }
      : { increase_text_size: 'Display & Text Size', adjust_brightness: 'Brightness', connect_wifi: 'Wi-Fi', add_contact: 'Add a new contact', make_call: 'Contacts and recent calls', send_whatsapp: 'Chats and new message', take_photo: 'Camera viewfinder', set_reminder: 'New reminder', search_browser: 'Search the web', upi_payment: 'Send money securely', share_location: 'Share your location' }
  return (
    <div className="flex min-h-full flex-col bg-card p-5 text-foreground">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{language === 'hi' ? 'वापस' : language === 'mr' ? 'परत' : 'Back'}</button>
        <p className="font-bold">{labels[appKey] ?? (language === 'hi' ? 'ऐप' : language === 'mr' ? 'अॅप' : 'App')}</p><span className="w-10" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="rounded-2xl bg-secondary px-6 py-5"><p className="text-lg font-extrabold">{language === 'hi' ? 'अभ्यास स्क्रीन' : language === 'mr' ? 'सराव स्क्रीन' : 'Practice screen'}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{taskHint[taskKey ?? ''] ?? (language === 'hi' ? 'बाईं ओर दिए चरणों का पालन करें।' : language === 'mr' ? 'डावीकडील पायऱ्यांचे अनुसरण करा.' : 'Follow the steps on the left.')}</p></div>
        <button type="button" onClick={onClose} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">{language === 'hi' ? 'देखना पूरा करें' : language === 'mr' ? 'पाहणे पूर्ण करा' : 'Done exploring'}</button>
      </div>
    </div>
  )
}


