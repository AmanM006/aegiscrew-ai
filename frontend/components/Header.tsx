'use client'

import { type TrafficLight } from '@/types/telemetry'
import { useEffect, useState } from 'react'
import { Satellite, Radio, Cpu, ShieldCheck, ShieldAlert, Sparkles, Activity } from 'lucide-react'

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
  return <span className="font-mono text-[#00F0FF] tabular-nums tracking-wider">{time}</span>
}

const STATUS_COLOR: Record<TrafficLight, { text: string; bg: string; border: string }> = {
  GREEN: { text: 'text-[#10B981]', bg: 'bg-[#10B981]/15', border: 'border-[#10B981]/40' },
  AMBER: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/15', border: 'border-[#F59E0B]/40' },
  RED:   { text: 'text-[#EF4444]', bg: 'bg-[#EF4444]/15', border: 'border-[#EF4444]/40' },
}

export default function Header({ missionDay, fleetStatus, fleetReadiness, missionName }: HeaderProps) {
  const statusCfg = STATUS_COLOR[fleetStatus] || STATUS_COLOR.GREEN

  return (
    <header className="bg-[#070C18]/90 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-50 shadow-2xl">
      <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left — Brand */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-blue-900/30 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-neon-cyan">
            <Satellite className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-white text-base tracking-widest">AEGISCREW</span>
              <span className="font-orbitron font-black text-[#00F0FF] text-base tracking-wider glow-cyan">AI</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono uppercase font-semibold">IBM BOB 2026</span>
            </div>
            <div className="text-[11px] text-[#64748B] font-mono leading-tight mt-0.5 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]/60" />
              <span>{missionName}</span>
            </div>
          </div>
        </div>

        {/* Centre — MET Clock */}
        <div className="hidden md:flex flex-col items-center bg-[#0B132B]/60 px-5 py-1.5 rounded-lg border border-[#1E293B]">
          <div className="text-[10px] text-[#64748B] font-orbitron uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#00F0FF]" />
            <span>Mission Elapsed Time</span>
          </div>
          <div className="text-sm font-bold mt-0.5">
            <span className="text-[#00F0FF] font-orbitron tracking-wider">MET Day {String(missionDay).padStart(3, '0')}</span>
            <span className="text-[#334155] mx-2.5">|</span>
            <METClock />
          </div>
        </div>

        {/* Right — Fleet Readiness & Badges */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[10px] text-[#64748B] font-orbitron uppercase tracking-widest">Fleet Readiness</div>
            <div className={`text-sm font-bold font-mono ${statusCfg.text} flex items-center gap-1.5`}>
              {fleetStatus === 'RED' ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{fleetReadiness.toFixed(0)}% [{fleetStatus}]</span>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-neon-cyan">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span className="text-[10px] font-mono text-[#00F0FF] uppercase font-bold tracking-wider">LIVE TELEMETRY</span>
          </div>

          {/* IBM Watsonx Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0E172A] border border-[#1E293B]">
            <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
            <div className="text-[10px] leading-tight">
              <div className="text-[#64748B]">Powered by</div>
              <div className="font-bold text-white"><span className="text-[#00F0FF]">IBM</span> watsonx.ai</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
