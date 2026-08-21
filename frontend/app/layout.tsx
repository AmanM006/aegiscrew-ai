import type { Metadata } from 'next'
import { Orbitron, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import SmoothScroll from '@/components/SmoothScroll'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '600', '700', '900'],
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'AegisCrew AI — Autonomous Deep-Space Chief Medical Officer',
  description:
    'IBM Granite 3.0 powered autonomous flight surgeon for NASA Artemis Mars Transit. ' +
    'Real-time crew bio-telemetry, risk scoring, and clinical countermeasures.',
  keywords: ['NASA', 'IBM watsonx', 'Granite AI', 'spaceflight medicine', 'AegisCrew'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${orbitron.variable} ${mono.variable}`}>
      <body className="bg-[#050811] text-[#E5E7EB] antialiased selection:bg-[#00F0FF]/20 selection:text-[#00F0FF]">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  )
}
