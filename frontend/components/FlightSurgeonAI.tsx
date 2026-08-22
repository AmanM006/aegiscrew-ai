'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  CrewStateResponse, AgentBriefingResponse, AgentChatResponse,
  Countermeasure, AstronautStateResponse,
} from '@/types/telemetry'
import {
  BrainCircuit, RefreshCw, Send, CheckCircle2,
  MessageSquare, FileText, AlertTriangle, Link2,
} from 'lucide-react'
import DecisionTimer from './DecisionTimer'

interface Props {
  crewState: CrewStateResponse
  activeScenario: string
  apiBase: string
}

const URGENCY_COLOR: Record<string, string> = {
  IMMEDIATE: '#EF4444',
  URGENT:    '#F59E0B',
  PRIORITY:  '#38BDF8',
  ROUTINE:   '#10B981',
}

// ─── Sound cue ────────────────────────────────────────────────────────────────
function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
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

// ─── Countermeasure card ──────────────────────────────────────────────────────
function CountermeasureCard({ cm }: { cm: Countermeasure }) {
  const [approved, setApproved] = useState(false)
  const color = URGENCY_COLOR[cm.urgency] || '#64748B'
  return (
    <div
      className="rounded-lg border p-3.5 flex flex-col gap-2 transition-colors bg-[#080D1A]"
      style={{ borderColor: approved ? '#10B98150' : color + '30' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: color + '15', color }}>{cm.urgency}</span>
          <span className="text-[9px] text-slate-500 font-mono">[{cm.protocol_id}]</span>
        </div>
        <button
          onClick={() => setApproved((a) => !a)}
          className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border transition-colors flex items-center gap-1"
          style={approved
            ? { borderColor: '#10B981', background: '#10B98120', color: '#10B981' }
            : { borderColor: '#1E293B', background: '#0C1222', color: '#94A3B8' }}
        >
          {approved ? <CheckCircle2 className="w-3 h-3" /> : null}
          <span>{approved ? 'Approved' : 'Approve Protocol'}</span>
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
  active: boolean
  last?: boolean
}

function PipelineStage({ color, label, sub, items, active, last }: StageProps) {
  return (
    <div className="flex items-stretch gap-0 flex-1 min-w-0">
      <div className={`flex-1 min-w-0 rounded-lg border p-2.5 transition-colors ${active ? '' : 'opacity-40'}`}
        style={{ borderColor: color + '40', background: color + '08' }}>
        {/* Stage header */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wide" style={{ color }}>{label}</span>
        </div>
        <div className="text-[9px] text-slate-500 font-mono mb-1.5 leading-tight">{sub}</div>
        {/* Items */}
        <div className="space-y-0.5">
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="text-[8px] font-mono text-slate-400 truncate leading-snug">{item}</div>
          ))}
          {items.length === 0 && (
            <div className="text-[8px] font-mono text-slate-600 italic">nominal</div>
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

function ExplainabilityChain({ astro }: { astro: AstronautStateResponse }) {
  const mlFeats   = astro.risk.ml_result?.contributing_features ?? []
  const anomalies = astro.risk.anomalies
  const cms       = astro.active_countermeasures
  const isAnomaly = astro.risk.ml_result?.is_anomaly ?? false
  const mlScore   = astro.risk.ml_anomaly_score

  if (anomalies.length === 0 && mlFeats.length === 0) return null

  // Stage content
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

  return (
    <div className="rounded-lg border border-[#1A2438] bg-[#060B14] p-3 space-y-2">
      {/* Title */}
      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 uppercase tracking-wider">
        <Link2 className="w-3 h-3 text-sky-400" />
        <span>AI Decision Pipeline — {astro.profile.name}</span>
        <span className="ml-auto text-[8px] text-slate-600">ibm/granite-4-h-small</span>
      </div>

      {/* 4-stage horizontal pipeline */}
      <div className="flex items-stretch gap-0">
        <PipelineStage
          color="#A855F7"
          label="ML Engine"
          sub="IsolationForest"
          items={mlItems}
          active={mlFeats.length > 0}
        />
        <PipelineStage
          color="#F59E0B"
          label="Rule Engine"
          sub="NASA-STD-3001 thresholds"
          items={ruleItems}
          active={anomalies.length > 0}
        />
        <PipelineStage
          color="#00F0FF"
          label="Clinical RAG"
          sub="SP-2010-3407 protocols"
          items={ragItems}
          active={ragItems.length > 0}
        />
        <PipelineStage
          color="#10B981"
          label="Granite 4"
          sub="Countermeasure synthesis"
          items={graniteItems}
          active={cms.length > 0}
          last
        />
      </div>
    </div>
  )
}

interface ChatMessage { role: 'user' | 'assistant'; content: string }

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlightSurgeonAI({ crewState, activeScenario, apiBase }: Props) {
  const [briefing, setBriefing]     = useState<AgentBriefingResponse | null>(null)
  const [briefingLoading, setBL]    = useState(false)
  const [briefingTs, setBriefingTs] = useState<number>(Date.now())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'AegisCrew AI Flight Surgeon online. All crew under autonomous medical supervision.\n\nAsk me anything about current crew health, risk assessments, or active countermeasures.',
  }])
  const [chatInput, setChatInput]   = useState('')
  const [chatLoading, setCL]        = useState(false)
  const [tab, setTab]               = useState<'briefing' | 'countermeasures' | 'chain' | 'chat'>('briefing')

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
    try {
      const res = await fetch(`${apiBase}/api/agent/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_elapsed_day: crewState.mission_elapsed_day, active_scenario: activeScenario }),
      })
      const data: AgentBriefingResponse = await res.json()
      setBriefing(data)
      setBriefingTs(Date.now())
    } catch (e) {
      console.error('Briefing error', e)
    } finally {
      setBL(false)
    }
  }, [apiBase, crewState.mission_elapsed_day, activeScenario])

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }])
    setCL(true)
    try {
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: msg, active_scenario: activeScenario }),
      })
      const data: AgentChatResponse = await res.json()
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '⚠ Communication error.' }])
    } finally {
      setCL(false)
    }
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { fetchBriefing() }, [activeScenario]) // eslint-disable-line

  return (
    <section className="space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-sky-400" />
          IBM Granite 4 — AI Flight Surgeon
        </h2>
        <div className="flex items-center gap-2">
          {briefing?.mock_mode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30 font-mono font-semibold">
              MOCK MODE
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono hidden sm:block">ibm/granite-4-h-small</span>
        </div>
      </div>

      {/* Decision timer — core value prop: AI vs 22-min Earth delay */}
      <DecisionTimer
        decisionTimestampMs={briefingTs}
        commsDelaySeconds={crewState.comms_delay_seconds}
      />

      <div className="bg-[#0C1222] border border-[#1A2438] rounded-lg p-4 space-y-4">
        {/* Tab bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1A2438] pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'briefing',        label: 'Executive Briefing', icon: FileText },
              { id: 'countermeasures', label: `Active Protocols (${allCountermeasures.length})`, icon: AlertTriangle },
              { id: 'chain',           label: 'AI Explainability', icon: Link2 },
              { id: 'chat',            label: 'Surgeon Chat', icon: MessageSquare },
            ].map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 border border-slate-700 text-slate-100'
                      : 'bg-[#080D1A] border border-[#162033] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.id === 'countermeasures' ? `Protocols (${allCountermeasures.length})` : t.label.split(' ')[0]}</span>
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
          <div className="p-3.5 rounded bg-[#080D1A] border border-[#162033] text-xs font-mono leading-relaxed text-slate-300 whitespace-pre-wrap max-h-[420px] overflow-y-auto">
            {briefingLoading ? (
              <div className="flex items-center gap-1.5 text-sky-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>IBM Granite 4 synthesizing clinical briefing...</span>
              </div>
            ) : (
              briefing?.briefing || 'Click "Refresh" to generate the daily executive situation report.'
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
              allCountermeasures.map((cm, i) => <CountermeasureCard key={i} cm={cm} />)
            )}
          </div>
        )}

        {/* TAB: AI Explainability Chain */}
        {tab === 'chain' && (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            <p className="text-[10px] text-slate-500 font-mono">
              Tracing the decision pipeline: ML z-scores → threshold rules → Granite 4 prescription, per crew member.
            </p>
            {crewState.crew.map((astro) => (
              <ExplainabilityChain key={astro.profile.id} astro={astro} />
            ))}
          </div>
        )}

        {/* TAB: Chat */}
        {tab === 'chat' && (
          <div className="space-y-3">
            <div className="p-3 rounded bg-[#080D1A] border border-[#162033] space-y-2.5 max-h-[320px] overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div key={i}
                  className={`p-2.5 rounded text-xs leading-relaxed font-mono ${
                    m.role === 'user'
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-200 ml-6'
                      : 'bg-[#0C1222] border border-[#1A2438] text-slate-300 mr-6'
                  }`}
                >
                  <div className="font-bold text-[10px] mb-1">
                    {m.role === 'user'
                      ? <span className="text-sky-400">COMMANDER</span>
                      : <span className="text-slate-400">IBM GRANITE 4 FLIGHT SURGEON</span>
                    }
                  </div>
                  <div className="whitespace-pre-wrap text-[11px]">{m.content}</div>
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
                placeholder="Ask AI Medical Officer (e.g. 'Explain why Mark Jensen was flagged for EVA hold')..."
                className="flex-1 bg-[#080D1A] border border-[#162033] focus:border-sky-500 text-white text-xs font-mono rounded px-3 py-2 outline-none"
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
