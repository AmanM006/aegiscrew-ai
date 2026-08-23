'use client'

import { AlertTriangle, Radiation, Flame, BedDouble, CheckCircle2, FlaskConical, Moon } from 'lucide-react'

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
    activeColor: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
  },
  {
    id: 'spe',
    label: 'Solar Particle Event (SPE)',
    icon: Radiation,
    desc: 'Solar flare radiation spike on Jensen (87.4 mGy/day) → EVA halt & storm shelter ingress.',
    activeColor: 'border-red-500/50 bg-red-950/40 text-red-300',
  },
  {
    id: 'co2_spike',
    label: 'ECLSS CO₂ Leak',
    icon: Flame,
    desc: 'Scrubber failure → 5,120 ppm ambient CO₂ → Acute hypercapnia & morning cognitive fog.',
    activeColor: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
  },
  {
    id: 'sleep_deprivation',
    label: 'Circadian Collapse',
    icon: BedDouble,
    desc: 'Commander Vance 72-hr sleep debt → 9.2 hrs → High-risk EVA freeze & phototherapy.',
    activeColor: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300',
  },
  {
    id: 'parmitano_eva',
    label: '🏛 Historical: Parmitano EVA-23',
    icon: FlaskConical,
    desc: 'REAL 2013 NASA incident — water intrusion in helmet. AegisCrew T+90s vs actual T+8min detection.',
    activeColor: 'border-purple-500/50 bg-purple-950/40 text-purple-300',
  },
  {
    id: 'lunar_surface',
    label: '🌕 Artemis Lunar Surface',
    icon: Moon,
    desc: 'Artemis surface ops — elevated GCR radiation, EVA exertion, reduced habitat sleep. Generalisability demo.',
    activeColor: 'border-slate-400/50 bg-slate-900/40 text-slate-200',
  },
]

export default function EmergencySimulator({ activeScenario, onScenario }: EmergencySimulatorProps) {
  return (
    <div className="bg-[#0C1222] border border-[#1A2438] rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400/90" />
          <div>
            <h2 className="font-mono font-bold text-xs tracking-wider text-slate-200 uppercase">
              Mission Simulation Scenarios
            </h2>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Simulate clinical telemetry anomalies to evaluate autonomous IBM Granite 4 countermeasures.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {SCENARIOS.map((s) => {
          const Icon = s.icon
          const isActive = activeScenario === s.id
          return (
            <button
              key={s.id}
              onClick={() => onScenario(s.id)}
              className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between space-y-1.5 ${
                isActive
                  ? s.activeColor
                  : 'bg-[#080D1A] border-[#162033] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>
              <p className="text-[11px] font-sans leading-relaxed text-slate-400">{s.desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
