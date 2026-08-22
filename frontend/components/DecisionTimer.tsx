'use client'

import { useEffect, useState } from 'react'

interface Props {
  decisionTimestampMs: number     // Date.now() when the decision was made
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

  const elapsedMs   = now - decisionTimestampMs
  const elapsedSec  = elapsedMs / 1000
  const earthReplyIn = Math.max(0, commsDelaySeconds - elapsedSec)
  const isMars       = commsDelaySeconds >= 600

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1A2438] text-[10px] font-mono">
      {/* AI decision speed */}
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
        <span
          className="font-bold tabular-nums"
          style={{ color: earthReplyIn > 0 ? '#EF4444' : '#10B981' }}
        >
          {isMars ? formatCountdown(earthReplyIn) : '~instant'}
        </span>
      </div>

      {/* Autonomy callout — only on Mars */}
      {isMars && (
        <>
          <span className="text-slate-700 hidden lg:block">|</span>
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-sky-400 font-semibold uppercase tracking-wider text-[9px]">
              ⚡ Autonomous Mode — No Ground Required
            </span>
          </div>
        </>
      )}
    </div>
  )
}
