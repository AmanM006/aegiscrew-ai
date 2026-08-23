'use client'

import { useEffect, useState } from 'react'

interface Props {
  decisionTimestampMs: number   // Date.now() when the AI made its decision
  commsDelaySeconds: number     // one-way comms delay in seconds
}

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatElapsed(ms: number) {
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}m ${pad2(sec)}s`
}

function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) return 'OVERDUE'
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${pad2(m)}m ${pad2(s)}s`
}

// ─── ISS Panel: replaces the timer entirely when ground link is live ──────────
function HoustonOnlinePanel({ decisionTimestampMs }: { decisionTimestampMs: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  const elapsedMs = now - decisionTimestampMs

  return (
    <div className="px-4 py-3 rounded-lg border space-y-2 text-[10px] font-mono"
      style={{ background: '#071410', borderColor: '#14532D50' }}>
      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"
            style={{ boxShadow: '0 0 6px #4ade80' }} />
          <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
            Houston Flight Surgeon Direct Link: ONLINE
          </span>
        </div>
        <span className="text-slate-600 hidden sm:block">|</span>
        <span className="hidden sm:block text-slate-400">0.0s Speed-of-Light Latency</span>
        <span className="text-slate-600 hidden lg:block">|</span>
        <span className="hidden lg:block text-emerald-500/70 text-[9px] font-semibold uppercase">
          Edge AI on Standby — Ground Has Primary Authority
        </span>
      </div>
      {/* Sub-row */}
      <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-500">
        <span>Real-time telemetry streaming to JSC Mission Control</span>
        <span className="text-slate-700">·</span>
        <span>AI last decision: <span className="text-emerald-400">{formatElapsed(elapsedMs)} ago</span></span>
        <span className="text-slate-700">·</span>
        <span className="text-emerald-600">No autonomous override required</span>
      </div>
    </div>
  )
}

// ─── Lunar panel: brief relay notice ─────────────────────────────────────────
function LunarRelayPanel({
  decisionTimestampMs,
  commsDelaySeconds,
}: {
  decisionTimestampMs: number
  commsDelaySeconds: number
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  const elapsedMs = now - decisionTimestampMs

  return (
    <div className="px-4 py-3 rounded-lg border space-y-2 text-[10px] font-mono"
      style={{ background: '#120E00', borderColor: '#92400E40' }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ background: '#FCD34D', boxShadow: '0 0 6px #FCD34D' }} />
          <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: '#FCD34D' }}>
            Near-Space Relay Active — {commsDelaySeconds.toFixed(1)}s Latency
          </span>
        </div>
        <span className="hidden sm:block text-slate-500">Dual Earth–AI verification mode</span>
      </div>
      <div className="flex flex-wrap gap-4 text-[9px] text-slate-500">
        <span>AI decision: <span style={{ color: '#FCD34D' }}>{formatElapsed(elapsedMs)} ago</span></span>
        <span className="text-slate-700">·</span>
        <span>Earth reply in: <span style={{ color: '#FCD34D' }}>{commsDelaySeconds.toFixed(1)}s</span></span>
        <span className="text-slate-700">·</span>
        <span style={{ color: '#FCD34D80' }}>Ground confirms high-impact interventions</span>
      </div>
    </div>
  )
}

// ─── Mars panel: dual comparative execution timeline ─────────────────────────
function MarsCountdownPanel({
  decisionTimestampMs,
  commsDelaySeconds,
}: {
  decisionTimestampMs: number
  commsDelaySeconds: number
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  const elapsedMs    = now - decisionTimestampMs
  const elapsedSec   = elapsedMs / 1000
  const earthReplyIn = Math.max(0, commsDelaySeconds - elapsedSec)
  const transitProgress = Math.min(1, elapsedSec / commsDelaySeconds)

  return (
    <div className="px-4 py-3 rounded-lg bg-[#050811] border border-[#1A2438] space-y-3 text-[10px] font-mono shadow-2xl">
      {/* Header status row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#141E33] pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Decision Speed Comparison
            </span>
          </div>
          <span className="text-slate-600 hidden sm:block">|</span>
          <span className="text-slate-400 hidden sm:block">Deep Space Habitat (140M miles from Earth)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 font-bold uppercase text-[9px] tracking-wide animate-pulse">
            ⚡ 20.0m Ground Lag — Autonomous AI Active
          </span>
        </div>
      </div>

      {/* Track 1: On-Board AI (Instant Execution) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[9px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span>⚡ On-Board IBM Granite 4 Medical AI</span>
            <span className="text-emerald-500/70 font-normal">(Edge Autonomy)</span>
          </span>
          <span className="text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            ✓ Synthesized in 0.8s · Protocol Deployed
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-[#0E1726] overflow-hidden border border-emerald-500/30">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Track 2: Earth Ground Comms (Speed-of-Light Radio Delay) */}
      <div className="space-y-1 pt-0.5">
        <div className="flex justify-between items-center text-[9px]">
          <span className="text-red-400 font-bold flex items-center gap-1">
            <span>📡 Earth Houston Flight Surgeon</span>
            <span className="text-red-500/70 font-normal">(Speed-of-Light Radio Delay)</span>
          </span>
          <span className="text-red-300 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30 tabular-nums">
            {earthReplyIn > 0 ? `Radio Signal in Transit: ${formatCountdown(earthReplyIn)} remaining` : '✓ Earth Signal Arrived'}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-[#0E1726] overflow-hidden border border-red-500/30">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] transition-none"
            style={{ width: `${transitProgress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] text-slate-500 pt-0.5">
          <span>T+0s: Anomaly Occurred</span>
          <span className="text-slate-400 italic">22-min speed-of-light delay across 140M miles</span>
          <span className="text-red-400 font-semibold">T+20m 00s: Earliest Earth Reply</span>
        </div>
      </div>
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default function DecisionTimer({ decisionTimestampMs, commsDelaySeconds }: Props) {
  if (commsDelaySeconds === 0) {
    return <HoustonOnlinePanel decisionTimestampMs={decisionTimestampMs} />
  }
  if (commsDelaySeconds <= 5) {
    return (
      <LunarRelayPanel
        decisionTimestampMs={decisionTimestampMs}
        commsDelaySeconds={commsDelaySeconds}
      />
    )
  }
  return (
    <MarsCountdownPanel
      decisionTimestampMs={decisionTimestampMs}
      commsDelaySeconds={commsDelaySeconds}
    />
  )
}
