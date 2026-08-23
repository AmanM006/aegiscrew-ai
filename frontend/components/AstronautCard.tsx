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
  const [isSaved, setIsSaved] = useState(false)

  // Clean Markdown formatter for Granite clinical protocols
  const renderFormattedProtocol = (raw: string) => {
    const lines = raw.split('\n')
    return lines.map((line, idx) => {
      let trimmed = line.trim()
      if (!trimmed) return <div key={idx} className="h-1" />

      // Section header (###)
      if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
        const title = trimmed.replace(/^#+\s*/, '')
        return (
          <div key={idx} className="text-xs font-bold text-sky-400 font-mono mt-2 mb-1 border-b border-sky-500/20 pb-0.5">
            {title}
          </div>
        )
      }

      // Format bold markdown (**text**)
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g)
      const formattedContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="text-sky-300 font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })

      // Numbered or bullet list items
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={idx} className="flex items-start gap-1.5 text-[11px] font-mono text-slate-200 mt-1.5">
            <span className="text-amber-400 font-bold">{trimmed.match(/^\d+\./)?.[0]}</span>
            <div className="flex-1 leading-relaxed">{formattedContent.slice(1)}</div>
          </div>
        )
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        return (
          <div key={idx} className="flex items-start gap-2 text-[11px] font-mono text-slate-300 ml-2 mt-1">
            <span className="text-sky-400 mt-0.5">•</span>
            <div className="flex-1 leading-relaxed">{formattedContent}</div>
          </div>
        )
      }

      return (
        <p key={idx} className="text-[11px] font-mono leading-relaxed text-slate-200">
          {formattedContent}
        </p>
      )
    })
  }

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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{profile.id}</span>
                {isSaved && (
                  <span className="text-[8px] font-mono font-bold uppercase px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    Rx Saved
                  </span>
                )}
              </div>
              <div className="font-semibold text-slate-100 text-xs tracking-tight">{profile.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{profile.role}</div>
            </div>
          </div>

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

          {/* ML Confidence Badge — always visible */}
          <div
            className="rounded border my-2 overflow-hidden"
            style={{
              background:  isMLAnomaly ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              borderColor: isMLAnomaly ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)',
            }}
          >
            <div className="flex items-center gap-1.5 px-2 py-1">
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
            {/* Confidence interpretation — turns low nominal scores into a feature */}
            {!isMLAnomaly ? (
              <div className="px-2 pb-1.5 text-[8px] font-mono text-slate-600 leading-tight">
                Low deviation from baseline &rarr; high model confidence in nominal state.
                Confidence rises sharply when anomaly patterns emerge.
              </div>
            ) : (
              <div className="px-2 pb-1.5 text-[8px] font-mono leading-tight" style={{ color: 'rgba(239,68,68,0.55)' }}>
                Confidence moderate — anomaly signal clear, but limited historical anomaly
                samples available for precise calibration (rare events by design).
              </div>
            )}
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
              setIsSaved(false)
            }}
            disabled={prescribing}
            className="w-full py-1.5 px-3 bg-[#080D1A] hover:border-sky-500/40 border border-[#162033] text-sky-300 text-xs font-mono rounded transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Stethoscope className="w-3 h-3" />
            <span>{prescribing ? 'Synthesizing...' : 'Prescribe Protocol'}</span>
          </button>

          {/* Prescription Panel */}
          {showPrescription && prescriptionText && (
            <div className="mt-2.5 p-3.5 rounded bg-[#060A14] border border-sky-500/40 text-slate-100 text-xs font-mono space-y-2 shadow-2xl">
              <div className="flex items-center justify-between font-bold text-sky-300 text-[11px] border-b border-[#1A2438] pb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="tracking-wide">IBM GRANITE 4 CLINICAL PROTOCOL</span>
                </span>
                <button
                  onClick={() => setShowPrescription(false)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>

              {/* Clean Formatted Protocol Output */}
              <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                {renderFormattedProtocol(prescriptionText)}
              </div>

              {/* Save & Authorize Action Button */}
              <div className="pt-2 border-t border-[#1A2438] flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsSaved(true)}
                  disabled={isSaved}
                  className={`w-full py-1.5 px-2 rounded text-[10px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSaved
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                      : 'bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 text-sky-200'
                  }`}
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>{isSaved ? '✓ Authorized & Saved in Patient Record' : 'Authorize & Save to Patient Chart'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
