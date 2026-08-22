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

// ─── Mars panel: full animated countdown ─────────────────────────────────────
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
  const progress     = Math.min(1, elapsedSec / commsDelaySeconds)

  const barColor = progress < 0.5
    ? '#10B981'   // emerald — early
    : progress < 0.85
    ? '#F59E0B'   // amber — midway
    : '#EF4444'   // red — near/past

  return (
    <div className="px-4 py-3 rounded-lg bg-[#080D1A] border border-[#1A2438] space-y-2.5 text-[10px] font-mono">
      {/* ── Text row ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-slate-400">AI Decision:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            {formatElapsed(elapsedMs)} ago
          </span>
        </div>

        <span className="text-slate-700 hidden sm:block">|</span>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-slate-400">Earth Reply In:</span>
          <span className="font-bold tabular-nums" style={{ color: earthReplyIn > 0 ? '#EF4444' : '#10B981' }}>
            {formatCountdown(earthReplyIn)}
          </span>
        </div>

        <span className="text-slate-700 hidden lg:block">|</span>
        <span className="hidden lg:block text-red-400 font-semibold uppercase tracking-wider text-[9px]">
          ⚡ Deep Space — Full Autonomous Medical Command
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1">
        <div className="relative h-1.5 rounded-full bg-[#1A2438] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-none"
            style={{ width: `${progress * 100}%`, background: barColor }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-600">
          <span className="text-emerald-500 font-semibold">⚡ AI acted (&lt;1s)</span>
          <span className="text-slate-500 tabular-nums">
            Earth reply at {pad2(Math.floor(commsDelaySeconds / 60))}m {pad2(commsDelaySeconds % 60)}s
          </span>
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
