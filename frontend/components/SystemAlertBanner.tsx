'use client'

import type { CrewPatternAlert } from '@/types/telemetry'
import { AlertTriangle, Zap, Users } from 'lucide-react'

interface Props {
  alert: CrewPatternAlert
}

const SEVERITY_PALETTE = {
  CRITICAL: {
    bg:     'bg-red-950/60',
    border: 'border-red-500/50',
    badge:  'bg-red-500/20 text-red-300 border-red-500/30',
    title:  'text-red-300',
    icon:   'text-red-400',
    pulse:  'bg-red-500',
  },
  HIGH: {
    bg:     'bg-amber-950/40',
    border: 'border-amber-500/40',
    badge:  'bg-amber-500/15 text-amber-300 border-amber-500/25',
    title:  'text-amber-300',
    icon:   'text-amber-400',
    pulse:  'bg-amber-500',
  },
}

const TYPE_LABEL: Record<string, string> = {
  ENVIRONMENTAL: '⚗ Environmental Systems Fault',
  INDIVIDUAL:    '⚕ Individual Physiological Pattern',
  MIXED:         '⚠ Mixed Environmental + Physiological',
}

export default function SystemAlertBanner({ alert }: Props) {
  const pal   = SEVERITY_PALETTE[alert.severity as keyof typeof SEVERITY_PALETTE] ?? SEVERITY_PALETTE.HIGH
  const label = TYPE_LABEL[alert.pattern_type] ?? alert.pattern_type

  return (
    <div
      className={`rounded-lg border px-4 py-3.5 ${pal.bg} ${pal.border}`}
      role="alert"
    >
      {/* Title row */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className={`w-4.5 h-4.5 ${pal.icon}`} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${pal.badge}`}
            >
              SYSTEMS ALERT · {alert.severity}
            </span>
            <span className={`text-xs font-mono font-semibold ${pal.title}`}>
              {label}
            </span>
            {/* Pulse dot */}
            <span className="flex items-center gap-1 ml-auto flex-shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pal.pulse}`} />
              <span className="text-[9px] font-mono text-slate-400 uppercase">Live Correlation</span>
            </span>
          </div>

          {/* Root cause */}
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            <span className="font-semibold text-slate-100">Root Cause Analysis: </span>
            {alert.likely_root_cause}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-400">
            {/* Affected crew */}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-medium text-slate-200">
                {(alert.affected_names.length > 0 ? alert.affected_names : alert.affected_crew).join(', ')}
              </span>
            </span>

            {/* Shared signals */}
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Shared: {alert.shared_features.join(' · ')}</span>
            </span>
          </div>

          {/* Recommendation */}
          <div className={`text-[10px] font-mono px-2 py-1.5 rounded border ${pal.badge}`}>
            <span className="font-bold uppercase tracking-wide">Recommended Action: </span>
            {alert.recommendation}
          </div>

          {/* Key distinction callout */}
          {alert.pattern_type === 'ENVIRONMENTAL' && (
            <p className="text-[10px] text-slate-400 italic font-sans">
              ▶ This is <span className="text-slate-200 not-italic font-semibold">not</span> an
              isolated individual health issue — multiple crew share a common{' '}
              <span className={`font-semibold not-italic ${pal.title}`}>environmental trigger</span>.
              Address root cause in cabin systems before individual crew countermeasures.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
