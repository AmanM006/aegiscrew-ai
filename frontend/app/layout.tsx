import type { Metadata } from 'next'
import SmoothScroll from '@/components/SmoothScroll'
import './globals.css'

export const metadata: Metadata = {
  title: 'AegisCrew AI — Autonomous Deep-Space Chief Medical Officer',
  description:
    'IBM Granite 4 (granite-4-h-small) powered autonomous flight surgeon for NASA Artemis Mars Transit. ' +
    'Real-time crew bio-telemetry, risk scoring, and clinical countermeasures.',
  keywords: ['NASA', 'IBM watsonx', 'Granite AI', 'spaceflight medicine', 'AegisCrew'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050811] text-[#E5E7EB] antialiased selection:bg-[#00F0FF]/20 selection:text-[#00F0FF]">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  )
}
