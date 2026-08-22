'use client'

import { Radio, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

export type CommsPreset = 'ISS' | 'Lunar Gateway' | 'Mars Transit'

interface CommsDelayBannerProps {
  mode: CommsPreset
  onModeChange: (mode: CommsPreset) => void
  autonomousMode: boolean
}

interface PresetConfig {
  delay: number
  label: string
  delayLabel: string
  badge: string
  badgeColor: string      // Tailwind bg+border+text triplet encoded as CSS vars
  bannerBg: string
  bannerBorder: string
  bannerText: string
  bannerSub: string
  icon: 'green' | 'yellow' | 'red'
}

const PRESETS: Record<CommsPreset, PresetConfig> = {
  'ISS': {
    delay: 0,
    label: 'ISS (LEO)',
    delayLabel: '0s',
    badge: 'Ground Flight Surgeon Direct Link: ONLINE',
    badgeColor: 'green',
    bannerBg: '#0A1A0F',
    bannerBorder: '#14532D40',
    bannerText: '#4ADE80',
    bannerSub: 'Real-time ground telemetry active — Earth flight surgeon has direct crew oversight',
    icon: 'green',
  },
  'Lunar Gateway': {
    delay: 1.3,
    label: 'Lunar Gateway',
    delayLabel: '1.3s',
    badge: 'Near-Space Relay Mode — Marginal Delay',
    badgeColor: 'yellow',
    bannerBg: '#1A1200',
    bannerBorder: '#92400E40',
    bannerText: '#FCD34D',
    bannerSub: '1.3s round-trip — Ground advisory with slight latency; AI augments physician decisions',
    icon: 'yellow',
  },
  'Mars Transit': {
    delay: 1200,
    label: 'Mars Transit',
    delayLabel: '20 min',
    badge: 'DEEP SPACE AUTONOMOUS AI PRIMARY — Zero Ground Dependency',
    badgeColor: 'red',
    bannerBg: '#1A0808',
    bannerBorder: '#7F1D1D50',
    bannerText: '#F87171',
    bannerSub: '22-min one-way delay (44 min round-trip) — No real-time Earth support possible. AegisCrew AI is sole medical authority.',
    icon: 'red',
  },
}

const DOT_COLOR: Record<PresetConfig['icon'], string> = {
  green:  '#4ADE80',
  yellow: '#FCD34D',
  red:    '#F87171',
}

const BUTTON_ACTIVE: Record<PresetConfig['icon'], string> = {
  green:  'bg-emerald-950 border-emerald-500/50 text-emerald-200',
  yellow: 'bg-amber-950 border-amber-500/50 text-amber-200',
  red:    'bg-red-950 border-red-500/50 text-red-200',
}

export default function CommsDelayBanner({ mode, onModeChange }: CommsDelayBannerProps) {
  const current = PRESETS[mode]
  const dotColor = DOT_COLOR[current.icon]

  return (
    <div
      className="border-b px-6 py-0"
      style={{ background: current.bannerBg, borderColor: current.bannerBorder }}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* ── Operational status banner ───────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-3 py-2 border-b"
          style={{ borderColor: current.bannerBorder }}
        >
          {/* Pulsing dot + primary status text */}
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
            />
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{ color: current.bannerText }}
            >
              {current.badge}
            </span>
          </div>
          {/* Sub-description */}
          <span
            className="hidden lg:block text-[10px] font-mono"
            style={{ color: current.bannerText + '99' }}
          >
            {current.bannerSub}
          </span>
        </div>

        {/* ── Controls row ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-1.5">
          {/* Left — icon + latency readout */}
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            {current.icon === 'green' ? (
              <Wifi className="w-3.5 h-3.5" style={{ color: dotColor }} />
            ) : current.icon === 'yellow' ? (
              <Radio className="w-3.5 h-3.5" style={{ color: dotColor }} />
            ) : (
              <WifiOff className="w-3.5 h-3.5" style={{ color: dotColor }} />
            )}
            <span className="text-slate-500">One-way latency:</span>
            <strong style={{ color: current.bannerText }}>{current.delayLabel}</strong>
            {current.icon === 'red' && (
              <span className="hidden md:flex items-center gap-1 ml-1 text-red-400 text-[9px] font-bold uppercase">
                <AlertTriangle className="w-3 h-3" />
                <span>No real-time ground support</span>
              </span>
            )}
          </div>

          {/* Right — preset switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[10px] hidden sm:inline mr-1">Mission Profile:</span>
            {(Object.keys(PRESETS) as CommsPreset[]).map((key) => {
              const isActive = mode === key
              const cfg = PRESETS[key]
              return (
                <button
                  key={key}
                  onClick={() => onModeChange(key)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium border transition-all ${
                    isActive
                      ? BUTTON_ACTIVE[cfg.icon]
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
