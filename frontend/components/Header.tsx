'use client'

import { type TrafficLight } from '@/types/telemetry'
import { useEffect, useState } from 'react'

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
  return <span className="font-mono text-[#00F0FF] tabular-nums">{time}</span>
}

const STATUS_COLOR: Record<TrafficLight, string> = {
  GREEN: 'text-[#10B981]',
  AMBER: 'text-[#F59E0B]',
  RED:   'text-[#EF4444]',
}

export default function Header({ missionDay, fleetStatus, fleetReadiness, missionName }: HeaderProps) {
  return (
    <header className="bg-[#111827] border-b border-[#1F2D45] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left — Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 7.07 17.07M12 2a10 10 0 0 0-7.07 17.07" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-none tracking-wide">AEGISCREW AI</div>
            <div className="text-[10px] text-[#6B7280] leading-none mt-0.5 truncate">{missionName}</div>
          </div>
        </div>

        {/* Centre — MET */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-[10px] text-[#6B7280] uppercase tracking-widest">Mission Elapsed Time</div>
          <div className="text-sm font-bold">
            <span className="text-[#00F0FF] font-mono">MET Day {String(missionDay).padStart(3, '0')}</span>
            <span className="text-[#6B7280] mx-2">|</span>
            <METClock />
          </div>
        </div>

        {/* Right — Fleet readiness */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[10px] text-[#6B7280] uppercase tracking-widest">Fleet Readiness</div>
            <div className={`text-sm font-bold font-mono ${STATUS_COLOR[fleetStatus]}`}>
              {fleetReadiness.toFixed(0)}% [{fleetStatus}]
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider">Live</span>
          </div>

          {/* IBM badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1A2236] border border-[#1F2D45]">
            <span className="text-[10px] text-[#6B7280]">Powered by</span>
            <span className="text-[11px] font-bold text-[#00F0FF]">IBM</span>
            <span className="text-[10px] text-[#6B7280]">watsonx.ai</span>
          </div>
        </div>
      </div>
    </header>
  )
}
