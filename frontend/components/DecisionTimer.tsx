'use client'

import { useEffect, useState } from 'react'

interface Props {
  decisionTimestampMs: number     // Date.now() when the AI made its decision
  commsDelaySeconds: number       // one-way comms delay (1200 for Mars)
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

export default function DecisionTimer({ decisionTimestampMs, commsDelaySeconds }: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  const elapsedMs     = now - decisionTimestampMs
  const elapsedSec    = elapsedMs / 1000
  const earthReplyIn  = Math.max(0, commsDelaySeconds - elapsedSec)
  const isMars        = commsDelaySeconds >= 600

  // Progress: 0 → 1 as elapsed time grows from 0 → commsDelaySeconds
  // AI acted instantly; Earth reply creeps toward the marker
  const progress = isMars
    ? Math.min(1, elapsedSec / commsDelaySeconds)
    : 1

  // Colour shifts green→amber→red as the delay deadline approaches
  const barColor = progress < 0.5
    ? '#10B981'   // emerald
    : progress < 0.85
    ? '#F59E0B'   // amber
    : '#EF4444'   // red

  return (
    <div className="px-4 py-3 rounded-lg bg-[#080D1A] border border-[#1A2438] space-y-2.5 text-[10px] font-mono">

      {/* ── Text row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        {/* AI acted label */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-slate-400">AI Decision:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            {formatElapsed(elapsedMs)} ago
          </span>
        </div>

        <span className="text-slate-700 hidden sm:block">|</span>

        {/* Earth reply countdown */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-slate-400">Earth Reply In:</span>
          <span className="font-bold tabular-nums" style={{ color: earthReplyIn > 0 ? '#EF4444' : '#10B981' }}>
            {isMars
              ? formatCountdown(earthReplyIn)
              : commsDelaySeconds === 0
                ? <span className="text-emerald-400">Real-time (0s)</span>
                : `${commsDelaySeconds.toFixed(1)}s`
            }
          </span>
        </div>

        {/* Autonomy callout */}
        {isMars && (
          <>
            <span className="text-slate-700 hidden lg:block">|</span>
            <span className="hidden lg:block text-sky-400 font-semibold uppercase tracking-wider text-[9px]">
              ⚡ Autonomous Mode — No Ground Required
            </span>
          </>
        )}
      </div>

      {/* ── Progress bar (Mars only) ──────────────────────────────── */}
      {isMars && (
        <div className="space-y-1">
          <div className="relative h-1.5 rounded-full bg-[#1A2438] overflow-hidden">
            {/* AI acted — instant, shown as leading marker at 0 */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-none"
              style={{ width: `${progress * 100}%`, background: barColor }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-600">
            <span className="text-emerald-500 font-semibold">⚡ AI acted (0s)</span>
            <span className="text-slate-500 tabular-nums">
              Earth reply at {pad2(Math.floor(commsDelaySeconds / 60))}m {pad2(commsDelaySeconds % 60)}s
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
