'use client'

import { ActionButton } from '@/components/action-button'
import { HintPanel } from '@/components/hint-panel'
import { PhoneHomeScreen } from '@/components/phone-home-screen'
import { VirtualPhone } from '@/components/virtual-phone'
import { TaskControls } from '@/components/task-controls'
import { recordTaskAttempt } from '@/lib/analytics'
import { pulseSuccess } from '@/lib/feedback'
import { useLanguage } from '@/lib/i18n'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface TaskFlowProps {
  levelNumber: number
  taskKey: string
  taskTitle: string
  taskDescription: string
  onComplete: () => void
  onBack: () => void
}

export function TaskFlow({
  levelNumber,
  taskKey,
  taskTitle,
  taskDescription,
  onComplete,
  onBack,
}: TaskFlowProps) {
  const { language, t } = useLanguage()
  const [completed, setCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedStep, setExpandedStep] = useState(0)
  const [openApp, setOpenApp] = useState<string | null>(null)

  async function handleTaskComplete() {
    setSubmitting(true)
    pulseSuccess()
    // Safe: never throws, no-ops offline.
    void recordTaskAttempt({ levelNumber, taskKey, status: 'completed' })
    setCompleted(true)
    window.setTimeout(() => {
      onComplete()
    }, 250)
  }

  function restart() {
    setCompleted(false)
    setSubmitting(false)
    setExpandedStep(0)
    setOpenApp(null)
  }

  const steps = getTaskSteps(taskKey, language)
  const taskMeta = getTaskMeta(taskKey, language, taskTitle, taskDescription)

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 px-3 pb-24 pt-4 sm:px-5 sm:pt-6 md:flex-row md:gap-12 md:px-6 md:pb-8 md:pt-8">
      {/* Left: Instructions */}
      <div className="order-2 flex-1 md:order-1 md:max-w-md">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl py-2 pr-3 text-lg font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          ← {t('back')}
        </button>

        <div className="mb-8">
          <span className="text-sm font-bold text-primary">{t('level')} {levelNumber}</span>
          <h1 className="mt-2 text-4xl font-extrabold text-foreground">
            {taskMeta.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {taskMeta.description}
          </p>
        </div>

        {completed ? (
          <div className="rounded-3xl border-2 border-success/30 bg-success/5 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
              <p className="text-lg font-bold text-success">{t('taskComplete')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <HintPanel taskKey={taskKey} hints={getTaskHints(taskKey, language)} />
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedStep(expandedStep === idx ? -1 : idx)}
                className="w-full rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground">{step.title}</p>
                  {expandedStep === idx ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                {expandedStep === idx && (
                  <p className="mt-3 text-muted-foreground">{step.detail}</p>
                )}
              </button>
            ))}

            <ActionButton
              onClick={handleTaskComplete}
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t('saved') : t('done')}
            </ActionButton>
          </div>
        )}
      </div>

      {/* Right: Virtual Phone */}
      <div className="order-1 flex flex-1 justify-center md:order-2 md:mt-0">
        <div className="w-full max-w-sm">
          <VirtualPhone screenLabel={taskMeta.title}>
            <PhoneHomeScreen
              language={language}
              onOpenApp={(key) => setOpenApp(key)}
              openApp={openApp}
              taskKey={taskKey}
              onCloseApp={() => setOpenApp(null)}
            />
          </VirtualPhone>
        </div>
      </div>

      <TaskControls onRepeat={() => setExpandedStep(0)} onStartOver={restart} />
    </main>
  )
}

type TaskMeta = { title: string; description: string }
type Language = import('@/lib/i18n').Language

