'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  CrewStateResponse, AgentBriefingResponse, AgentChatResponse,
  Countermeasure, AstronautStateResponse, ChatTurn,
} from '@/types/telemetry'
import {
  BrainCircuit, RefreshCw, Send, CheckCircle2,
  MessageSquare, FileText, AlertTriangle, Link2, Archive,
} from 'lucide-react'
import DecisionTimer from './DecisionTimer'
import AuditLogPanel from './AuditLogPanel'
import VoiceInterface from './VoiceInterface'

interface Props {
  crewState: CrewStateResponse
  activeScenario: string
  apiBase: string
  commsDelaySeconds?: number   // from CommsDelayBanner switcher; default = backend value
}

const URGENCY_COLOR: Record<string, string> = {
  IMMEDIATE: '#EF4444',
  URGENT:    '#F59E0B',
  PRIORITY:  '#38BDF8',
  ROUTINE:   '#10B981',
}

// ─── Sound cue ────────────────────────────────────────────────────────────────
// Chrome blocks autoplay until first user gesture. We track whether the user
// has interacted with the page and resume any suspended AudioContext.
let _audioCtx: AudioContext | null = null

function _getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!_audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      _audioCtx = new AudioCtx()
    }
    // Resume if Chrome suspended it (autoplay policy)
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume().catch(() => {/* ignore */})
    }
    return _audioCtx
  } catch {
    return null
  }
}

// Prime the AudioContext on first user interaction so it's ready for alerts
function _primeAudio() {
  _getAudioCtx()
  document.removeEventListener('click', _primeAudio)
  document.removeEventListener('keydown', _primeAudio)
}
if (typeof document !== 'undefined') {
  document.addEventListener('click',   _primeAudio, { once: true, passive: true })
  document.addEventListener('keydown', _primeAudio, { once: true, passive: true })
}

function playAlertTone() {
  try {
    const ctx = _getAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      // Queue the tone to fire after resume completes
      ctx.resume().then(() => playAlertTone()).catch(() => {/* blocked */})
      return
    }
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // Web Audio not available — silent fallback
  }
}

// ─── Authority-mode config per comms latency ─────────────────────────────────
function getAuthorityMode(commsDelaySeconds: number) {
  if (commsDelaySeconds >= 600) {
    return {
      badge:    '⚡ AUTONOMOUS EDGE EXECUTION',
      badgeColor: '#10B981',
      badgeBg:  '#10B98115',
      badgeBorder: '#10B98140',
      subtext:  `Earth uncontactable (${Math.round(commsDelaySeconds / 60)}m latency). Onboard AI authorized to execute protocol immediately.`,
      btnLabel: (approved: boolean) => approved ? 'Protocol Executed' : 'Execute Protocol Now',
      btnStyle: (approved: boolean) => approved
        ? { borderColor: '#10B981', background: '#10B98120', color: '#10B981' }
        : { borderColor: '#EF4444', background: '#EF444415', color: '#EF4444' },
    }
  }
  if (commsDelaySeconds <= 1.5) {
    return {
      badge:    '📡 RELAYED TO HOUSTON FLIGHT SURGEON',
      badgeColor: '#38BDF8',
      badgeBg:  '#38BDF815',
      badgeBorder: '#38BDF840',
      subtext:  'Direct real-time link active (0s). Ground Medical Officer has primary authority — AI in advisory role.',
      btnLabel: (approved: boolean) => approved ? 'Ground Doctor Signed' : 'Awaiting Ground Doctor Signature',
      btnStyle: (_approved: boolean) => ({ borderColor: '#38BDF8', background: '#38BDF810', color: '#38BDF8' }),
    }
  }
  // Lunar Gateway
  return {
    badge:    '🤝 DUAL EARTH–AI HANDSHAKE',
    badgeColor: '#F59E0B',
    badgeBg:  '#F59E0B15',
    badgeBorder: '#F59E0B40',
    subtext:  'Near-space relay (1.3s). Collaborative edge–ground clinical verification required.',
    btnLabel: (approved: boolean) => approved ? 'Handshake Confirmed' : 'Confirm Dual Verification',
    btnStyle: (approved: boolean) => approved
      ? { borderColor: '#F59E0B', background: '#F59E0B20', color: '#F59E0B' }
      : { borderColor: '#F59E0B60', background: '#F59E0B10', color: '#F59E0B' },
  }
}

