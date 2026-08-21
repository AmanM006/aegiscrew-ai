'use client'

import { Radio } from 'lucide-react'

export type CommsPreset = 'ISS' | 'Lunar Gateway' | 'Mars Transit'

interface CommsDelayBannerProps {
  mode: CommsPreset
  onModeChange: (mode: CommsPreset) => void
  autonomousMode: boolean
}

const PRESETS: Record<CommsPreset, { delay: number; label: string; desc: string }> = {
  'ISS':           { delay: 0,    label: 'ISS (LEO)',        desc: '0.0s latency — Real-time ground telemetry' },
  'Lunar Gateway': { delay: 1.3,  label: 'Lunar Gateway',    desc: '1.3s latency — Low Earth comms degradation' },
  'Mars Transit':  { delay: 1200, label: 'Mars Transit',     desc: '1,200s (20 min) latency — Autonomous on-board AI active' },
}

export default function CommsDelayBanner({ mode, onModeChange, autonomousMode }: CommsDelayBannerProps) {
  const current = PRESETS[mode]

  return (
    <div className="bg-[#0C1222] border-b border-[#1A2438] px-6 py-2">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left — Autonomous indicator */}
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 border border-slate-700 text-sky-300 uppercase tracking-wide">
            Autonomous AI Active
          </span>

          <div className="hidden md:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>Ground Latency:</span>
            <strong className="text-slate-200">{current.delay}s ({(current.delay / 60).toFixed(1)} min)</strong>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{current.desc}</span>
          </div>
        </div>

        {/* Right — Presets buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline mr-1">Simulate Latency:</span>
          {(Object.keys(PRESETS) as CommsPreset[]).map((key) => {
            const isActive = mode === key
            return (
              <button
                key={key}
                onClick={() => onModeChange(key)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-sky-950 border border-sky-500/50 text-sky-200 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
