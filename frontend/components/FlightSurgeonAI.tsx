'use client'

import { useState, useRef, useEffect } from 'react'
import type {
  CrewStateResponse, AgentBriefingResponse, AgentChatResponse, Countermeasure,
} from '@/types/telemetry'
import { BrainCircuit, RefreshCw, Send, CheckCircle2, MessageSquare, FileText, AlertTriangle } from 'lucide-react'

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

function CountermeasureCard({ cm }: { cm: Countermeasure }) {
  const [approved, setApproved] = useState(false)
  const color = URGENCY_COLOR[cm.urgency] || '#64748B'
  return (
    <div
      className="rounded-lg border p-3.5 flex flex-col gap-2 transition-colors bg-[#080D1A]"
      style={{
        borderColor: approved ? '#10B98150' : color + '30',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: color + '15', color }}
          >
            {cm.urgency}
          </span>
          <span className="text-[9px] text-slate-500 font-mono">[{cm.protocol_id}]</span>
        </div>
        <button
          onClick={() => setApproved((a) => !a)}
          className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border transition-colors flex items-center gap-1"
          style={
            approved
              ? { borderColor: '#10B981', background: '#10B98120', color: '#10B981' }
              : { borderColor: '#1E293B', background: '#0C1222', color: '#94A3B8' }
          }
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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function FlightSurgeonAI({ crewState, activeScenario, apiBase }: Props) {
  const [briefing, setBriefing]       = useState<AgentBriefingResponse | null>(null)
  const [briefingLoading, setBL]      = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'AegisCrew AI Flight Surgeon online. All crew under autonomous medical supervision. Ask me anything about current crew health, risk assessments, or active countermeasures.' },
  ])
  const [chatInput, setChatInput]     = useState('')
  const [chatLoading, setCL]          = useState(false)
  const [tab, setTab]                 = useState<'briefing' | 'countermeasures' | 'chat'>('briefing')
  const chatEndRef                    = useRef<HTMLDivElement>(null)

  const allCountermeasures: Countermeasure[] = crewState.crew.flatMap((a) => a.active_countermeasures)

  const fetchBriefing = async () => {
    setBL(true)
    try {
      const res = await fetch(`${apiBase}/api/agent/briefing`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mission_elapsed_day: crewState.mission_elapsed_day, active_scenario: activeScenario }),
      })
      const data: AgentBriefingResponse = await res.json()
      setBriefing(data)
    } catch (e) {
      console.error('Briefing error', e)
    } finally {
      setBL(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }])
    setCL(true)
    try {
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_message: msg, active_scenario: activeScenario }),
      })
      const data: AgentChatResponse = await res.json()
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '⚠ Communication error. Check API connection.' }])
    } finally {
      setCL(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    fetchBriefing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenario])

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-sky-400" />
          <span>IBM Granite 3.0 — AI Flight Surgeon</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:block">ibm/granite-3-8b-instruct</span>
          {briefing?.mock_mode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30 font-mono font-semibold">
              MOCK MODE
            </span>
          )}
        </div>
      </div>

      <div className="bg-[#0C1222] border border-[#1A2438] rounded-lg p-4 space-y-4">
        {/* Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1A2438] pb-3">
          <div className="flex gap-1.5">
            {[
              { id: 'briefing',        label: 'Executive Briefing', icon: FileText },
              { id: 'countermeasures', label: `Active Protocols (${allCountermeasures.length})`, icon: AlertTriangle },
              { id: 'chat',            label: 'Flight Surgeon Chat', icon: MessageSquare },
            ].map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 border border-slate-700 text-slate-100'
                      : 'bg-[#080D1A] border border-[#162033] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={fetchBriefing}
            disabled={briefingLoading}
            className="px-2.5 py-1 rounded bg-[#080D1A] border border-[#162033] hover:border-slate-600 text-xs font-mono text-slate-300 flex items-center gap-1 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${briefingLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab 1 — Executive Briefing */}
        {tab === 'briefing' && (
          <div className="p-3.5 rounded bg-[#080D1A] border border-[#162033] text-xs font-mono leading-relaxed text-slate-300 whitespace-pre-wrap max-h-[420px] overflow-y-auto">
            {briefingLoading ? (
              <div className="flex items-center gap-1.5 text-sky-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>IBM Granite 3.0 synthesizing clinical briefing...</span>
              </div>
            ) : (
              briefing?.briefing || 'No briefing available.'
            )}
          </div>
        )}

        {/* Tab 2 — Countermeasures */}
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

        {/* Tab 3 — Interactive Chat Console */}
        {tab === 'chat' && (
          <div className="space-y-3">
            {/* Messages Stream */}
            <div className="p-3 rounded bg-[#080D1A] border border-[#162033] space-y-2.5 max-h-[320px] overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded text-xs leading-relaxed font-mono ${
                    m.role === 'user'
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-200 ml-6'
                      : 'bg-[#0C1222] border border-[#1A2438] text-slate-300 mr-6'
                  }`}
                >
                  <div className="font-bold text-[10px] mb-1">
                    {m.role === 'user' ? (
                      <span className="text-sky-400">COMMANDER</span>
                    ) : (
                      <span className="text-slate-400">IBM GRANITE 3.0 FLIGHT SURGEON</span>
                    )}
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

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendChat()
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI Medical Officer (e.g. 'Explain why Mark Jensen was flagged for EVA hold')..."
                className="flex-1 bg-[#080D1A] border border-[#162033] focus:border-sky-500 text-white text-xs font-mono rounded px-3 py-2 outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs rounded flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
