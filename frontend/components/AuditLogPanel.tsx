'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AuditEntry, AuditLogResponse } from '@/types/telemetry'
import { Download, Database, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  apiBase: string
  /** If true the panel refreshes on the same 10s polling cycle as crew status */
  pollIntervalMs?: number
}

// Icon + colour per event type (matches backend EVENT_* constants)
const EVENT_META: Record<string, { icon: string; color: string; label: string }> = {
  SCENARIO_TRIGGERED:     { icon: '⚡', color: '#F59E0B', label: 'Scenario'      },
  COUNTERMEASURE_PRESCRIBED:{ icon: '💊', color: '#38BDF8', label: 'Countermeasure'},
  CREW_WIDE_ALERT:        { icon: '🚨', color: '#EF4444', label: 'Fleet Alert'   },
  BRIEFING_GENERATED:     { icon: '📋', color: '#10B981', label: 'Briefing'      },
  ANOMALY_DETECTED:       { icon: '⚠', color: '#F59E0B', label: 'Anomaly'       },
  TIMEOUT_FALLBACK:       { icon: '⏱', color: '#6B7280', label: 'Timeout'       },
}

function fmtTs(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return iso }
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
  } catch { return '' }
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const meta = EVENT_META[entry.event_type] ?? { icon: '•', color: '#6B7280', label: entry.event_type }

  return (
    <div
      className="border-b border-[#1A2438] last:border-0 cursor-pointer hover:bg-[#0D1525] transition-colors"
      onClick={() => setExpanded(e => !e)}
    >
      {/* Main row */}
      <div className="flex items-start gap-2 px-3 py-2 text-[10px] font-mono">
        {/* Icon + seq */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5 w-8 mt-0.5">
          <span className="text-[13px] leading-none">{meta.icon}</span>
          <span className="text-[8px] text-slate-700">#{entry.sequence}</span>
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 w-16 text-slate-600">
          <div>{fmtTs(entry.timestamp)}</div>
          <div className="text-[8px]">{fmtDate(entry.timestamp)}</div>
        </div>

        {/* Event type badge */}
        <div className="flex-shrink-0 w-20">
          <span
            className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
            style={{ background: meta.color + '20', color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {/* Crew ID */}
        <div className="flex-shrink-0 w-16 text-slate-500 text-[9px] font-mono mt-0.5">
          {entry.astronaut_id}
        </div>

        {/* Summary */}
        <div className="flex-1 text-slate-300 text-[10px] leading-snug pr-2">
          {entry.summary}
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 text-slate-600 mt-0.5">
          {expanded
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />
          }
        </div>
      </div>

      {/* Expanded: raw data snapshot */}
      {expanded && (
        <div className="mx-3 mb-2 px-2 py-2 rounded bg-[#060A12] border border-[#162033] text-[9px] font-mono text-slate-500 whitespace-pre-wrap break-all">
          {JSON.stringify(entry.data_snapshot, null, 2)}
        </div>
      )}
    </div>
  )
}

export default function AuditLogPanel({ apiBase, pollIntervalMs = 10_000 }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [totalLogged, setTotalLogged] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchLog = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/audit/log?limit=100`)
      if (!res.ok) return
      const data: AuditLogResponse = await res.json()
      setEntries(data.entries)
      setTotalLogged(data.total_logged)
      setLastFetch(new Date())
    } catch (e) {
      console.error('Audit log fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  // Initial load + polling
  useEffect(() => {
    fetchLog()
    const id = setInterval(fetchLog, pollIntervalMs)
    return () => clearInterval(id)
  }, [fetchLog, pollIntervalMs])

  const handleExport = async () => {
    try {
      const res = await fetch(`${apiBase}/api/audit/export`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aegiscrew-audit-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export error', e)
    }
  }

  return (
    <div className="bg-[#0C1222] border border-[#1A2438] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1A2438] bg-[#080D1A]">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
            Mission Decision Audit Log
          </span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            NASA-HDBK-2203 · Black Box Recorder
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-[8px] text-slate-600 font-mono hidden sm:block">
              updated {lastFetch.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          )}
          <span className="text-[9px] font-mono text-slate-500">
            {totalLogged} total
          </span>
          <button
            onClick={fetchLog}
            disabled={loading}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
            title="Refresh audit log"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#1A2438] hover:border-sky-500/40 text-[9px] font-mono text-slate-400 hover:text-sky-300 transition"
            title="Export full audit log as JSON"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export Log (JSON)</span>
          </button>
        </div>
      </div>

      {/* Description line */}
      <div className="px-3 py-1.5 bg-[#060A12] border-b border-[#1A2438] text-[8px] font-mono text-slate-600">
        Every autonomous AI action is logged here — scenario triggers, countermeasure prescriptions, fleet alerts, briefing generation.
        Meets NASA-HDBK-2203 auditability requirements for human-rated autonomous systems.
      </div>

      {/* Entries */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-[#1A2438]">
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-[10px] font-mono text-slate-600">
            {loading
              ? 'Loading audit trail...'
              : 'No entries yet. Trigger a scenario or generate a briefing to populate the log.'}
          </div>
        ) : (
          entries.map((entry) => (
            <AuditRow key={entry.sequence} entry={entry} />
          ))
        )}
      </div>
    </div>
  )
}
