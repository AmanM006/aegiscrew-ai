'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import CommsDelayBanner from '@/components/CommsDelayBanner'
import EmergencySimulator from '@/components/EmergencySimulator'
import CrewMatrix from '@/components/CrewMatrix'
import TelemetryCharts from '@/components/TelemetryCharts'
import FlightSurgeonAI from '@/components/FlightSurgeonAI'
import type { CrewStateResponse } from '@/types/telemetry'
import Link from 'next/link'
import { ArrowLeft, Satellite } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function MissionControlDashboard() {
  const [crewState, setCrewState] = useState<CrewStateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<string>('nominal')
  const [commsMode, setCommsMode] = useState<'ISS' | 'Lunar Gateway' | 'Mars Transit'>('Mars Transit')

  const fetchCrewStatus = async () => {
    try {
      const res = await fetch(`${API}/api/crew/status`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: CrewStateResponse = await res.json()
      setCrewState(data)
      setActiveScenario(data.active_scenario)
      setError(null)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleScenario = async (scenario: string) => {
    try {
      await fetch(`${API}/api/simulator/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      setActiveScenario(scenario)
      await fetchCrewStatus()
    } catch (e) {
      console.error('Scenario switch error', e)
    }
  }

  useEffect(() => {
    fetchCrewStatus()
    const interval = setInterval(fetchCrewStatus, 10_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#040711] font-sans antialiased text-[#E2E8F0]">
      {/* Top Bar with Home Link */}
      <div className="bg-[#080D1A] border-b border-[#141E33] px-6 py-2 flex items-center justify-between text-xs font-mono">
        <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Mission Overview</span>
        </Link>
        <span className="text-slate-500 hidden sm:inline">Artemis II-M Deep Space Transit Flight Surgeon Interface</span>
      </div>

      <Header
        missionDay={crewState?.mission_elapsed_day ?? 142}
        fleetStatus={crewState?.fleet_status ?? 'GREEN'}
        fleetReadiness={crewState?.fleet_readiness ?? 100}
        missionName={crewState?.mission_name ?? 'Artemis Mars Transit'}
      />

      <CommsDelayBanner
        mode={commsMode}
        onModeChange={setCommsMode}
        autonomousMode={crewState?.autonomous_mode ?? true}
      />

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Emergency scenario switcher */}
        <EmergencySimulator
          activeScenario={activeScenario}
          onScenario={handleScenario}
        />

        {/* Loading / Error state */}
        {loading && (
          <div className="flex items-center justify-center h-48 text-sky-400 font-mono text-xs">
            <span className="animate-pulse">⬡ Establishing NASA bio-telemetry uplink...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs font-mono">
            ⚠ Backend connection error: {error}. Ensure FastAPI is running on {API}
          </div>
        )}

        {crewState && (
          <>
            {/* 4-Crew Digital Twin Cards */}
            <CrewMatrix crew={crewState.crew} apiBase={API} />

            {/* 24-hr multi-stream telemetry charts */}
            <TelemetryCharts crew={crewState.crew} />

            {/* IBM Granite AI Flight Surgeon Terminal */}
            <FlightSurgeonAI
              crewState={crewState}
              activeScenario={activeScenario}
              apiBase={API}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141E33] mt-12 py-4 text-center text-[11px] text-slate-500 font-mono">
        AegisCrew AI · IBM Bob AI Builders Challenge (August 2026) · IBM watsonx.ai &amp; Granite 3.0 · NASA-STD-3001
      </footer>
    </div>
  )
}
