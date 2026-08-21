'use client'

import { AlertTriangle, Radiation, Flame, BedDouble, CheckCircle2, Zap } from 'lucide-react'

interface EmergencySimulatorProps {
  activeScenario: string
  onScenario: (scenario: string) => void
}

const SCENARIOS = [
  {
    id: 'nominal',
    label: 'Nominal Cruise',
    icon: CheckCircle2,
    desc: 'Normal baseline vitals across all crew. Standard flight medical surveillance.',
    activeColor: 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-lg shadow-emerald-950/50',
    hoverColor: 'hover:border-emerald-500/60 hover:text-emerald-300',
  },
  {
    id: 'spe',
    label: 'Solar Particle Event (SPE)',
    icon: Radiation,
    desc: 'Solar flare radiation jump on Engineer Jensen (87.4 mGy/day) → EVA halt & storm shelter ingress.',
    activeColor: 'border-red-500 bg-red-950/70 text-red-300 shadow-neon-red',
    hoverColor: 'hover:border-red-500/60 hover:text-red-300',
  },
  {
    id: 'co2_spike',
    label: 'ECLSS CO₂ Leak',
    icon: Flame,
    desc: 'Scrubber failure → 5,120 ppm ambient CO₂ → Acute hypercapnia & morning cognitive fog.',
    activeColor: 'border-amber-500 bg-amber-950/70 text-amber-300 shadow-neon-amber',
    hoverColor: 'hover:border-amber-500/60 hover:text-amber-300',
  },
  {
    id: 'sleep_deprivation',
    label: 'Circadian Collapse',
    icon: BedDouble,
    desc: 'Commander Vance 72-hr sleep debt → 9.2 hrs → High-risk EVA freeze & phototherapy.',
    activeColor: 'border-purple-500 bg-purple-950/70 text-purple-300 shadow-lg shadow-purple-950/50',
    hoverColor: 'hover:border-purple-500/60 hover:text-purple-300',
  },
]

export default function EmergencySimulator({ activeScenario, onScenario }: EmergencySimulatorProps) {
  const currentScenario = SCENARIOS.find((s) => s.id === activeScenario) || SCENARIOS[0]

  return (
    <div className="bg-[#0A0F1E] border border-[#1E293B] rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Title & Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-sm tracking-wider text-white uppercase flex items-center gap-2">
              <span>Deep Space Emergency Scenario Injector</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono lowercase">live trigger</span>
            </h2>
            <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
              Simulate high-stakes physiological anomalies to evaluate autonomous IBM Granite 3.0 clinical countermeasure synthesis.
            </p>
          </div>
        </div>

        {/* Active Scenario Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070D1F] border border-[#1E293B]">
          <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="text-xs font-mono text-[#64748B]">Active Scenario:</span>
          <span className="text-xs font-orbitron font-bold text-[#00F0FF] tracking-wide">{currentScenario.label}</span>
        </div>
      </div>

      {/* Scenario Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((s) => {
          const Icon = s.icon
          const isActive = activeScenario === s.id
          return (
            <button
              key={s.id}
              onClick={() => onScenario(s.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between space-y-2 ${
                isActive
                  ? s.activeColor
                  : `bg-[#070D1F]/80 border-[#1E293B] text-[#94A3B8] ${s.hoverColor} hover:bg-[#0B1528]`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-orbitron font-bold text-xs tracking-wider">{s.label}</span>
                </div>
                {isActive && <span className="w-2 h-2 rounded-full bg-current animate-ping" />}
              </div>
              <p className="text-[11px] font-sans leading-relaxed opacity-80">{s.desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