function getTaskMeta(taskKey: string, language: Language, fallbackTitle: string, fallbackDescription: string): TaskMeta {
  const meta: Record<string, Record<Language, TaskMeta>> = {
    increase_text_size: {
      en: { title: 'Make the text bigger', description: 'Use the controls on the practice phone to make text easier to read.' },
      hi: { title: 'टेक्स्ट बड़ा करें', description: 'अभ्यास फोन के नियंत्रणों का उपयोग करके टेक्स्ट को पढ़ने में आसान बनाएँ।' },
      mr: { title: 'मजकूर मोठा करा', description: 'मजकूर वाचणे सोपे करण्यासाठी सराव फोनवरील नियंत्रणे वापरा.' },
    },
    adjust_brightness: {
      en: { title: 'Adjust the brightness', description: 'Change the screen brightness using the controls on the practice phone.' },
      hi: { title: 'ब्राइटनेस बदलें', description: 'अभ्यास फोन के नियंत्रणों से स्क्रीन की ब्राइटनेस बदलें।' },
      mr: { title: 'ब्राइटनेस बदला', description: 'सराव फोनवरील नियंत्रणांमधून स्क्रीनची ब्राइटनेस बदला.' },
    },
    connect_wifi: {
      en: { title: 'Connect to Wi-Fi', description: 'Choose a familiar Wi-Fi network on the practice phone.' },
      hi: { title: 'Wi-Fi से जुड़ें', description: 'अभ्यास फोन पर किसी पहचाने हुए Wi-Fi नेटवर्क को चुनें।' },
      mr: { title: 'Wi-Fi ला जोडा', description: 'सराव फोनवर ओळखीचे Wi-Fi नेटवर्क निवडा.' },
    },
    add_contact: {
      en: { title: 'Add a contact', description: 'Create a new contact and save the person’s name and number.' },
      hi: { title: 'कॉन्टैक्ट जोड़ें', description: 'नया कॉन्टैक्ट बनाएँ और व्यक्ति का नाम व नंबर सेव करें।' },
      mr: { title: 'कॉन्टॅक्ट जोडा', description: 'नवीन कॉन्टॅक्ट तयार करून व्यक्तीचे नाव आणि नंबर सेव्ह करा.' },
    },
    make_call: {
      en: { title: 'Make a phone call', description: 'Find a saved contact and start a phone call.' },
      hi: { title: 'फोन कॉल करें', description: 'सेव किए गए कॉन्टैक्ट को खोजकर फोन कॉल शुरू करें।' },
      mr: { title: 'फोन कॉल करा', description: 'सेव्ह केलेला कॉन्टॅक्ट शोधू��� फोन कॉल सुरू करा.' },
    },
    send_whatsapp: {
      en: { title: 'Send a WhatsApp message', description: 'Open a chat, write a message, and send it safely.' },
      hi: { title: 'WhatsApp संदेश भेजें', description: 'चैट खोलें, संदेश लिखें और सुरक्षित रूप से भेजें।' },
      mr: { title: 'WhatsApp संदेश पाठवा', description: 'चॅट उघडा, संदेश लिहा आणि सुरक्षितपणे पाठवा.' },
    },
    take_photo: {
      en: { title: 'Take a photo', description: 'Use the practice camera to frame and take a clear photo.' },
      hi: { title: 'फोटो लें', description: 'अभ्यास कैमरा से सही फ्रेम बनाकर साफ फोटो लें।' },
      mr: { title: 'फोटो घ्या', description: 'सराव कॅमेऱ्याने योग्य चौकट करून स्पष्ट फोटो घ्या.' },
    },
    set_reminder: {
      en: { title: 'Set a reminder', description: 'Create a reminder with a message, date, and time.' },
      hi: { title: 'रिमाइंडर सेट करें', description: 'संदेश, तारीख और समय के साथ रिमाइंडर बनाएँ।' },
      mr: { title: 'रिमाइंडर सेट करा', description: 'संदेश, तारीख आणि वेळासह रिमाइंडर तयार करा.' },
    },
    search_browser: {
      en: { title: 'Search the internet', description: 'Use the browser search bar to find useful information.' },
      hi: { title: 'इंटरनेट पर खोजें', description: 'उपयोगी जानकारी खोजने के लिए ब्राउज़र सर्च बार का उपयोग करें।' },
      mr: { title: 'इंटरनेटवर शोधा', description: 'उपयुक्त माहिती शोधण्यासाठी ब्राउझरचा सर्च बार वापरा.' },
    },
    upi_payment: {
      en: { title: 'Make a UPI payment', description: 'Practice entering a recipient and amount before confirming a payment.' },
      hi: { title: 'UPI भुगतान करें', description: 'भुगतान की पुष्टि से पहले प्राप्तकर्ता और राशि भरने का अभ्यास करें।' },
      mr: { title: 'UPI पेमेंट करा', description: 'पेमेंटची पुष्टी करण्यापूर्वी प्राप्तकर्ता आणि रक्कम भरण्याचा सराव करा.' },
    },
    spot_scam: {
      en: { title: 'Spot a scam', description: 'Learn to notice warning signs in suspicious messages.' },
      hi: { title: 'धोखाधड़ी पहचानें', description: 'संदिग्ध संदेशों में चेतावनी के संकेत पहचानना सीखें।' },
      mr: { title: 'फसवणूक ओळखा', description: 'संशयास्पद संदेशांमधील धोक्याची चिन्हे ओळखायला शिका.' },
    },
    share_location: {
      en: { title: 'Share your location', description: 'Practice sharing your location with a trusted contact.' },
      hi: { title: 'अपना स्थान साझा करें', description: 'किसी भरोसेमंद कॉन्टैक्ट के साथ अपना स्थान साझा करने का अभ्यास करें।' },
      mr: { title: 'तुमचे लोकेशन शेअर करा', description: 'विश्वासू कॉन्टॅक्टसोबत तुमचे लोकेशन शेअर करण्याचा सराव करा.' },
    },
  }
  return meta[taskKey]?.[language] ?? meta[taskKey]?.en ?? { title: fallbackTitle, description: fallbackDescription }
}


