'use client'

import { useState } from 'react'
import type { AstronautStateResponse, TrafficLight, RiskFactor } from '@/types/telemetry'

interface Props {
  astro: AstronautStateResponse
  prescribing: boolean
  prescriptionText?: string
  onPrescribe: () => void
}

const STATUS_COLOR: Record<TrafficLight, string> = {
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED:   '#EF4444',
}
const SEVERITY_COLOR: Record<string, string> = {
  LOW:      '#10B981',
  MODERATE: '#F59E0B',
  HIGH:     '#F59E0B',
  CRITICAL: '#EF4444',
}

function ReadinessGauge({ score, status }: { score: number; status: TrafficLight }) {
  const r      = 38
  const cx     = 50
  const cy     = 50
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = STATUS_COLOR[status]

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="flex-shrink-0">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1F2D45" strokeWidth="7" />
      {/* Arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 5px ${color})` }}
      />
      {/* Score label */}
      <text x={cx} y={cy - 5} textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="monospace">
        {score.toFixed(0)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize="8" fontFamily="monospace">
        READINESS
      </text>
    </svg>
  )
}

export default function AstronautCard({ astro, prescribing, prescriptionText, onPrescribe }: Props) {
  const [showPrescription, setShowPrescription] = useState(false)
  const { profile, latest_frame: f, risk } = astro
  const color = STATUS_COLOR[risk.status]

  const vitals = [
    { label: 'HR',    value: `${f.vitals.heart_rate_bpm.toFixed(0)} bpm`,     warn: f.vitals.heart_rate_bpm > 100 },
    { label: 'HRV',   value: `${f.vitals.hrv_rmssd_ms.toFixed(0)} ms`,        warn: f.vitals.hrv_rmssd_ms < 30   },
    { label: 'SpO₂',  value: `${f.vitals.spo2_percent.toFixed(1)}%`,          warn: f.vitals.spo2_percent < 95   },
    { label: 'Temp',  value: `${f.vitals.core_temp_c.toFixed(1)}°C`,          warn: f.vitals.core_temp_c > 37.8  },
    { label: 'Sleep', value: `${f.circadian.sleep_hours_last_night.toFixed(1)}h`, warn: f.circadian.sleep_debt_72h_hrs > 4.5 },
    { label: 'CO₂',   value: `${f.atmosphere.cabin_co2_ppm.toFixed(0)} ppm`,  warn: f.atmosphere.cabin_co2_ppm > 4500  },
    { label: 'Rad',   value: `${f.radiation.daily_radiation_mgy.toFixed(2)} mGy`, warn: f.radiation.daily_radiation_mgy > 5 },
    { label: 'PVT',   value: `${f.circadian.pvt_reaction_time_ms.toFixed(0)} ms`, warn: f.circadian.pvt_reaction_time_ms > 320 },
  ]

  return (
    <div
      className="mission-card flex flex-col gap-4 relative"
      style={{
        borderColor: color + '44',
        boxShadow:   risk.status !== 'GREEN' ? `0 0 20px ${color}22` : undefined,
      }}
    >
      {/* SPE badge */}
      {f.radiation.spe_alert_status === 'EMERGENCY' && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 animate-pulse">
          SPE EMERGENCY
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-3">
        <ReadinessGauge score={risk.mission_readiness_score} status={risk.status} />
        <div className="min-w-0">
          <div className="font-mono text-xs text-[#6B7280]">{profile.id}</div>
          <div className="font-bold text-white text-sm leading-tight">{profile.name}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">{profile.role}</div>
          {/* Risk scores */}
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'FAT', val: risk.fatigue_risk_score, high: 50 },
              { label: 'CVX', val: risk.cardiovascular_risk_score, high: 50 },
              { label: 'RAD', val: risk.radiation_risk_score, high: 50 },
            ].map(r => (
              <span
                key={r.label}
                className="text-[9px] font-mono px-1 py-0.5 rounded"
                style={{
                  background: r.val >= r.high ? '#EF444420' : '#1F2D45',
                  color:       r.val >= r.high ? '#EF4444'  : '#6B7280',
                }}
              >
                {r.label} {r.val.toFixed(0)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vital grid */}
      <div className="grid grid-cols-4 gap-1">
        {vitals.map(v => (
          <div key={v.label} className="flex flex-col items-center p-1.5 rounded bg-[#0F1823]">
            <span className="text-[9px] text-[#6B7280] uppercase tracking-wide">{v.label}</span>
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: v.warn ? '#EF4444' : '#E5E7EB' }}
            >
              {v.value}
            </span>
          </div>
        ))}
      </div>

      {/* Anomaly badges */}
      {risk.anomalies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {risk.anomalies.slice(0, 3).map((a: RiskFactor, i) => (
            <span
              key={i}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
              style={{
                color:       SEVERITY_COLOR[a.severity],
                borderColor: SEVERITY_COLOR[a.severity] + '40',
                background:  SEVERITY_COLOR[a.severity] + '12',
              }}
            >
              {a.severity} · {a.category}
            </span>
          ))}
        </div>
      )}

      {/* Prescribe button */}
      <button
        onClick={() => { onPrescribe(); setShowPrescription(true) }}
        disabled={prescribing}
        className="w-full py-2 rounded-lg text-xs font-semibold font-mono uppercase tracking-widest transition-all border"
        style={{
          background:  risk.anomalies.length > 0 ? color + '20' : '#1F2D4560',
          borderColor: risk.anomalies.length > 0 ? color + '55' : '#1F2D45',
          color:       risk.anomalies.length > 0 ? color        : '#6B7280',
          opacity:     prescribing ? 0.6 : 1,
        }}
      >
        {prescribing ? 'Prescribing...' : risk.anomalies.length > 0 ? '⚕ Prescribe Countermeasures' : '✓ Nominal — Request Wellness Check'}
      </button>

      {/* Prescription panel */}
      {showPrescription && prescriptionText && (
        <div className="mt-1">
          <pre
            className="text-[9px] font-mono text-[#00F0FF]/80 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto p-3 rounded bg-[#0B0F19] border border-[#1F2D45]"
          >
            {prescriptionText}
          </pre>
          <button
            onClick={() => setShowPrescription(false)}
            className="mt-1 text-[9px] text-[#6B7280] hover:text-white font-mono underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
