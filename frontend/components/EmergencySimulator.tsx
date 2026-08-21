'use client'

type Scenario = 'nominal' | 'spe' | 'co2_spike' | 'sleep_deprivation'

interface ScenarioConfig {
  id: Scenario
  label: string
  shortLabel: string
  description: string
  color: string
  icon: string
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'nominal',
    label: 'Nominal Mars Transit',
    shortLabel: 'Nominal',
    description: 'Stable baseline vitals across all crew members.',
    color: '#10B981',
    icon: '✓',
  },
  {
    id: 'spe',
    label: 'Solar Particle Event',
    shortLabel: 'Solar Flare',
    description: 'SPE during EVA — extreme radiation flux on ASTRO-02 (Jensen). EVA halt + shelter ingress.',
    color: '#F59E0B',
    icon: '☀',
  },
  {
    id: 'co2_spike',
    label: 'CO₂ Scrubber Failure',
    shortLabel: 'CO₂ Spike',
    description: 'ECLSS scrubber degradation → cabin CO₂ 5,120 ppm. Morning cognitive fog across all crew.',
    color: '#EF4444',
    icon: '⚗',
  },
  {
    id: 'sleep_deprivation',
    label: 'Circadian Collapse',
    shortLabel: 'Sleep Dep.',
    description: 'Commander Vance (ASTRO-01) accumulates 9.2-hr sleep debt → operational freeze.',
    color: '#8B5CF6',
    icon: '🌙',
  },
]

interface Props {
  activeScenario: string
  onScenario: (s: string) => void
}

export default function EmergencySimulator({ activeScenario, onScenario }: Props) {
  return (
    <div className="mission-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-widest">
            Emergency Scenario Simulator
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Trigger live emergencies to demonstrate autonomous AI medical response capabilities.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
          <span className="text-[10px] font-mono text-[#EF4444] uppercase">JUDGE DEMO CONTROLS</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map(s => {
          const isActive = activeScenario === s.id
          return (
            <button
              key={s.id}
              onClick={() => onScenario(s.id)}
              className="group relative flex flex-col gap-1.5 text-left p-3 rounded-lg border transition-all duration-200"
              style={{
                background:   isActive ? s.color + '15' : '#1A2236',
                borderColor:  isActive ? s.color + '60' : '#1F2D45',
                boxShadow:    isActive ? `0 0 16px ${s.color}30` : 'none',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: s.color }}
                />
              )}

              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: isActive ? s.color : '#9CA3AF' }}
                >
                  {s.shortLabel}
                </span>
              </div>

              <p className="text-[10px] text-[#6B7280] leading-relaxed line-clamp-2">
                {s.description}
              </p>

              {isActive && (
                <span
                  className="text-[9px] font-mono font-bold uppercase tracking-widest mt-1"
                  style={{ color: s.color }}
                >
                  ● ACTIVE
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
