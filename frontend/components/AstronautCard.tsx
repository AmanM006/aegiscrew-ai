'use client'

import { useState } from 'react'
import type { AstronautStateResponse, TrafficLight, RiskFactor } from '@/types/telemetry'
import { Stethoscope, AlertOctagon, Activity, HeartPulse, Moon, Radiation, Zap, CheckCircle } from 'lucide-react'

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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E293B" strokeWidth="7" />
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
        style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 6px ${color})` }}
      />
      {/* Score label */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="16" fontWeight="900" fontFamily="var(--font-orbitron)">
        {score.toFixed(0)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="700" fontFamily="var(--font-mono)">
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
      className="bg-[#070D1F]/90 backdrop-blur-xl rounded-2xl border p-5 flex flex-col justify-between space-y-4 relative transition-all duration-300 hover:border-cyan-500/40 shadow-xl"
      style={{
        borderColor: color + '44',
        boxShadow:   risk.status !== 'GREEN' ? `0 0 25px ${color}22` : undefined,
      }}
    >
      {/* SPE Alert Badge */}
      {f.radiation.spe_alert_status === 'EMERGENCY' && (
        <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-orbitron font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50 animate-pulse flex items-center gap-1 shadow-neon-red">
          <Radiation className="w-3 h-3" />
          <span>SPE ACTIVE</span>
        </div>
      )}

      <div>
        {/* Header Row */}
        <div className="flex items-center gap-3.5 mb-3">
          <ReadinessGauge score={risk.mission_readiness_score} status={risk.status} />
          <div className="min-w-0">
            <div className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">{profile.id}</div>
            <div className="font-orbitron font-bold text-white text-sm tracking-wide leading-snug">{profile.name}</div>
            <div className="text-[11px] text-[#94A3B8] font-sans truncate">{profile.role}</div>

            {/* Risk Sub-Indices */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: 'FAT', val: risk.fatigue_risk_score, high: 50 },
                { label: 'CVX', val: risk.cardiovascular_risk_score, high: 50 },
                { label: 'RAD', val: risk.radiation_risk_score, high: 50 },
              ].map((r) => (
                <span
                  key={r.label}
                  className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: r.val >= r.high ? '#EF444420' : '#1E293B',
                    color:       r.val >= r.high ? '#EF4444'  : '#94A3B8',
                  }}
                >
                  {r.label} {r.val.toFixed(0)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 8-Vital Grid */}
        <div className="grid grid-cols-4 gap-1.5 my-3">
          {vitals.map((v) => (
            <div key={v.label} className="flex flex-col items-center p-1.5 rounded-lg bg-[#040814] border border-[#1E293B]/60">
              <span className="text-[9px] text-[#64748B] font-mono uppercase tracking-tight">{v.label}</span>
              <span
                className="text-[10px] font-mono font-bold mt-0.5"
                style={{ color: v.warn ? '#EF4444' : '#F1F5F9' }}
              >
                {v.value}
              </span>
            </div>
          ))}
        </div>

        {/* Clinical Anomaly Badges */}
        {risk.anomalies.length > 0 && (
          <div className="space-y-1.5 my-2">
            {risk.anomalies.slice(0, 2).map((a: RiskFactor, i) => (
              <div
                key={i}
                className="text-[10px] font-mono px-2.5 py-1 rounded-md border flex items-center gap-1.5"
                style={{
                  color:       SEVERITY_COLOR[a.severity],
                  borderColor: SEVERITY_COLOR[a.severity] + '40',
                  background:  SEVERITY_COLOR[a.severity] + '15',
                }}
              >
                <AlertOctagon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{a.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div>
        <button
          onClick={() => {
            onPrescribe()
            setShowPrescription(true)
          }}
          disabled={prescribing}
          className="w-full py-2 px-3 bg-[#0B1528] hover:bg-[#00F0FF]/15 border border-[#00F0FF]/40 hover:border-[#00F0FF] text-[#00F0FF] text-xs font-orbitron font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-neon-cyan disabled:opacity-50"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>{prescribing ? 'Synthesizing...' : 'Prescribe Countermeasure'}</span>
        </button>

        {/* Prescription Modal / Panel */}
        {showPrescription && prescriptionText && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between font-orbitron font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>IBM GRANITE PROTOCOL</span>
              </span>
              <button
                onClick={() => setShowPrescription(false)}
                className="text-gray-400 hover:text-white text-[10px]"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{prescriptionText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
