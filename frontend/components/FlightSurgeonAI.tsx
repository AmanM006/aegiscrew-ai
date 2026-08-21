'use client'

import { useState, useRef, useEffect } from 'react'
import type {
  CrewStateResponse, AgentBriefingResponse, AgentChatResponse, Countermeasure,
} from '@/types/telemetry'

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
      className="rounded-lg border p-3 flex flex-col gap-2 transition-all"
      style={{
        borderColor: approved ? '#10B98155' : color + '44',
        background:  approved ? '#10B98110' : color + '08',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: color + '20', color }}
          >
            {cm.urgency}
          </span>
          <span className="text-[9px] text-[#6B7280] ml-1.5 font-mono">[{cm.protocol_id}]</span>
        </div>
        <button
          onClick={() => setApproved(a => !a)}
          className="text-[9px] font-mono px-2 py-0.5 rounded border transition-all flex-shrink-0"
          style={approved ? { borderColor: '#10B98155', background: '#10B98120', color: '#10B981' }
                          : { borderColor: '#1F2D45', background: '#1A2236', color: '#6B7280' }}
        >
          {approved ? '✓ Approved' : 'Approve Protocol'}
        </button>
      </div>
      <div className="text-xs font-semibold text-white leading-tight">{cm.title}</div>
      <div className="text-[10px] text-[#9CA3AF] leading-relaxed">{cm.clinical_action}</div>
      {cm.operational_impact && (
        <div className="text-[10px] text-[#F59E0B] font-mono">⚡ {cm.operational_impact}</div>
      )}
      {cm.citations.length > 0 && (
        <div className="text-[9px] text-[#6B7280] font-mono">
          {cm.citations.join(' · ')}
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

  const allCountermeasures: Countermeasure[] = crewState.crew.flatMap(a => a.active_countermeasures)

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
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setCL(true)
    try {
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_message: msg, active_scenario: activeScenario }),
      })
      const data: AgentChatResponse = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠ Communication error. Check API connection.' }])
    } finally {
      setCL(false)
    }
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Auto-fetch briefing on scenario change
  useEffect(() => {
    fetchBriefing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenario])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          IBM Granite 3.0 — AI Flight Surgeon
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6B7280] font-mono hidden sm:block">ibm/granite-3-8b-instruct</span>
          {briefing?.mock_mode && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono">
              MOCK MODE
            </span>
          )}
        </div>
      </div>

      <div className="mission-card">
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 border-b border-[#1F2D45] pb-3">
          {[
            { id: 'briefing',        label: 'Executive Briefing' },
            { id: 'countermeasures', label: `Countermeasures (${allCountermeasures.length})` },
            { id: 'chat',            label: 'Flight Surgeon Chat' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className="px-3 py-1.5 rounded-t text-xs font-mono font-semibold transition-all"
              style={{
                background:  tab === t.id ? '#00F0FF15' : 'transparent',
                color:       tab === t.id ? '#00F0FF'   : '#6B7280',
                borderBottom: tab === t.id ? '2px solid #00F0FF' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Briefing tab */}
        {tab === 'briefing' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-[#6B7280] font-mono">
                Daily situation report for Commander Elena Vance · Scenario: {activeScenario.toUpperCase()}
              </span>
              <button
                onClick={fetchBriefing}
                disabled={briefingLoading}
                className="text-[10px] font-mono px-3 py-1 rounded border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-all disabled:opacity-50"
              >
                {briefingLoading ? '⟳ Generating...' : '⟳ Refresh Briefing'}
              </button>
            </div>

            {briefingLoading && (
              <div className="flex items-center gap-2 text-[#00F0FF] text-xs font-mono py-8 justify-center">
                <span className="animate-spin">⬡</span> IBM Granite 3.0 synthesizing clinical briefing...
              </div>
            )}

            {briefing && !briefingLoading && (
              <pre className="text-[11px] font-mono text-[#00F0FF]/90 leading-relaxed whitespace-pre-wrap bg-[#0B0F19] rounded-lg p-4 border border-[#1F2D45] max-h-96 overflow-y-auto cursor-blink">
                {briefing.briefing}
              </pre>
            )}

            {!briefing && !briefingLoading && (
              <div className="text-center py-8 text-[#6B7280] text-xs font-mono">
                Click &quot;Refresh Briefing&quot; to generate the daily executive situation report.
              </div>
            )}
          </div>
        )}

        {/* Countermeasures tab */}
        {tab === 'countermeasures' && (
          <div>
            {allCountermeasures.length === 0 ? (
              <div className="text-center py-8 text-[#10B981] text-xs font-mono">
                ✓ No active countermeasures required. All crew nominal.
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-[#6B7280] font-mono mb-3">
                  {allCountermeasures.length} active protocol{allCountermeasures.length !== 1 ? 's' : ''} — NASA SP-2010-3407 grounded.
                  Review and approve each intervention below.
                </p>
                {allCountermeasures.map((cm, i) => (
                  <CountermeasureCard key={`${cm.protocol_id}-${i}`} cm={cm} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat tab */}
        {tab === 'chat' && (
          <div className="flex flex-col gap-3">
            {/* Message history */}
            <div className="bg-[#0B0F19] rounded-lg border border-[#1F2D45] h-72 overflow-y-auto p-3 flex flex-col gap-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <span className="text-[8px] text-[#00F0FF]">AI</span>
                    </div>
                  )}
                  <div
                    className="max-w-[80%] text-[11px] leading-relaxed rounded-lg px-3 py-2 font-mono"
                    style={m.role === 'user'
                      ? { background: '#00F0FF15', border: '1px solid #00F0FF33', color: '#E5E7EB' }
                      : { background: '#1A2236',   border: '1px solid #1F2D45',   color: '#00F0FF' }
                    }
                  >
                    <pre className="whitespace-pre-wrap">{m.content}</pre>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-5 h-5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[8px] text-[#00F0FF]">AI</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#00F0FF]/60 bg-[#1A2236] border border-[#1F2D45] rounded-lg px-3 py-2">
                    <span className="animate-pulse">Analyzing bio-telemetry and clinical protocols...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "What is ASTRO-01's current risk status?",
                "Why is the radiation level elevated?",
                "Explain the CO₂ scrubber override protocol",
                "What are the sleep deprivation countermeasures?",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setChatInput(q) }}
                  className="text-[9px] font-mono px-2 py-1 rounded border border-[#1F2D45] text-[#6B7280] hover:border-[#00F0FF]/30 hover:text-[#00F0FF] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask the AI Flight Surgeon..."
                className="flex-1 bg-[#0B0F19] border border-[#1F2D45] rounded-lg px-3 py-2 text-[11px] font-mono text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:border-[#00F0FF]/50"
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/25 transition-all disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
