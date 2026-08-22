'use client'

import { useState } from 'react'
import type { AstronautStateResponse, TrafficLight, RiskFactor } from '@/types/telemetry'
import { Stethoscope, AlertOctagon, Radiation, CheckCircle, BrainCircuit } from 'lucide-react'

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
  const r     = 38
  const cx    = 50
  const cy    = 50
  const circ  = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = STATUS_COLOR[status]

  return (
    <svg width="84" height="84" viewBox="0 0 100 100" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#162033" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize="17" fontWeight="700" fontFamily="var(--font-mono)">
        {score.toFixed(0)}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="600" fontFamily="var(--font-mono)">
        READINESS
      </text>
    </svg>
  )
}

export default function AstronautCard({ astro, prescribing, prescriptionText, onPrescribe }: Props) {
  const [showPrescription, setShowPrescription] = useState(false)
  const { profile, latest_frame: f, risk } = astro
  const color = STATUS_COLOR[risk.status]

  // Pulse animation class for RED status
  const cardStyle: React.CSSProperties = {
    borderColor: risk.status !== 'GREEN' ? color + '66' : '#1A2438',
    ...(risk.status === 'RED' && {
      animation: 'redPulse 2.5s ease-in-out infinite',
    }),
  }

  const vitals = [
    { label: 'HR',    value: `${f.vitals.heart_rate_bpm.toFixed(0)} bpm`,      warn: f.vitals.heart_rate_bpm > 100 },
    { label: 'HRV',   value: `${f.vitals.hrv_rmssd_ms.toFixed(0)} ms`,         warn: f.vitals.hrv_rmssd_ms < 30   },
    { label: 'SpO₂',  value: `${f.vitals.spo2_percent.toFixed(1)}%`,           warn: f.vitals.spo2_percent < 95   },
    { label: 'Temp',  value: `${f.vitals.core_temp_c.toFixed(1)}°C`,           warn: f.vitals.core_temp_c > 37.8  },
    { label: 'Sleep', value: `${f.circadian.sleep_hours_last_night.toFixed(1)}h`, warn: f.circadian.sleep_debt_72h_hrs > 4.5 },
    { label: 'CO₂',   value: `${f.atmosphere.cabin_co2_ppm.toFixed(0)} ppm`,   warn: f.atmosphere.cabin_co2_ppm > 4500  },
    { label: 'Rad',   value: `${f.radiation.daily_radiation_mgy.toFixed(2)} mGy`, warn: f.radiation.daily_radiation_mgy > 5 },
    { label: 'PVT',   value: `${f.circadian.pvt_reaction_time_ms.toFixed(0)} ms`, warn: f.circadian.pvt_reaction_time_ms > 320 },
  ]

  // ML anomaly data — show badge regardless of training_samples
  const mlResult    = risk.ml_result
  const hasMLData   = true                              // always show ML badge
  const isMLAnomaly = mlResult?.is_anomaly ?? (risk.ml_anomaly_score > 40)
  const mlConf      = risk.confidence || (mlResult?.confidence_str ?? 'threshold-only')
  const mlFeats     = mlResult?.contributing_features ?? []

  return (
    <>
      {/* Inline keyframe for red pulse */}
      {risk.status === 'RED' && (
        <style>{`
          @keyframes redPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
            50%       { box-shadow: 0 0 18px 2px rgba(239,68,68,0.18); }
          }
        `}</style>
      )}

      <div
        className="bg-[#0C1222] rounded-lg border p-4 flex flex-col justify-between space-y-3.5 transition-colors"
        style={cardStyle}
      >
        {/* SPE Alert Badge */}
        {f.radiation.spe_alert_status === 'EMERGENCY' && (
          <div className="flex items-center justify-between px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/60 text-red-400 border border-red-500/30">
            <span className="flex items-center gap-1">
              <Radiation className="w-3 h-3" />
              <span>SPE ACTIVE</span>
            </span>
            <span className="text-[9px]">EVA HALT</span>
          </div>
        )}

        <div>
          {/* Header Row */}
          <div className="flex items-center gap-3 mb-2">
            <ReadinessGauge score={risk.mission_readiness_score} status={risk.status} />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{profile.id}</div>
              <div className="font-semibold text-slate-100 text-xs tracking-tight">{profile.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{profile.role}</div>

              {/* Risk Sub-Indices */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  { label: 'FAT', val: risk.fatigue_risk_score, high: 50 },
                  { label: 'CVX', val: risk.cardiovascular_risk_score, high: 50 },
                  { label: 'RAD', val: risk.radiation_risk_score, high: 50 },
                  { label: 'ML',  val: risk.ml_anomaly_score, high: 40 },
                ].map((r) => (
                  <span
                    key={r.label}
                    className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: r.val >= r.high ? '#EF444420' : '#162033',
                      color:       r.val >= r.high ? '#EF4444'  : '#94A3B8',
                    }}
                  >
                    {r.label} {r.val.toFixed(0)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ML Confidence Badge — always visible */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded border mb-2"
            style={{
              background:  isMLAnomaly ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              borderColor: isMLAnomaly ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)',
            }}
          >
            <BrainCircuit
              className="w-3 h-3 flex-shrink-0"
              style={{ color: isMLAnomaly ? '#EF4444' : '#10B981' }}
            />
            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[9px] font-mono font-semibold"
                style={{ color: isMLAnomaly ? '#EF4444' : '#10B981' }}
              >
                {isMLAnomaly ? '⚠ ML ANOMALY' : '✓ ML NOMINAL'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {mlConf}
              </span>
            </div>
          </div>

          {/* Contributing features from ML */}
          {mlFeats.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {mlFeats.slice(0, 3).map((feat, i) => (
                <span
                  key={i}
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                >
                  {feat}
                </span>
              ))}
            </div>
          )}

          {/* 8-Vital Grid */}
          <div className="grid grid-cols-4 gap-1 my-2">
            {vitals.map((v) => (
              <div key={v.label} className="flex flex-col items-center p-1 rounded bg-[#080D1A] border border-[#162033]">
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tight">{v.label}</span>
                <span
                  className="text-[10px] font-mono font-semibold mt-0.5"
                  style={{ color: v.warn ? '#EF4444' : '#E2E8F0' }}
                >
                  {v.value}
                </span>
              </div>
            ))}
          </div>

          {/* Clinical Anomaly Badges */}
          {risk.anomalies.length > 0 && (
            <div className="space-y-1 my-1.5">
              {risk.anomalies.slice(0, 2).map((a: RiskFactor, i) => (
                <div
                  key={i}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1"
                  style={{
                    color:       SEVERITY_COLOR[a.severity],
                    borderColor: SEVERITY_COLOR[a.severity] + '30',
                    background:  SEVERITY_COLOR[a.severity] + '10',
                  }}
                >
                  <AlertOctagon className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">{a.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Prediction Row */}
          {astro.prediction && astro.prediction.predicted_status_in_6h !== 'STABLE' && (
            <div
              className="text-[9px] font-mono px-2 py-1 rounded border flex items-center gap-1.5 mt-1"
              style={{
                background:  astro.prediction.predicted_status_in_6h === 'RED'   ? 'rgba(239,68,68,0.08)'
                           : astro.prediction.predicted_status_in_6h === 'AMBER' ? 'rgba(245,158,11,0.08)'
                           : 'rgba(16,185,129,0.08)',
                borderColor: astro.prediction.predicted_status_in_6h === 'RED'   ? 'rgba(239,68,68,0.25)'
                           : astro.prediction.predicted_status_in_6h === 'AMBER' ? 'rgba(245,158,11,0.25)'
                           : 'rgba(16,185,129,0.25)',
                color:       astro.prediction.predicted_status_in_6h === 'RED'   ? '#EF4444'
                           : astro.prediction.predicted_status_in_6h === 'AMBER' ? '#F59E0B'
                           : '#10B981',
              }}
            >
              <span className="text-[8px] font-bold uppercase">▶ +6h:</span>
              <span>
                {astro.prediction.hours_to_red != null
                  ? `RED in ${astro.prediction.hours_to_red.toFixed(1)}h`
                  : astro.prediction.hours_to_amber != null
                  ? `AMBER in ${astro.prediction.hours_to_amber.toFixed(1)}h`
                  : astro.prediction.prediction_basis}
              </span>
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
            className="w-full py-1.5 px-3 bg-[#080D1A] hover:border-sky-500/40 border border-[#162033] text-sky-300 text-xs font-mono rounded transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Stethoscope className="w-3 h-3" />
            <span>{prescribing ? 'Synthesizing...' : 'Prescribe Protocol'}</span>
          </button>

          {/* Prescription Panel */}
          {showPrescription && prescriptionText && (
            <div className="mt-2.5 p-3 rounded bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-300 text-[11px]">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>IBM GRANITE PROTOCOL</span>
                </span>
                <button
                  onClick={() => setShowPrescription(false)}
                  className="text-slate-500 hover:text-slate-300 text-[10px]"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-amber-100/90">{prescriptionText}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