function getTaskHints(taskKey: string, language: import('@/lib/i18n').Language) {
  const hints: Record<string, Record<string, string[]>> = {
    increase_text_size: { en: ['Open Settings first.', 'Look for Display or Font Size.', 'Move the text-size slider to the right.'], hi: ['पहले सेटिंग्स खोलें।', 'डिस्प्ले या फ़ॉन्ट आकार खोजें।', 'टेक्स्ट स्लाइडर को दाईं ओर करें।'], mr: ['प्रथम सेटिंग्ज उघडा.', 'डिस्प्ले किंवा फॉन्ट आकार शोधा.', 'मजकूर स्लायडर उजवीकडे करा.'] },
    adjust_brightness: { en: ['Open Settings.', 'Choose Display or Brightness.', 'Move the brightness slider slowly.'], hi: ['सेटिंग्स खोलें।', 'डिस्प्ले या ब्राइटनेस चुनें।', 'ब्राइटनेस स्लाइडर धीरे चलाएँ।'], mr: ['सेटिंग्ज उघडा.', 'डिस्प्ले किंवा ब्राइटनेस निवडा.', 'ब्राइटनेस स्लायडर हळू हलवा.'] },
    connect_wifi: { en: ['Open Settings.', 'Choose Wi-Fi.', 'Select the network name you recognise.'], hi: ['सेटिंग्स खोलें।', 'Wi-Fi चुनें।', 'पहचाने हुए नेटवर्क का नाम चुनें।'], mr: ['सेटिंग्ज उघडा.', 'Wi-Fi निवडा.', 'ओळखीचे नेटवर्क निवडा.'] },
  }
  return hints[taskKey]?.[language] ?? hints[taskKey]?.en ?? ({ en: ['Read the first step carefully.', 'Look for the named app on the phone home screen.', 'Tap only the control described in the instruction.'], hi: ['पहला चरण ध्यान से पढ़ें।', 'होम स्क्रीन पर बताए गए ऐप को खोजें।', 'निर्देश में बताए नियंत्रण को ही दबाएँ।'], mr: ['पहिली पायरी काळजीपूर्वक वाचा.', 'होम स्क्रीनवर सांगितलेले अॅप शोधा.', 'सूचनेतील नियंत्रणच दाबा.'] }[language])
}

