'use client'

import { Radio, Wifi, ShieldAlert, Cpu } from 'lucide-react'

export type CommsPreset = 'ISS' | 'Lunar Gateway' | 'Mars Transit'

interface CommsDelayBannerProps {
  mode: CommsPreset
  onModeChange: (mode: CommsPreset) => void
  autonomousMode: boolean
}

const PRESETS: Record<CommsPreset, { delay: number; label: string; desc: string }> = {
  'ISS':           { delay: 0,    label: 'ISS (LEO)',        desc: '0.0s latency — Ground surgeon real-time connection active' },
  'Lunar Gateway': { delay: 1.3,  label: 'Lunar Gateway',    desc: '1.3s one-way latency — Low Earth comms degradation' },
  'Mars Transit':  { delay: 1200, label: 'Mars Transit',     desc: '1,200s (20 min) latency — Full autonomous on-board AI required' },
}

export default function CommsDelayBanner({ mode, onModeChange, autonomousMode }: CommsDelayBannerProps) {
  const current = PRESETS[mode]

  return (
    <div className="bg-gradient-to-r from-[#070D1F] via-[#0B1528] to-[#070D1F] border-b border-[#00F0FF]/30 px-6 py-3 shadow-lg">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left — Autonomous indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-orbitron font-bold text-[11px] tracking-wider uppercase shadow-neon-cyan">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>DEEP SPACE AUTONOMOUS AI ACTIVE</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[#94A3B8] font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>One-Way Ground Latency:</span>
            <strong className="text-white font-bold">{current.delay}s ({(current.delay / 60).toFixed(1)} min)</strong>
            <span className="text-[#475569]">·</span>
            <span className="text-[#64748B] italic">{current.desc}</span>
          </div>
        </div>

        {/* Right — Presets buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] font-mono text-[11px] hidden sm:inline">Comms Latency Simulation:</span>
          {(Object.keys(PRESETS) as CommsPreset[]).map((key) => {
            const isActive = mode === key
            return (
              <button
                key={key}
                onClick={() => onModeChange(key)}
                className={`px-3 py-1 rounded-md text-xs font-orbitron transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] shadow-neon-cyan font-bold'
                    : 'bg-[#0B132B] border border-[#1E293B] text-[#94A3B8] hover:border-[#475569] hover:text-white'
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
