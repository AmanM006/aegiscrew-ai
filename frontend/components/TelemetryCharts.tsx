'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import type { AstronautStateResponse, TelemetryFrame } from '@/types/telemetry'

interface Props {
  crew: AstronautStateResponse[]
}

// Map 24-hr history into chart-friendly format for a given metric extractor
function buildTimeSeries(
  frames: TelemetryFrame[],
  crewId: string,
  extractor: (f: TelemetryFrame) => number,
) {
  return frames.map((f, i) => ({
    t: i,
    [crewId]: parseFloat(extractor(f).toFixed(2)),
    ts: f.timestamp_utc,
  }))
}

// Build human-readable time label: index 0 = "-24h", last index = "Now"
function makeTimeLabel(i: number, total: number): string {
  const hoursAgo = Math.round(((total - 1 - i) / (total - 1)) * 24)
  if (hoursAgo === 0) return 'Now'
  return `-${hoursAgo}h`
}

// Merge multi-crew arrays by index position, injecting a timeLabel for X-axis
function mergeCrewSeries(
  crewData: { id: string; frames: TelemetryFrame[] }[],
  extractor: (f: TelemetryFrame) => number,
) {
  const maxLen = Math.max(...crewData.map(c => c.frames.length), 1)
  const merged: Record<string, unknown>[] = Array.from({ length: maxLen }, (_, i) => ({
    t: i,
    timeLabel: makeTimeLabel(i, maxLen),
  }))
  for (const { id, frames } of crewData) {
    frames.forEach((f, i) => {
      if (merged[i]) merged[i][id] = parseFloat(extractor(f).toFixed(2))
    })
  }
  return merged
}

const CREW_COLORS = ['#00F0FF', '#10B981', '#F59E0B', '#8B5CF6']

const TICK_STYLE = { fill: '#6B7280', fontSize: 10 }

interface ChartCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
}
function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="mission-card">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">{title}</h3>
        <p className="text-[10px] text-[#6B7280] mt-0.5">{subtitle}</p>
      </div>
      <div className="h-44">{children}</div>
    </div>
  )
}