function getTaskSteps(taskKey: string, language: import('@/lib/i18n').Language) {
  const stepMap: Record<string, { title: string; detail: string }[]> = {
    increase_text_size: [
      {
        title: 'Open Settings',
        detail:
          'Find and tap the Settings app on your home screen. It looks like a grey gear icon.',
      },
      {
        title: 'Find Display Settings',
        detail:
          'Scroll down and look for "Display" or "Font Size". Tap it to open.',
      },
      {
        title: 'Increase Font Size',
        detail: 'Drag the slider to the right to make text bigger. See it change in real time.',
      },
    ],
    adjust_brightness: [
      {
        title: 'Open Settings',
        detail: 'Tap the Settings app (grey gear icon) from your home screen.',
      },
      {
        title: 'Find Display Settings',
        detail: 'Scroll to "Display" or "Brightness". Tap to open.',
      },
      {
        title: 'Adjust Brightness',
        detail:
          'Find the brightness slider and drag it left to dim, or right to brighten. Your eyes will thank you!',
      },
    ],
    connect_wifi: [
      {
        title: 'Open Settings',
        detail: 'Tap the Settings app on your home screen.',
      },
      {
        title: 'Find Wi-Fi',
        detail: 'Look for "Wi-Fi" in the settings menu and tap it.',
      },
      {
        title: 'Select Your Network',
        detail:
          'Tap the name of your Wi-Fi network from the list. If you need a password, ask someone for help.',
      },
    ],
    add_contact: [
      {
        title: 'Open Contacts',
        detail: 'Tap the Contacts app on your home screen. It looks like a person icon.',
      },
      {
        title: 'Tap Add Contact',
        detail: 'Look for a plus (+) button to add a new contact.',
      },
      {
        title: 'Enter Information',
        detail:
          'Type the person&apos;s name and phone number. Save when you&apos;re done.',
      },
    ],
    make_call: [
      {
        title: 'Open Phone App',
        detail: 'Tap the Phone app on your home screen. It looks like a telephone.',
      },
      {
        title: 'Find Your Contact',
        detail:
          'Go to Contacts tab at the bottom and find the person you want to call.',
      },
      {
        title: 'Tap to Call',
        detail:
          'Tap the green call button next to their name. The call will start right away.',
      },
    ],
    send_whatsapp: [
      {
        title: 'Open WhatsApp',
        detail: 'Tap the WhatsApp app on your home screen. It has a green chat bubble.',
      },
      {
        title: 'Find a Contact',
        detail:
          'Go to Chats and tap the plus (+) button to start a new message.',
      },
      {
        title: 'Type and Send',
        detail:
          'Type your message in the text box at the bottom. Tap the send button (arrow) when ready.',
      },
    ],
    take_photo: [
      {
        title: 'Open Camera',
        detail: 'Tap the Camera app on your home screen. It looks like a camera lens.',
      },
      {
        title: 'Frame Your Shot',
        detail: 'Point the phone at what you want to photograph. See it on the screen.',
      },
      {
        title: 'Take the Picture',
        detail: 'Tap the large white circle at the bottom of the screen. You&apos;ll hear a click sound.',
      },
    ],
    set_reminder: [
      {
        title: 'Open Reminders',
        detail: 'Tap the Reminders (or Clock) app on your home screen.',
      },
      {
        title: 'Create New Reminder',
        detail: 'Look for a plus (+) button or "New Reminder" option.',
      },
      {
        title: 'Set Time and Message',
        detail:
          'Type what you want to be reminded about and set the date and time. Save it.',
      },
    ],
    search_browser: [
      {
        title: 'Open Browser',
        detail: 'Tap the Browser app on your home screen (usually a compass icon).',
      },
      {
        title: 'Tap Search Bar',
        detail: 'Tap the search bar at the top of the screen.',
      },
      {
        title: 'Type Your Question',
        detail:
          'Type what you want to find out. Tap the search button. Results will appear.',
      },
    ],
    upi_payment: [
      {
        title: 'Open UPI App',
        detail: 'Tap the UPI Pay app on your home screen.',
      },
      {
        title: 'Enter Recipient',
        detail:
          'Enter the phone number or UPI ID of the person you want to pay.',
      },
      {
        title: 'Enter Amount and Confirm',
        detail:
          'Type the amount. Review everything. Enter your UPI PIN to complete the payment.',
      },
    ],
    spot_scam: [
      {
        title: 'Watch for Red Flags',
        detail:
          'Be suspicious of messages from unknown numbers asking for money or personal information.',
      },
      {
        title: 'Check the Source',
        detail:
          'Banks and apps will not ask for passwords or PIN codes in messages. Ever.',
      },
      {
        title: 'When in Doubt, Ask',
        detail:
          'If a message seems odd, ask a family member before responding or clicking anything.',
      },
    ],
    share_location: [
      {
        title: 'Open Maps or Messaging',
        detail: 'Use Maps app or open a message conversation.',
      },
      {
        title: 'Find Location Sharing',
        detail: 'Look for a location or pin icon to share where you are.',
      },
      {
        title: 'Select Contact and Share',
        detail:
          'Choose who to share with and for how long. They will see your location on a map.',
      },
    ],
  }

  const localized: Record<string, Record<'hi' | 'mr', { title: string; detail: string }[]>> = {
    increase_text_size: { hi: [{ title: 'सेटिंग्स खोलें', detail: 'होम स्क्रीन पर सेटिंग्स ऐप खोजें।' }, { title: 'डिस्प्ले खोजें', detail: 'डिस्प्ले या फ़ॉन्ट आकार चुनें।' }, { title: 'टेक्स्ट बड़ा करें', detail: 'स्लाइडर को दाईं ओर खिसकाएँ।' }], mr: [{ title: 'सेटिंग्ज उघडा', detail: 'होम स्क्रीनवर सेटिंग्ज अॅप शोधा.' }, { title: 'डिस्प्ले शोधा', detail: 'डिस्प्ले किंवा फॉन्ट आकार निवडा.' }, { title: 'मजकूर मोठा करा', detail: 'स्लायडर उजवीकडे सरकवा.' }] },
    adjust_brightness: { hi: [{ title: 'सेटिंग्स खोलें', detail: 'होम स्क्रीन से सेटिंग्स ऐप खोलें।' }, { title: 'डिस्प्ले सेटिंग्स खोजें', detail: 'डिस्प्ले या ब्राइटनेस पर जाएँ।' }, { title: 'ब्राइटनेस बदलें', detail: 'ब्राइटनेस स्लाइडर को बाएँ या दाएँ खिसकाएँ।' }], mr: [{ title: 'सेटिंग्ज उघडा', detail: 'होम स्क्रीनवरून सेटिंग्ज अॅप उघडा.' }, { title: 'डिस्प्ले सेटिंग्ज शोधा', detail: 'डिस्प्ले किंवा ब्राइटनेसवर जा.' }, { title: 'ब्राइटनेस बदला', detail: 'ब्राइटनेस स्लायडर डावीकडे किंवा उजवीकडे हलवा.' }] },
    connect_wifi: { hi: [{ title: 'सेटिंग्स खोलें', detail: 'होम स्क्रीन पर सेटिंग्स ऐप खोलें।' }, { title: 'Wi-Fi खोजें', detail: 'सेटिंग्स में Wi-Fi चुनें।' }, { title: 'नेटवर्क चुनें', detail: 'सूची में अपने Wi-Fi नेटवर्क का नाम चुनें।' }], mr: [{ title: 'सेटिंग्ज उघडा', detail: 'होम स्क्रीनवर सेटिंग्ज अॅप उघडा.' }, { title: 'Wi-Fi शोधा', detail: 'सेटिंग्जमध्ये Wi-Fi निवडा.' }, { title: 'नेटवर्क निवडा', detail: 'यादीतील तुमचे Wi-Fi नेटवर्क निवडा.' }] },
    add_contact: { hi: [{ title: 'कॉन्टैक्ट्स खोलें', detail: 'होम स्क्रीन पर कॉन्टैक्ट्स ऐप खोलें।' }, { title: 'कॉन्टैक्ट जोड़ें दबाएँ', detail: 'नया कॉन्टैक्ट जोड़ने के लिए प्लस बटन दबाएँ।' }, { title: 'जानकारी भरें', detail: 'नाम और फोन नंबर लिखकर सेव करें।' }], mr: [{ title: 'कॉन्टॅक्ट्स उघडा', detail: 'होम स्क्रीनवर कॉन्टॅक्ट्स अॅप उघड���.' }, { title: 'कॉन्टॅक्ट जोडा', detail: 'नवीन कॉन्टॅक्टसाठी प्लस बटण दाबा.' }, { title: 'माहिती भरा', detail: 'नाव आणि फोन नंबर लिहून सेव्ह करा.' }] },
    make_call: { hi: [{ title: 'फोन ऐप खोलें', detail: 'होम स्क्रीन पर फोन ऐप खोलें।' }, { title: 'कॉन्टैक्ट खोजें', detail: 'कॉन्टैक्ट्स टैब में व्यक्ति का नाम खोजें।' }, { title: 'कॉल करने के लिए दबाएँ', detail: 'नाम के पास हरे कॉल बटन को दबाएँ।' }], mr: [{ title: 'फोन अॅप उघडा', detail: 'होम स्क्रीनवर फोन अॅप उघडा.' }, { title: 'कॉन्टॅक्ट शोधा', detail: 'कॉन्टॅक्ट्स टॅबमध्ये व्यक्तीचे नाव शोधा.' }, { title: 'कॉल करण्यासाठी दाबा', detail: 'नावाजवळील हिरवे कॉल बटण दाबा.' }] },
    send_whatsapp: { hi: [{ title: 'WhatsApp खोलें', detail: 'होम स्क्रीन पर WhatsApp ऐप खोलें।' }, { title: 'कॉन्टैक्ट खोजें', detail: 'चैट में नया संदेश शुरू करने के लिए प्लस दबाएँ।' }, { title: 'लिखकर भेजें', detail: 'संदेश लिखें और भेजने वाला तीर दबाएँ।' }], mr: [{ title: 'WhatsApp उघडा', detail: 'होम स्क्रीनवर WhatsApp अॅप उघडा.' }, { title: 'कॉन्टॅक्ट शोधा', detail: 'नवीन संदेशासाठी चॅटमध्ये प्लस दाबा.' }, { title: 'लिहून पाठवा', detail: 'संदेश लिहा आणि पाठवण्याचे बाण दाबा.' }] },
    take_photo: { hi: [{ title: 'कैमरा ख��लें', detail: 'होम स्क्रीन पर कैमरा ऐप खोलें।' }, { title: 'फोटो तैयार करें', detail: 'फोन को उस चीज़ की ओर करें जिसका फोटो लेना है।' }, { title: 'फोटो लें', detail: 'स्क्रीन के नीचे बड़ा सफेद गोला दबाएँ।' }], mr: [{ title: 'कॅमेरा उघडा', detail: 'होम स्क्रीनवर कॅमेरा अॅप उघडा.' }, { title: 'फोटोची चौकट ठरवा', detail: 'ज्याचा फोटो घ्यायचा आहे त्याकडे फोन करा.' }, { title: 'फोटो घ्या', detail: 'स्क्रीनच्या खालील मोठे पांढरे वर्तुळ दाबा.' }] },
    set_reminder: { hi: [{ title: 'रिमाइंडर खोलें', detail: 'होम स्क्रीन पर रिमाइंडर या क्लॉक ऐप खोलें।' }, { title: 'नया रिमाइंडर बनाएँ', detail: 'प्लस या नया रिमाइंडर विकल्प चुनें।' }, { title: 'समय और संदेश रखें', detail: 'संदेश, तारीख और समय लिखकर सेव करें।' }], mr: [{ title: 'रिमाइंडर उघडा', detail: 'होम स्क्रीनवर रिमाइंडर किंवा क्लॉक अॅप उघडा.' }, { title: 'नवीन रिमाइंडर तयार करा', detail: 'प्लस किंवा नवीन रिमाइंडर पर्याय निवडा.' }, { title: 'वेळ आणि संदेश ठेवा', detail: 'संदेश, तारीख आणि वेळ लिहून सेव्ह करा.' }] },
    search_browser: { hi: [{ title: 'ब्राउज़र खोलें', detail: 'होम स्क्रीन पर ब्राउज़र ऐप खोलें।' }, { title: 'सर्च बार दबाएँ', detail: 'स्क्रीन के ऊपर सर्च बार दबाएँ।' }, { title: 'अपना सवाल लिखें', detail: 'सवाल लिखकर सर्च बटन दबाएँ।' }], mr: [{ title: 'ब्राउझर उघडा', detail: 'होम स्क्रीनवर ब्राउझर अॅप उघडा.' }, { title: 'सर्च बार दाबा', detail: 'स्क्रीनच्या वरचा सर्च बार दाबा.' }, { title: 'प्रश्न लिहा', detail: 'प्रश्न लिहून सर्च बटण दाबा.' }] },
    upi_payment: { hi: [{ title: 'UPI ऐप खोलें', detail: 'होम स्क्रीन पर UPI Pay ऐप खोलें।' }, { title: 'प्राप्तकर्ता भरें', detail: 'व्यक्ति का फोन नंबर या UPI ID लिखें।' }, { title: 'राशि और पुष्टि करें', detail: 'राशि लिखें, जाँचें और UPI PIN डालें।' }], mr: [{ title: 'UPI अॅप उघडा', detail: 'होम स्क्रीनवर UPI Pay अॅप उघडा.' }, { title: 'प्राप्तकर्ता भरा', detail: 'व्यक्तीचा फोन नंबर किंवा UPI ID लिहा.' }, { title: 'रक्कम आणि पुष्टी करा', detail: 'रक्कम लिहा, तपासा आणि UPI PIN द्या.' }] },
    spot_scam: { hi: [{ title: 'खतरे के संकेत देखें', detail: 'पैसे या निजी जानकारी माँगने वाले अनजान संदेशों से सावधान रहें।' }, { title: 'स्रोत जाँचें', detail: 'बैंक और ऐप संदेश में पासवर्ड या PIN नहीं माँगते।' }, { title: 'संदेह हो तो पूछें', detail: 'जवाब देने से पहले परिवार के सदस्य से पूछें।' }], mr: [{ title: 'धोक्याची चिन्हे पहा', detail: 'पैसे किंवा वैयक्तिक माहिती मागणाऱ्या अनोळखी संदेशांपासून सावध रहा.' }, { title: 'स्रोत तपासा', detail: 'बँक आणि अॅप संदेशातून पासवर्ड किंवा PIN मागत नाहीत.' }, { title: 'शंका असल्यास विचारा', detail: 'उत्तर देण्यापूर्वी कुटुंबातील व्यक्तीला विचारा.' }] },
    share_location: { hi: [{ title: 'मैप या मैसेजिंग खोलें', detail: 'मैप ऐप या कोई मैसेज बातचीत खोलें।' }, { title: 'लोकेशन शेयरिंग खोजें', detail: 'लोकेशन या पिन आइकन खोजें।' }, { title: 'कॉन्टैक्ट चुनकर शेयर करें', detail: 'किसे और कितने समय के लिए शेयर करना है चुने���।' }], mr: [{ title: 'मॅप्स किंवा मेसेजिंग उघडा', detail: 'मॅप्स अॅप किंवा संदेश संभाषण उघडा.' }, { title: 'लोकेशन श��अरिंग शोधा', detail: 'लोकेशन किंवा पिन चिन्ह शोधा.' }, { title: 'कॉन्टॅक्ट निवडून शेअर करा', detail: 'कोणाला आणि किती वेळ शेअर करायचे ते निवडा.' }] },
  }
  return language === 'en' ? stepMap[taskKey] ?? [] : localized[taskKey]?.[language] ?? stepMap[taskKey] ?? []
}

function getTaskScreen(taskKey: string) {
  // For now, show the home screen. In a real app, this would show task-specific screens.
  // The task is guided by the left-side instructions, and the user confirms when done.
  return (
    <PhoneHomeScreen
      onOpenApp={(key) => {
        console.log('[v0] user opened app:', key)
      }}
    />
  )
}
