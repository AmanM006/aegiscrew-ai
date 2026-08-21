import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AegisCrew AI — Autonomous Deep-Space Medical Intelligence',
  description:
    'IBM Granite 3.0 powered autonomous flight surgeon for NASA Artemis Mars Transit. ' +
    'Real-time crew bio-telemetry, risk scoring, and clinical countermeasures.',
  keywords: ['NASA', 'IBM watsonx', 'Granite AI', 'spaceflight medicine', 'AegisCrew'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F19] text-[#E5E7EB] antialiased">{children}</body>
    </html>
  )
}
