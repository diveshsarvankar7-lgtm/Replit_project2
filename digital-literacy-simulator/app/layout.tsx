import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Nunito, Noto_Sans_Devanagari } from 'next/font/google'
import { GlobalControls } from '@/components/global-controls'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
})

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-devanagari',
})

export const metadata: Metadata = {
  title: 'Digital Literacy Simulator',
  description:
    'A friendly, step-by-step practice space that helps seniors learn to use a smartphone with confidence.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${nunito.variable} ${devanagari.variable} bg-background`}>
      <body className="antialiased">
        {children}
        <GlobalControls />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
