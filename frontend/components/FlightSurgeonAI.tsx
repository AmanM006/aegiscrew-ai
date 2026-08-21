'use client'

import { useState, useRef, useEffect } from 'react'
import type {
  CrewStateResponse, AgentBriefingResponse, AgentChatResponse, Countermeasure,
} from '@/types/telemetry'
import { BrainCircuit, RefreshCw, Send, Sparkles, Stethoscope, CheckCircle2, MessageSquare, FileText, AlertTriangle } from 'lucide-react'

interface Props {
  crewState: CrewStateResponse
  activeScenario: string
  apiBase: string
}

const URGENCY_COLOR: Record<string, string> = {
  IMMEDIATE: '#EF4444',
  URGENT:    '#F59E0B',
  PRIORITY:  '#00F0FF',
  ROUTINE:   '#10B981',
}

function CountermeasureCard({ cm }: { cm: Countermeasure }) {
  const [approved, setApproved] = useState(false)
  const color = URGENCY_COLOR[cm.urgency] || '#6B7280'
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2.5 transition-all bg-[#070D1F]/90"
      style={{
        borderColor: approved ? '#10B98160' : color + '44',
        boxShadow:   approved ? '0 0 15px rgba(16,185,129,0.15)' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-orbitron font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: color + '20', color }}
          >
            {cm.urgency}
          </span>
          <span className="text-[10px] text-[#64748B] font-mono">[{cm.protocol_id}]</span>
        </div>
        <button
          onClick={() => setApproved((a) => !a)}
          className="text-xs font-orbitron font-semibold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5"
          style={
            approved
              ? { borderColor: '#10B981', background: '#10B98125', color: '#10B981' }
              : { borderColor: '#1E293B', background: '#0F172A', color: '#94A3B8' }
          }
        >
          {approved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
          <span>{approved ? 'Protocol Approved' : 'Approve Protocol'}</span>
        </button>
      </div>

      <div className="text-sm font-orbitron font-bold text-white tracking-wide">{cm.title}</div>
      <div className="text-xs text-[#94A3B8] font-sans leading-relaxed">{cm.clinical_action}</div>

      {cm.operational_impact && (
        <div className="text-xs text-[#F59E0B] font-mono flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{cm.operational_impact}</span>
        </div>
      )}

      {cm.citations.length > 0 && (
        <div className="text-[10px] text-[#64748B] font-mono pt-1 border-t border-[#1E293B]">
          NASA Citations: {cm.citations.join(' · ')}
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
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-orbitron font-bold text-white uppercase tracking-widest flex items-center gap-2.5">
          <BrainCircuit className="w-5 h-5 text-[#00F0FF] animate-pulse" />
          <span>IBM Granite 3.0 — AI Flight Surgeon</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#64748B] font-mono hidden sm:block">ibm/granite-3-8b-instruct</span>
          {briefing?.mock_mode && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono font-semibold">
              MOCK MODE
            </span>
          )}
        </div>
      </div>

      <div className="bg-[#0A0F1E] border border-[#1E293B] rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
          <div className="flex gap-2">
            {[
              { id: 'briefing',        label: 'Executive Briefing', icon: FileText },
              { id: 'countermeasures', label: `Active Protocols (${allCountermeasures.length})`, icon: Stethoscope },
              { id: 'chat',            label: 'Interactive Clinical Chat', icon: MessageSquare },
            ].map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#00F0FF]/15 border border-[#00F0FF] text-[#00F0FF] shadow-neon-cyan'
                      : 'bg-[#070D1F] border border-[#1E293B] text-[#64748B] hover:text-white hover:border-[#475569]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={fetchBriefing}
            disabled={briefingLoading}
            className="px-3.5 py-1.5 rounded-lg bg-[#070D1F] border border-[#1E293B] hover:border-[#00F0FF] text-xs font-orbitron text-[#00F0FF] flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Briefing</span>
          </button>
        </div>

        {/* Tab 1 — Executive Briefing */}
        {tab === 'briefing' && (
          <div className="p-5 rounded-xl bg-[#040814] border border-[#1E293B] text-xs font-mono leading-relaxed text-[#CBD5E1] whitespace-pre-wrap max-h-[450px] overflow-y-auto">
            {briefingLoading ? (
              <div className="flex items-center gap-2 text-[#00F0FF] animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>IBM Granite 3.0 synthesizing multi-modal clinical flight briefing...</span>
              </div>
            ) : (
              briefing?.briefing || 'No briefing available.'
            )}
          </div>
        )}

        {/* Tab 2 — Countermeasures */}
        {tab === 'countermeasures' && (
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {allCountermeasures.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#64748B] border border-dashed border-[#1E293B] rounded-xl">
                ✓ All crew members nominal. No active medical countermeasures required.
              </div>
            ) : (
              allCountermeasures.map((cm, i) => <CountermeasureCard key={i} cm={cm} />)
            )}
          </div>
        )}

        {/* Tab 3 — Interactive Chat Console */}
        {tab === 'chat' && (
          <div className="space-y-4">
            {/* Messages Stream */}
            <div className="p-4 rounded-xl bg-[#040814] border border-[#1E293B] space-y-3 max-h-[350px] overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl text-xs leading-relaxed font-mono ${
                    m.role === 'user'
                      ? 'bg-blue-950/40 border border-blue-500/40 text-blue-200 ml-8'
                      : 'bg-[#0B1528] border border-[#00F0FF]/30 text-[#E2E8F0] mr-8'
                  }`}
                >
                  <div className="font-orbitron font-bold text-[10px] mb-1.5 flex items-center gap-1.5">
                    {m.role === 'user' ? (
                      <span className="text-blue-400">MISSION COMMANDER</span>
                    ) : (
                      <span className="text-[#00F0FF] flex items-center gap-1">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>IBM GRANITE 3.0 FLIGHT SURGEON</span>
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 rounded-xl bg-[#0B1528] border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>IBM Granite 3.0 reasoning across NASA bio-telemetry...</span>
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
                placeholder="Ask the AI Medical Officer (e.g. 'Explain why Mark Jensen was flagged for EVA hold')..."
                className="flex-1 bg-[#040814] border border-[#1E293B] focus:border-[#00F0FF] text-white text-xs font-mono rounded-xl px-4 py-3 outline-none transition shadow-inner"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-5 py-3 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF] text-[#00F0FF] font-orbitron font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-40 shadow-neon-cyan"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
