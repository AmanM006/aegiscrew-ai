'use client'

type CommsMode = 'ISS' | 'Lunar Gateway' | 'Mars Transit'

const MODES: { label: CommsMode; delay: string; color: string }[] = [
  { label: 'ISS',           delay: '0s',     color: '#10B981' },
  { label: 'Lunar Gateway', delay: '1.3s',   color: '#F59E0B' },
  { label: 'Mars Transit',  delay: '20 min', color: '#EF4444' },
]

interface Props {
  mode: CommsMode
  onModeChange: (m: CommsMode) => void
  autonomousMode: boolean
}

export default function CommsDelayBanner({ mode, onModeChange, autonomousMode }: Props) {
  const current = MODES.find(m => m.label === mode)!
  const isMars  = mode === 'Mars Transit'

  return (
    <div
      className="border-b transition-colors duration-500"
      style={{
        borderColor: current.color + '55',
        background:  `linear-gradient(90deg, ${current.color}08 0%, transparent 100%)`,
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {/* Autonomous mode message */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: current.color }}
          />
          {isMars && autonomousMode ? (
            <span
              className="text-xs font-mono font-semibold tracking-wide"
              style={{ color: current.color }}
            >
              Deep Space Autonomous AI Mode Active — Zero Ground Dependency
            </span>
          ) : (
            <span className="text-xs font-mono" style={{ color: current.color }}>
              Comms Link: {mode} · One-Way Delay: {current.delay}
            </span>
          )}
        </div>

        {/* Mode switcher pills */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-[#6B7280] mr-1 uppercase tracking-wider hidden sm:block">Mission:</span>
          {MODES.map(m => (
            <button
              key={m.label}
              onClick={() => onModeChange(m.label)}
              className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all"
              style={{
                background:  mode === m.label ? m.color + '22' : 'transparent',
                color:       mode === m.label ? m.color : '#6B7280',
                border:      `1px solid ${mode === m.label ? m.color + '55' : '#1F2D45'}`,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
