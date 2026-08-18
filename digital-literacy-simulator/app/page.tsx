import { ActionButton } from '@/components/action-button'
import { PhoneHomeScreen } from '@/components/phone-home-screen'
import { VirtualPhone } from '@/components/virtual-phone'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center gap-12 px-6 py-12 md:flex-row md:gap-16">
      <div className="max-w-md text-center md:text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-base font-bold text-secondary-foreground">
          <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />
          Learn at your own pace
        </span>

        <h1 className="mt-6 text-balance text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
          Digital Literacy Simulator
        </h1>

        <p className="mt-5 text-pretty text-xl leading-relaxed text-muted-foreground">
          A friendly, step-by-step practice space that helps you learn to use a
          smartphone with confidence.
        </p>

        <div className="mt-10 flex justify-center md:justify-start">
          <ActionButton asChild size="lg">
            <Link href="/intake">
              Start
              <ArrowRight className="h-6 w-6" aria-hidden="true" />
            </Link>
          </ActionButton>
        </div>
      </div>

      <div className="w-full max-w-[300px] md:max-w-[340px]">
        <div className="scale-90 md:scale-100">
          <VirtualPhone screenLabel="Example phone home screen">
            <PhoneHomeScreen />
          </VirtualPhone>
        </div>
      </div>
    </main>
  )
}
