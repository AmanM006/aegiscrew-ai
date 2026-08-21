'use client'

import { useState } from 'react'
import type { AstronautStateResponse } from '@/types/telemetry'
import AstronautCard from './AstronautCard'

interface Props {
  crew: AstronautStateResponse[]
  apiBase: string
}

export default function CrewMatrix({ crew, apiBase }: Props) {
  const [prescribing, setPrescribing] = useState<string | null>(null)
  const [prescriptions, setPrescriptions] = useState<Record<string, string>>({})

  const handlePrescribe = async (crewId: string) => {
    setPrescribing(crewId)
    try {
      const res = await fetch(`${apiBase}/api/agent/prescribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew_id: crewId, anomaly_description: 'Current active anomalies' }),
      })
      const data = await res.json()
      setPrescriptions(prev => ({ ...prev, [crewId]: data.prescription }))
    } catch (e) {
      console.error('Prescribe error', e)
    } finally {
      setPrescribing(null)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          Crew Digital Twins — Bio-Telemetry
        </h2>
        <span className="text-xs text-[#6B7280] font-mono">{crew.length} crew active</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {crew.map(astro => (
          <AstronautCard
            key={astro.profile.id}
            astro={astro}
            prescribing={prescribing === astro.profile.id}
            prescriptionText={prescriptions[astro.profile.id]}
            onPrescribe={() => handlePrescribe(astro.profile.id)}
          />
        ))}
      </div>
    </section>
  )
}
