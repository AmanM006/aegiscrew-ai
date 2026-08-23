'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import CommsDelayBanner from '@/components/CommsDelayBanner'
import EmergencySimulator from '@/components/EmergencySimulator'
import CrewMatrix from '@/components/CrewMatrix'
import TelemetryCharts from '@/components/TelemetryCharts'
import FlightSurgeonAI from '@/components/FlightSurgeonAI'
import SystemAlertBanner from '@/components/SystemAlertBanner'
import type { CrewStateResponse } from '@/types/telemetry'

const API = process.env.NEXT_PUBLIC_API_URL || ''

export default function MissionControlPage() {
  const [crewState, setCrewState] = useState<CrewStateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<string>('nominal')
  const [commsMode, setCommsMode] = useState<'ISS' | 'Lunar Gateway' | 'Mars Transit'>('Mars Transit')

  // Map comms preset label → seconds so DecisionTimer and the latency banner stay in sync.
  const COMMS_DELAY_MAP: Record<string, number> = { 'ISS': 0, 'Lunar Gateway': 1.3, 'Mars Transit': 1200 }
  const commsDelaySeconds = COMMS_DELAY_MAP[commsMode] ?? 1200

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
    const interval = setInterval(fetchCrewStatus, 10_000)   // poll every 10 s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black font-sans text-slate-100">
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

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-8">
        {/* Emergency scenario pill-switcher */}
        <EmergencySimulator
          activeScenario={activeScenario}
          onScenario={handleScenario}
        />

        {/* Loading / error state */}
        {loading && (
          <div className="flex items-center justify-center h-48 text-[#00F0FF] font-mono text-sm">
            <span className="animate-pulse">⬡ Establishing bio-telemetry uplink...</span>
          </div>
        )}

        {error && !loading && (
          <div className="mission-card border-[#EF4444] text-[#EF4444] text-sm font-mono">
            ⚠ Backend connection error: {error}.
            Ensure the FastAPI server is running on {API}
          </div>
        )}

        {crewState && (
          <>
            {/* Cross-crew systems alert — only shown when fleet-wide pattern detected */}
            {crewState.crew_wide_alert && (
              <SystemAlertBanner alert={crewState.crew_wide_alert} />
            )}

            {/* 4-crew digital twin cards */}
            <CrewMatrix crew={crewState.crew} apiBase={API} />

            {/* 24-hr multi-stream telemetry charts */}
            <TelemetryCharts crew={crewState.crew} />

            {/* IBM Granite AI Flight Surgeon terminal */}
            <FlightSurgeonAI
              crewState={crewState}
              activeScenario={activeScenario}
              apiBase={API}
              commsDelaySeconds={commsDelaySeconds}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F2D45] mt-12 py-4 text-center text-xs text-[#6B7280]">
        AegisCrew AI · IBM Bob AI Builders Challenge 2026 · Powered by IBM watsonx.ai &amp; Granite 4
        · NASA-STD-3001 · NASA SP-2010-3407
      </footer>
    </div>
  )
}
