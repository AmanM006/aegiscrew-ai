'use client'

import { type TrafficLight } from '@/types/telemetry'
import { useEffect, useState } from 'react'
import { Satellite, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react'

interface HeaderProps {
  missionDay: number
  fleetStatus: TrafficLight
  fleetReadiness: number
  missionName: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function METClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(`${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-slate-300 tabular-nums text-xs">{time}</span>
}

const STATUS_COLOR: Record<TrafficLight, { text: string; bg: string; border: string }> = {
  GREEN: { text: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-500/30' },
  AMBER: { text: 'text-amber-400',   bg: 'bg-amber-950/50',   border: 'border-amber-500/30' },
  RED:   { text: 'text-red-400',     bg: 'bg-red-950/50',     border: 'border-red-500/30' },
}

export default function Header({ missionDay, fleetStatus, fleetReadiness, missionName }: HeaderProps) {
  const statusCfg = STATUS_COLOR[fleetStatus] || STATUS_COLOR.GREEN

  return (
    <header className="bg-[#04060C]/95 backdrop-blur border-b border-[#141E33] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Left — Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm tracking-tight">AEGISCREW</span>
              <span className="font-mono font-semibold text-sky-400 text-sm">AI</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-medium uppercase">IBM BOB 2026</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono leading-tight mt-0.5 truncate">
              {missionName}
            </div>
          </div>
        </div>

        {/* Centre — MET Clock */}
        <div className="hidden md:flex items-center space-x-3 bg-[#080D1A] px-4 py-1.5 rounded border border-[#162033]">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">MET DAY {String(missionDay).padStart(3, '0')}</span>
          <span className="text-slate-600">|</span>
          <METClock />
        </div>

        {/* Right — Fleet Readiness & Badges */}
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Fleet Readiness</div>
            <div className={`text-sm font-bold font-mono ${statusCfg.text} flex items-center gap-1 justify-end mt-0.5`}>
              {fleetStatus === 'RED' ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{fleetReadiness.toFixed(0)}% [{fleetStatus}]</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/40 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] font-mono text-sky-300 uppercase font-semibold tracking-wide">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  )
}