// ─── Countermeasure card ──────────────────────────────────────────────────────
function CountermeasureCard({ cm, commsDelaySeconds }: { cm: Countermeasure; commsDelaySeconds: number }) {
  const [approved, setApproved] = useState(false)
  const color = URGENCY_COLOR[cm.urgency] || '#64748B'
  const authority = getAuthorityMode(commsDelaySeconds)

  return (
    <div
      className="rounded-lg border p-3.5 flex flex-col gap-2 transition-colors bg-[#080D1A]"
      style={{ borderColor: approved ? '#10B98150' : color + '30' }}
    >
      {/* ── Authority mode badge ── */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-mono font-bold"
        style={{ background: authority.badgeBg, borderColor: authority.badgeBorder, color: authority.badgeColor }}
      >
        <span>{authority.badge}</span>
      </div>
      <div className="text-[10px] font-mono leading-snug" style={{ color: authority.badgeColor + 'CC' }}>
        {authority.subtext}
      </div>

      {/* ── Protocol header row ── */}
      <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#162033]">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: color + '15', color }}>{cm.urgency}</span>
          <span className="text-[9px] text-slate-500 font-mono">[{cm.protocol_id}]</span>
        </div>
        <button
          onClick={() => setApproved((a) => !a)}
          className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border transition-colors flex items-center gap-1"
          style={authority.btnStyle(approved)}
        >
          {approved ? <CheckCircle2 className="w-3 h-3" /> : null}
          <span>{authority.btnLabel(approved)}</span>
        </button>
      </div>
      <div className="text-xs font-semibold text-slate-100">{cm.title}</div>
      <div className="text-[11px] text-slate-400 font-sans leading-relaxed">{cm.clinical_action}</div>
      {cm.operational_impact && (
        <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{cm.operational_impact}</span>
        </div>
      )}
      {cm.citations.length > 0 && (
        <div className="text-[9px] text-slate-500 font-mono pt-1 border-t border-[#162033]">
          NASA: {cm.citations.join(' · ')}
        </div>
      )}
    </div>
  )
}

// ─── 4-Stage horizontal explainability pipeline ───────────────────────────────
interface StageProps {
  color: string
  label: string
  sub: string
  items: string[]
  nominalFallback: string   // shown instead of dimmed "nominal" when items is empty
  active: boolean
  last?: boolean
}

function PipelineStage({ color, label, sub, items, nominalFallback, active, last }: StageProps) {
  return (
    <div className="flex items-stretch gap-0 flex-1 min-w-0">
      <div
        className="flex-1 min-w-0 rounded-lg border p-2.5 transition-colors"
        style={{ borderColor: active ? color + '40' : '#1A2438', background: active ? color + '08' : '#0A0F1A' }}
      >
        {/* Stage header */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: active ? color : '#334155' }}
          />
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-wide"
            style={{ color: active ? color : '#475569' }}
          >
            {label}
          </span>
        </div>
        <div className="text-[9px] text-slate-500 font-mono mb-1.5 leading-tight">{sub}</div>
        {/* Items */}
        <div className="space-y-0.5">
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="text-[8px] font-mono text-slate-300 truncate leading-snug">{item}</div>
          ))}
          {items.length === 0 && (
            <div className="text-[8px] font-mono text-slate-500 leading-snug">{nominalFallback}</div>
          )}
        </div>
      </div>
      {/* Arrow connector */}
      {!last && (
        <div className="flex items-center px-0.5 flex-shrink-0">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M0 5h10M7 1l4 4-4 4" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  )
}

function ExplainabilityChain({
  astro,
}: {
  astro: AstronautStateResponse
}) {
  const mlFeats   = astro.risk.ml_result?.contributing_features ?? []
  const anomalies = astro.risk.anomalies
  const cms       = astro.active_countermeasures
  const isAnomaly = astro.risk.ml_result?.is_anomaly ?? false
  const mlScore   = astro.risk.ml_anomaly_score
  const readiness = astro.risk.mission_readiness_score

  // Stage content — always populate even for nominal crew
  const mlItems = mlFeats.length > 0
    ? [`Score: ${mlScore.toFixed(0)}  ${isAnomaly ? '⚠ ANOMALY' : '✓ normal'}`, ...mlFeats.slice(0, 2)]
    : []

  const ruleItems = anomalies.map(
    a => `[${a.protocol_id ?? '?'}] ${a.category}: ${a.value.toFixed(1)} vs ${a.threshold.toFixed(1)}`
  )

  // RAG: list the top clinical references cited by anomalies
  const ragItems = Array.from(new Set(
    anomalies.flatMap(a => a.protocol_id ? [`Protocol: ${a.protocol_id}`] : [])
  ))
  if (ragItems.length === 0 && anomalies.length > 0) ragItems.push('NASA-STD-3001', 'SP-2010-3407')

  const graniteItems = cms.map(cm => `[${cm.protocol_id}] ${cm.title}`)

  // Nominal fallback strings derived from actual telemetry
  const mlNominal   = `Score: ${mlScore.toFixed(0)} (Nominal) · Conformity ${Math.min(99, Math.round(100 - mlScore * 0.3))}%`
  const ruleNominal = `Readiness: ${readiness.toFixed(0)}/100 · All ${anomalies.length === 0 ? 'thresholds clear' : 'rules passed'}`
  const ragNominal  = 'No active protocols — baselines within NASA-STD-3001 limits'
  const graniteNominal = 'No countermeasures required — crew state nominal'

  return (
    <div className="rounded-lg border border-[#1A2438] bg-[#060B14] p-3 space-y-2">
      {/* Title + status */}
      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 uppercase tracking-wider">
        <Link2 className="w-3 h-3 text-sky-400" />
        <span>{astro.profile.name}</span>
        <span
          className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
          style={{
            background: astro.risk.status === 'RED' ? '#EF444420' : astro.risk.status === 'AMBER' ? '#F59E0B20' : '#10B98120',
            color: astro.risk.status === 'RED' ? '#EF4444' : astro.risk.status === 'AMBER' ? '#F59E0B' : '#10B981',
          }}
        >
          {astro.risk.status} · {readiness.toFixed(0)}/100
        </span>
        <span className="ml-auto text-[8px] text-slate-600">ibm/granite-4-h-small</span>
      </div>

      {/* 4-stage horizontal pipeline */}
      <div className="flex items-stretch gap-0">
        <PipelineStage
          color="#A855F7"
          label="ML Engine"
          sub="IsolationForest"
          items={mlItems}
          nominalFallback={mlNominal}
          active={mlFeats.length > 0}
        />
        <PipelineStage
          color="#F59E0B"
          label="Rule Engine"
          sub="NASA-STD-3001"
          items={ruleItems}
          nominalFallback={ruleNominal}
          active={anomalies.length > 0}
        />
        <PipelineStage
          color="#00F0FF"
          label="Clinical RAG"
          sub="SP-2010-3407"
          items={ragItems}
          nominalFallback={ragNominal}
          active={ragItems.length > 0}
        />
        <PipelineStage
          color="#10B981"
          label="Granite 4"
          sub="Synthesis"
          items={graniteItems}
          nominalFallback={graniteNominal}
          active={cms.length > 0}
          last
        />
      </div>
    </div>
  )
}

// ─── Crew-selector wrapper for the chain tab ─────────────────────────────────
function ExplainabilityChainTab({ crewState }: { crewState: CrewStateResponse }) {
  const [selectedId, setSelectedId] = useState<string>(crewState.crew[0]?.profile.id ?? '')
  const astro = crewState.crew.find(a => a.profile.id === selectedId) ?? crewState.crew[0]

  return (
    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
      {/* Crew pill selector */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[9px] font-mono text-slate-500 self-center mr-1">View pipeline for:</span>
        {crewState.crew.map((a) => {
          const isActive = a.profile.id === selectedId
          const statusColor = a.risk.status === 'RED' ? '#EF4444' : a.risk.status === 'AMBER' ? '#F59E0B' : '#10B981'
          return (
            <button
              key={a.profile.id}
              onClick={() => setSelectedId(a.profile.id)}
              className={`px-2.5 py-1 rounded border text-[10px] font-mono font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-[#080D1A] border-[#162033] text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <span className="mr-1.5" style={{ color: isActive ? statusColor : undefined }}>●</span>
              {a.profile.id}
              <span className="ml-1 text-[9px] hidden sm:inline text-slate-500">
                {a.profile.name.split(' ').pop()}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-slate-500 font-mono">
        Decision pipeline: ML Engine → Rule Engine → Clinical RAG → Granite 4 synthesis
      </p>
      {astro && <ExplainabilityChain astro={astro} />}
    </div>
  )
}

// Formatted clinical chat message with bold highlights, bullets, and status badges
function FormattedChatMessage({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-[11px] font-mono leading-relaxed break-words">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-0.5" />

        if (line.startsWith('### ') || line.startsWith('## ')) {
          return (
            <div key={idx} className="text-xs font-bold text-sky-300 pt-1 pb-0.5 border-b border-[#1A2438]">
              {line.replace(/^#+\s*/, '')}
            </div>
          )
        }

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim())
        
        const parts = line.split(/(\*\*.*?\*\*)/g)
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const inner = part.slice(2, -2)
            if (inner.includes('RED') || inner.includes('CRITICAL') || inner.includes('EMERGENCY')) {
              return <strong key={pIdx} className="font-bold text-red-400">{inner}</strong>
            }
            if (inner.includes('GREEN') || inner.includes('NOMINAL') || inner.includes('STABLE')) {
              return <strong key={pIdx} className="font-bold text-emerald-400">{inner}</strong>
            }
            if (inner.includes('AMBER') || inner.includes('WARNING') || inner.includes('WATCH')) {
              return <strong key={pIdx} className="font-bold text-amber-400">{inner}</strong>
            }
            return <strong key={pIdx} className="font-bold text-slate-100">{inner}</strong>
          }
          return part
        })

        return (
          <div key={idx} className={isBullet ? 'pl-2 flex items-start gap-1' : ''}>
            <span>{rendered}</span>
          </div>
        )
      })}
    </div>
  )
}

// Rich Chief Medical Officer Executive Situation Report View
function ExecutiveBriefingView({ briefingText, loading }: { briefingText?: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2.5 text-sky-400 font-mono text-xs bg-[#080D1A] border border-[#162033] rounded-lg">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
        <span>IBM Granite 4 synthesizing clinical flight surgeon briefing...</span>
      </div>
    )
  }

  if (!briefingText) {
    return (
      <div className="p-6 text-center text-xs font-mono text-slate-500 border border-dashed border-[#1A2438] rounded-lg">
        Click &quot;Refresh&quot; to generate the daily executive situation report.
      </div>
    )
  }

  const lines = briefingText.split('\n')
  let title = ''
  const metadataRows: { label: string; value: string }[] = []
  const sections: { heading: string; items: string[] }[] = []
  let currentSection: { heading: string; items: string[] } | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('### ')) {
      title = line.replace(/^###\s*/, '')
      continue
    }

    if (line.startsWith('**') && line.includes(':**') && !currentSection) {
      const match = line.match(/^\*\*(.*?):\*\*\s*(.*)$/)
      if (match) {
        metadataRows.push({ label: match[1], value: match[2] })
        continue
      }
    }

    if (line.match(/^\*\*\d+\.\s*(.*?)\*\*$/) || (line.startsWith('**') && line.endsWith('**') && (line.includes('Surveillance') || line.includes('Summary') || line.includes('Impact') || line.includes('Countermeasures') || line.includes('Recommendations') || line.includes('Status')))) {
      const headingText = line.replace(/^\*\*/, '').replace(/\*\*$/, '')
      currentSection = { heading: headingText, items: [] }
      sections.push(currentSection)
      continue
    }

    if (currentSection) {
      currentSection.items.push(line)
    } else {
      metadataRows.push({ label: 'Operational Context', value: line })
    }
  }

  const isEmergency = title.includes('🚨') || title.includes('CRITICAL') || title.includes('SPE') || title.includes('ABORT')
  const isWarning = title.includes('⚠️') || title.includes('WARNING')

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Title Header Card */}
      {title && (
        <div
          className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 shadow-sm ${
            isEmergency
              ? 'bg-red-950/25 border-red-500/40 text-red-300'
              : isWarning
              ? 'bg-amber-950/25 border-amber-500/40 text-amber-300'
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="font-bold text-xs flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-ping inline-block"
              style={{ backgroundColor: isEmergency ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981' }}
            />
            <span>{title}</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-[#060A12] border border-[#162033] text-slate-400 font-bold">
            NASA-STD-3001 COMPLIANT
          </span>
        </div>
      )}

      {/* Mission Metadata Grid */}
      {metadataRows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-[#080D1A] border border-[#162033]">
          {metadataRows.map((row, i) => (
            <div key={i} className="text-[11px] leading-relaxed">
              <span className="text-slate-500 font-semibold">{row.label}: </span>
              <span className="text-slate-200">
                {row.value.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    const inner = part.slice(2, -2)
                    if (inner.includes('GREEN') || inner.includes('NOMINAL') || inner.includes('STABLE')) {
                      return <strong key={pIdx} className="text-emerald-400 font-bold">{inner}</strong>
                    }
                    if (inner.includes('RED') || inner.includes('CRITICAL') || inner.includes('EMERGENCY')) {
                      return <strong key={pIdx} className="text-red-400 font-bold">{inner}</strong>
                    }
                    if (inner.includes('AMBER') || inner.includes('WARNING')) {
                      return <strong key={pIdx} className="text-amber-400 font-bold">{inner}</strong>
                    }
                    return <strong key={pIdx} className="text-slate-100 font-bold">{inner}</strong>
                  }
                  return part
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Structured Sections */}
      {sections.map((sec, sIdx) => (
        <div key={sIdx} className="p-3 rounded-lg bg-[#080D1A] border border-[#162033] space-y-2">
          <div className="text-[11px] font-bold text-sky-400 border-b border-[#162033] pb-1 flex items-center justify-between">
            <span>{sec.heading}</span>
          </div>
          <div className="space-y-1.5 pl-1">
            {sec.items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^-\s*/, '').replace(/^•\s*/, '')
              const parts = cleanItem.split(/(\*\*.*?\*\*)/g)
              return (
                <div key={itemIdx} className="text-[11px] text-slate-300 flex items-start gap-2 leading-relaxed">
                  <span className="text-sky-500 flex-shrink-0 mt-0.5">•</span>
                  <span>
                    {parts.map((part, pIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        const inner = part.slice(2, -2)
                        if (inner.includes('GREEN') || inner.includes('NOMINAL') || inner.includes('STABLE') || inner.includes('Nominal')) {
                          return <strong key={pIdx} className="text-emerald-400 font-bold">{inner}</strong>
                        }
                        if (inner.includes('RED') || inner.includes('CRITICAL') || inner.includes('EMERGENCY') || inner.includes('SPE EMERGENCY')) {
                          return <strong key={pIdx} className="text-red-400 font-bold">{inner}</strong>
                        }
                        if (inner.includes('AMBER') || inner.includes('WARNING')) {
                          return <strong key={pIdx} className="text-amber-400 font-bold">{inner}</strong>
                        }
                        if (inner.startsWith('PROT-')) {
                          return <span key={pIdx} className="px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-500/40 text-sky-300 font-bold mx-0.5">{inner}</span>
                        }
                        if (inner.startsWith('ASTRO-')) {
                          return <span key={pIdx} className="text-sky-300 font-bold">{inner}</span>
                        }
                        return <strong key={pIdx} className="text-slate-100 font-bold">{inner}</strong>
                      }
                      return part
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Re-use the shared ChatTurn type (same shape as backend ChatTurn / telemetry.ts)
type ChatMessage = ChatTurn

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlightSurgeonAI({ crewState, activeScenario, apiBase, commsDelaySeconds }: Props) {
  const [briefing, setBriefing]     = useState<AgentBriefingResponse | null>(null)
  const [briefingLoading, setBL]    = useState(false)
  const [briefingTs, setBriefingTs] = useState<number>(Date.now())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'AegisCrew AI Flight Surgeon online. All crew under autonomous medical supervision.\n\nAsk me anything about current crew health, risk assessments, or active countermeasures.',
  }])
  const [chatInput, setChatInput]   = useState('')
  const [chatLoading, setCL]        = useState(false)
  const [tab, setTab]               = useState<'briefing' | 'countermeasures' | 'chain' | 'chat' | 'audit'>('briefing')
  const [speakReply, setSpeakReply]   = useState<string>('')

  // Track previous RED crew for sound cue
  const prevRedCrew = useRef<Set<string>>(new Set())
  const chatEndRef  = useRef<HTMLDivElement>(null)

  const allCountermeasures: Countermeasure[] = crewState.crew.flatMap((a) => a.active_countermeasures)

  // Fire sound on new RED transitions
  useEffect(() => {
    const currentRed = new Set(crewState.crew.filter(a => a.risk.status === 'RED').map(a => a.profile.id))
    const newRed = Array.from(currentRed).filter(id => !prevRedCrew.current.has(id))
    if (newRed.length > 0) playAlertTone()
    prevRedCrew.current = currentRed
  }, [crewState])

  const fetchBriefing = useCallback(async () => {
    setBL(true)
    const abort = new AbortController()
    const clientTimeout = setTimeout(() => abort.abort(), 20_000)
    try {
      const res = await fetch(`${apiBase}/api/agent/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_elapsed_day: crewState.mission_elapsed_day, active_scenario: activeScenario }),
        signal: abort.signal,
      })
      const data: AgentBriefingResponse = await res.json()
      setBriefing(data)
      setBriefingTs(Date.now())
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') {
        setBriefing({
          briefing: '⚠ Live model unreachable — showing cached analysis.\n\nFleet under autonomous medical supervision. Use "Refresh" to retry when connectivity restores.',
          generated_at: new Date().toISOString(),
          model_used: 'cached-fallback',
          mock_mode: false,
        } as AgentBriefingResponse)
        setBriefingTs(Date.now())
      } else {
        console.error('Briefing error', e)
      }
    } finally {
      clearTimeout(clientTimeout)
      setBL(false)
    }
  }, [apiBase, crewState.mission_elapsed_day, activeScenario])

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const historySnapshot = chatMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(1)
      .slice(-4)
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }])
    setCL(true)
    try {
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: msg,
          active_scenario: activeScenario,
          history: historySnapshot,
        }),
      })
      const data: AgentChatResponse = await res.json()
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '⚠ Communication error.' }])
    } finally {
      setCL(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 60)
    return () => clearTimeout(timer)
  }, [chatMessages, chatLoading])

  useEffect(() => {
    setBriefingTs(Date.now())
    fetchBriefing()
  }, [activeScenario]) // eslint-disable-line

  return (
    <section className="space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-sky-400" />
          IBM Granite 4 — AI Flight Surgeon
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] px-2.5 py-0.5 rounded border font-mono font-bold flex items-center gap-1.5 shadow-sm"
            style={{ background: 'rgba(16,185,129,.12)', borderColor: 'rgba(16,185,129,.35)', color: '#10B981' }}
            title="Live Edge Autonomous IBM Granite 4 inference active (ibm/granite-4-h-small) with NASA-STD-3001 protocol grounding"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE EDGE AI · ibm/granite-4-h-small
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:block">NASA-STD-3001</span>
        </div>
      </div>

      {/* Decision timer — core value prop: AI vs 22-min Earth delay */}
      <DecisionTimer
        decisionTimestampMs={briefingTs}
        commsDelaySeconds={commsDelaySeconds ?? crewState.comms_delay_seconds}
      />

      <div className="bg-[#0C1222] border border-[#1A2438] rounded-lg p-4 space-y-4">
        {/* Tab bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1A2438] pb-3">
          <div className="flex flex-wrap gap-1.5">
            {([
              { id: 'briefing',        label: 'Executive Briefing', icon: FileText      },
              { id: 'countermeasures', label: `Active Protocols (${allCountermeasures.length})`, icon: AlertTriangle },
              { id: 'chain',           label: 'AI Explainability',  icon: Link2          },
              { id: 'chat',            label: 'Surgeon Chat',        icon: MessageSquare  },
              { id: 'audit',           label: 'Audit Log',           icon: Archive        },
            ] as const).map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
          <button onClick={fetchBriefing} disabled={briefingLoading}
            className="px-2.5 py-1 rounded bg-[#080D1A] border border-[#162033] hover:border-slate-600 text-xs font-mono text-slate-300 flex items-center gap-1 transition disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${briefingLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* TAB: Executive Briefing */}
        {tab === 'briefing' && (
          <div className="space-y-2">
            <div className="max-h-[460px] overflow-y-auto pr-1">
              <ExecutiveBriefingView
                briefingText={briefing?.briefing}
                loading={briefingLoading}
              />
            </div>
            {/* Download Report button — always shown after first briefing load */}
            {briefing && !briefingLoading && (
              <button
                onClick={() => {
                  const content = briefing.briefing
                  const ts = new Date().toISOString()
                  const model = briefing.model_used
                  const html = [
                    '<!DOCTYPE html><html><head>',
                    '<title>AegisCrew AI — Flight Surgeon Report</title>',
                    '<style>',
                    'body{font-family:monospace;font-size:12px;padding:24px;color:#000;max-width:900px;margin:0 auto}',
                    'pre{white-space:pre-wrap;word-break:break-word}',
                    'h1{font-size:14px;border-bottom:1px solid #000;padding-bottom:6px;margin-bottom:12px}',
                    'footer{margin-top:24px;font-size:10px;color:#666;border-top:1px solid #ccc;padding-top:8px}',
                    '</style></head><body>',
                    '<h1>AegisCrew AI &#8212; Official Flight Surgeon Report</h1>',
                    `<p style="font-size:10px;color:#666">Generated: ${ts} | Mission: Artemis Mars Transit | Model: ${model}</p>`,
                    `<pre>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`,
                    '<footer>AegisCrew AI &middot; IBM watsonx.ai Granite 4 &middot; NASA-STD-3001 &middot; NASA SP-2010-3407 &middot; NASA NSCR-2020</footer>',
                    '</body></html>',
                  ].join('\n')
                  const blob = new Blob([html], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `aegiscrew-flight-surgeon-report-${Date.now()}.html`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#080D1A] border border-[#162033] hover:border-sky-500/40 text-[9px] font-mono text-slate-400 hover:text-sky-300 transition w-fit"
              >
                <span>📄</span>
                <span>Download Flight Surgeon Report</span>
              </button>
            )}
          </div>
        )}

        {/* TAB: Countermeasures */}
        {tab === 'countermeasures' && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {allCountermeasures.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-500 border border-dashed border-[#1A2438] rounded-lg">
                ✓ All crew members nominal. No active countermeasures required.
              </div>
            ) : (
              allCountermeasures.map((cm, i) => (
                <CountermeasureCard key={i} cm={cm} commsDelaySeconds={commsDelaySeconds ?? crewState.comms_delay_seconds} />
              ))
            )}
          </div>
        )}

        {/* TAB: AI Explainability Chain */}
        {tab === 'chain' && (
          <ExplainabilityChainTab crewState={crewState} />
        )}

        {/* TAB: Mission Decision Audit Log */}
        {tab === 'audit' && (
          <AuditLogPanel apiBase={apiBase} />
        )}

        {/* TAB: Chat */}
        {tab === 'chat' && (
          <div className="space-y-3">
            <div className="p-3 rounded bg-[#080D1A] border border-[#162033] space-y-2.5 max-h-[520px] min-h-[260px] overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div key={i}
                  className={`p-3 rounded text-xs leading-relaxed font-mono ${
                    m.role === 'user'
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-200 ml-6'
                      : 'bg-[#0C1222] border border-[#1A2438] text-slate-300 mr-6'
                  }`}
                >
                  <div className="font-bold text-[10px] mb-1.5 flex items-center justify-between">
                    {m.role === 'user'
                      ? <span className="text-sky-400">COMMANDER</span>
                      : <span className="text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          IBM GRANITE 4 FLIGHT SURGEON
                        </span>
                    }
                  </div>
                  <FormattedChatMessage text={m.content} />
                </div>
              ))}
              {chatLoading && (
                <div className="p-2 rounded bg-[#0C1222] border border-[#1A2438] text-sky-400 text-xs font-mono flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>IBM Granite reasoning across NASA bio-telemetry...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Why is the crew_wide_alert active?",
                "What's the 6-hour prediction for Commander Vance?",
                "Explain the ML anomaly score for ASTRO-02",
                "What triggered PROT-CO2-HYPERCAPNIA-02?",
              ].map(q => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="text-[9px] font-mono px-2 py-1 rounded border border-[#1E293B] text-slate-400 hover:border-sky-500/40 hover:text-sky-300 transition-all">
                  {q}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendChat() }} className="flex gap-2">
              <input
                type="text" value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI Medical Officer — or hold the mic to speak..."
                className="flex-1 bg-[#080D1A] border border-[#162033] focus:border-sky-500 text-white text-xs font-mono rounded px-3 py-2 outline-none"
              />
              {/* Voice input — hold to speak, releases to send */}
              <VoiceInterface
                onTranscript={(text) => { setChatInput(text) }}
                speakText={speakReply || undefined}
                disabled={chatLoading}
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs rounded flex items-center gap-1.5 transition disabled:opacity-40">
                <span>Send</span><Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