export default function TelemetryCharts({ crew }: Props) {
  const crewData = crew.map(a => ({ id: a.profile.id, name: a.profile.name, frames: a.history_24h }))

  const hrvData   = mergeCrewSeries(crewData, f => f.vitals.hrv_rmssd_ms)
  const hrData    = mergeCrewSeries(crewData, f => f.vitals.heart_rate_bpm)
  const sleepData = mergeCrewSeries(crewData, f => f.circadian.sleep_debt_72h_hrs)
  const radData   = mergeCrewSeries(crewData, f => f.radiation.daily_radiation_mgy)
  const co2Data   = mergeCrewSeries(crewData, f => f.atmosphere.cabin_co2_ppm)

  // Per-chart unit suffix — passed as a prop to CustomTooltip
  function CustomTooltip({
    active, payload, label, unit,
  }: {
    active?: boolean
    payload?: { name: string; value: number; color: string }[]
    label?: string
    unit?: string
  }) {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1A2236] border border-[#1F2D45] rounded-lg p-2 text-[10px] font-mono space-y-0.5 shadow-lg">
        {label && (
          <div className="text-[9px] text-slate-500 border-b border-[#1F2D45] pb-1 mb-1">{label}</div>
        )}
        {payload.map(p => {
          const name = crewData.find(c => c.id === p.name)?.name ?? p.name
          const val  = typeof p.value === 'number' ? p.value.toFixed(1) : p.value
          return (
            <div key={p.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span style={{ color: p.color }}>{name}:</span>
              <span className="text-white font-semibold">{val}{unit ?? ''}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          24-Hour Bio-Telemetry Stream
        </h2>
        <span className="text-[10px] text-[#6B7280] font-mono">Real-time · 10s refresh</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* HRV */}
        <ChartCard
          title="HRV RMSSD (ms)"
          subtitle="Autonomic tone — warn below 30 ms (NASA-STD-3001)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrvData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" />
              <XAxis dataKey="timeLabel" tick={TICK_STYLE} tickLine={false} axisLine={false} interval={11} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} domain={[0, 90]} width={28} />
              <Tooltip content={<CustomTooltip unit=" ms" />} />
              <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="4 2" label={{ value: '⚠ 30ms', fill: '#EF4444', fontSize: 9 }} />
              {crewData.map((c, i) => (
                <Line key={c.id} type="monotone" dataKey={c.id} stroke={CREW_COLORS[i]}
                  strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Heart Rate */}
        <ChartCard
          title="Heart Rate (bpm)"
          subtitle="Resting HR — critical above 100 bpm"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" />
              <XAxis dataKey="timeLabel" tick={TICK_STYLE} tickLine={false} axisLine={false} interval={11} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} domain={[40, 140]} width={28} />
              <Tooltip content={<CustomTooltip unit=" bpm" />} />
              <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="4 2" label={{ value: '⚠ 100', fill: '#EF4444', fontSize: 9 }} />
              {crewData.map((c, i) => (
                <Line key={c.id} type="monotone" dataKey={c.id} stroke={CREW_COLORS[i]}
                  strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sleep Debt */}
        <ChartCard
          title="72-hr Sleep Debt (hrs)"
          subtitle="Warning ≥ 4.5 hrs | Critical ≥ 7.0 hrs"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sleepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" />
              <XAxis dataKey="timeLabel" tick={TICK_STYLE} tickLine={false} axisLine={false} interval={11} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} domain={[0, 12]} width={28} />
              <Tooltip content={<CustomTooltip unit=" h" />} />
              <ReferenceLine y={4.5} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: '⚠ 4.5h', fill: '#F59E0B', fontSize: 9 }} />
              <ReferenceLine y={7.0} stroke="#EF4444" strokeDasharray="4 2" label={{ value: '✖ 7h', fill: '#EF4444', fontSize: 9 }} />
              {crewData.map((c, i) => (
                <Line key={c.id} type="monotone" dataKey={c.id} stroke={CREW_COLORS[i]}
                  strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radiation */}
        <ChartCard
          title="Daily Radiation (mGy/day)"
          subtitle="Warning ≥ 5.0 | SPE Emergency ≥ 50.0 mGy/day"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={radData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" />
              <XAxis dataKey="timeLabel" tick={TICK_STYLE} tickLine={false} axisLine={false} interval={11} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={28} />
              <Tooltip content={<CustomTooltip unit=" mGy" />} />
              <ReferenceLine y={5} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: '⚠ 5', fill: '#F59E0B', fontSize: 9 }} />
              <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'SPE 50', fill: '#EF4444', fontSize: 9 }} />
              {crewData.map((c, i) => (
                <Line key={c.id} type="monotone" dataKey={c.id} stroke={CREW_COLORS[i]}
                  strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* CO2 */}
        <ChartCard
          title="Cabin CO₂ (ppm)"
          subtitle="Warning ≥ 4,500 ppm | Critical ≥ 7,000 ppm · ECLSS nominal target < 3,000"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={co2Data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" />
              <XAxis dataKey="timeLabel" tick={TICK_STYLE} tickLine={false} axisLine={false} interval={11} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} domain={[0, 8000]} width={36} />
              <Tooltip content={<CustomTooltip unit=" ppm" />} />
              <ReferenceLine y={3000} stroke="#10B981" strokeDasharray="4 2" label={{ value: '✓ 3000', fill: '#10B981', fontSize: 9 }} />
              <ReferenceLine y={4500} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: '⚠ 4500', fill: '#F59E0B', fontSize: 9 }} />
              {crewData.map((c, i) => (
                <Line key={c.id} type="monotone" dataKey={c.id} stroke={CREW_COLORS[i]}
                  strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Legend card */}
        <ChartCard title="Crew Legend" subtitle="Color-coded digital twin streams">
          <div className="flex flex-col gap-3 justify-center h-full px-2">
            {crewData.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-6 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: CREW_COLORS[i] }} />
                <div>
                  <span className="text-xs font-mono text-white">{c.id}</span>
                  <span className="text-[11px] text-[#6B7280] ml-2">{c.name}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </section>
  )
}
