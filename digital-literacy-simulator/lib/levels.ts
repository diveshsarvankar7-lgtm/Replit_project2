// Central definition of the four training levels and their tasks.

export type TaskDef = {
  key: string
  title: string
  description: string
}

export type LevelDef = {
  number: number
  title: string
  subtitle: string
  tasks: TaskDef[]
}

export const LEVELS: LevelDef[] = [
  {
    number: 1,
    title: 'Getting Comfortable',
    subtitle: 'The basics of holding and adjusting your phone',
    tasks: [
      {
        key: 'increase_text_size',
        title: 'Make the text bigger',
        description: 'Open Settings and increase the font size.',
      },
      {
        key: 'adjust_brightness',
        title: 'Adjust the brightness',
        description: 'Make the screen easier to see.',
      },
      {
        key: 'connect_wifi',
        title: 'Connect to Wi-Fi',
        description: 'Join a wireless network.',
      },
    ],
  },
  {
    number: 2,
    title: 'Communication & Internet',
    subtitle: 'Message loved ones and find helpful information online',
    tasks: [
      {
        key: 'whatsapp_text',
        title: 'Send a WhatsApp message',
        description: 'Open Rahul\'s chat and send “I reached safely”.',
      },
      {
        key: 'whatsapp_media',
        title: 'Send a photo and voice message',
        description: 'Share a family photo and record a voice note.',
      },
      {
        key: 'search_hospital',
        title: 'Find information on the internet',
        description: 'Search for “hospital near me” and choose the right result.',
      },
    ],
  },
  {
    number: 3,
    title: 'Digital Services & Independence',
    subtitle: 'Use maps, payments, and reminders with confidence',
    tasks: [
      {
        key: 'maps_directions',
        title: 'Find a hospital using Maps',
        description: 'Search nearby hospitals and get directions.',
      },
      {
        key: 'upi_payment',
        title: 'Scan a QR code and make a demo payment',
        description: 'Practice a safe simulated payment with no real money.',
      },
      {
        key: 'medicine_reminder',
        title: 'Set a medicine reminder',
        description: 'Create a daily reminder to take medicine.',
      },
    ],
  },
  {
    number: 4,
    title: 'Safety & Problem Solving',
    subtitle: 'Make safe choices and respond confidently in difficult moments',
    tasks: [
      {
        key: 'identify_fake_sms',
        title: 'Identify a fake SMS',
        description: 'Spot the suspicious message and choose the safe response.',
      },
      {
        key: 'otp_scam',
        title: 'Recognize an OTP scam',
        description: 'Protect your one-time password from a caller.',
      },
      {
        key: 'emergency_scenario',
        title: 'Respond to an emergency',
        description: 'Call your emergency contact and share your location quickly.',
      },
    ],
  },
]

export function getLevel(levelNumber: number): LevelDef | undefined {
  return LEVELS.find((l) => l.number === levelNumber)
}

export const TOTAL_LEVELS = LEVELS.length
