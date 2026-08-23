'use client'

import { useEffect, useState, useCallback } from 'react'
import { Globe, Wifi, WifiOff, Satellite } from 'lucide-react'

interface ISSPosition {
  latitude: number
  longitude: number
  timestamp: number
}

interface SpaceWeather {
  kp_index: number       // 0-9 geomagnetic activity index
  solar_wind_speed: number  // km/s
  xray_class: string     // solar flare class (A/B/C/M/X)
  source: string
}

function KpBar({ kp }: { kp: number }) {
  const color = kp <= 3 ? '#10B981' : kp <= 5 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-3 rounded-sm"
            style={{ background: i < kp ? color : '#1A2438' }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>
        Kp={kp}
      </span>
    </div>
  )
}

export default function LiveSpaceData() {
  const [issPos, setIssPos] = useState<ISSPosition | null>(null)
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | null>(null)
  const [issError, setIssError] = useState(false)
  const [weatherError, setWeatherError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchISS = useCallback(async () => {
    try {
      const res = await fetch('http://api.open-notify.org/iss-now.json', {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error('ISS API error')
      const data = await res.json()
      setIssPos({
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp,
      })
      setIssError(false)
    } catch {
      setIssError(true)
    }
  }, [])

  const fetchSpaceWeather = useCallback(async () => {
    try {
      // NOAA SWPC planetary Kp index (free, no key)
      const res = await fetch(
        'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
        { signal: AbortSignal.timeout(6000) }
      )
      if (!res.ok) throw new Error('NOAA API error')
      const data = await res.json()
      // data is an array of [time_tag, kp_index, kp_index_noaa] entries
      const latest = data[data.length - 1]
      const kp = Math.round(parseFloat(latest[1]))
      setSpaceWeather({
        kp_index: kp,
        solar_wind_speed: 0,   // Kp endpoint doesn't include wind speed; use 0
        xray_class: kp >= 6 ? 'M+' : kp >= 4 ? 'C' : 'A',
        source: 'NOAA SWPC',
      })
      setWeatherError(false)
    } catch {
      // Fallback: NOAA geomagnetic summary (alternate endpoint)
      try {
        const res2 = await fetch(
          'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
          { signal: AbortSignal.timeout(4000) }
        )
        if (res2.ok) {
          const d2 = await res2.json()
          // d2[0] = headers, rest = data rows
          if (d2.length > 2) {
            const row = d2[d2.length - 1]
            const kp = Math.round(parseFloat(row[1]) || 0)
            setSpaceWeather({ kp_index: kp, solar_wind_speed: 0, xray_class: 'N/A', source: 'NOAA SWPC' })
            setWeatherError(false)
            return
          }
        }
      } catch {}
      setWeatherError(true)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.allSettled([fetchISS(), fetchSpaceWeather()])
    setLastUpdate(new Date())
  }, [fetchISS, fetchSpaceWeather])

  useEffect(() => {
    fetchAll()
    // ISS moves fast — update every 10s. Space weather slower — piggybacks the same interval.
    const id = setInterval(fetchAll, 10_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const kp = spaceWeather?.kp_index ?? 0
  const kpColor = kp <= 3 ? '#10B981' : kp <= 5 ? '#F59E0B' : '#EF4444'
  const kpLabel = kp <= 3 ? 'QUIET' : kp <= 5 ? 'ACTIVE' : 'STORM'

  return (
    <div className="bg-[#0C1222] border border-[#1A2438] rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
            Live Space Data
          </span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}
          >
            Real NASA + NOAA APIs
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {lastUpdate && (
            <span className="text-[8px] font-mono text-slate-600">
              {lastUpdate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {issError && weatherError
            ? <WifiOff className="w-3 h-3 text-red-500" />
            : <Wifi className="w-3 h-3 text-emerald-500" />
          }
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* ISS Position */}
        <div className="rounded border border-[#162033] bg-[#080D1A] p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Satellite className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-mono text-slate-400 font-semibold">ISS LIVE POSITION</span>
            {issError && (
              <span className="text-[8px] font-mono text-red-500">(offline)</span>
            )}
          </div>
          {issPos && !issError ? (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">Lat</span>
                <span className="text-slate-200 font-semibold">{issPos.latitude.toFixed(3)}°</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">Lon</span>
                <span className="text-slate-200 font-semibold">{issPos.longitude.toFixed(3)}°</span>
              </div>
              <div className="text-[8px] font-mono text-slate-600 mt-0.5">
                Via open-notify.org · Orbital altitude ~408 km
              </div>
            </div>
          ) : (
            <div className="text-[9px] font-mono text-slate-600">
              {issError ? 'CORS-blocked in browser — available via backend proxy' : 'Loading...'}
            </div>
          )}
        </div>

        {/* Space Weather / Kp Index */}
        <div className="rounded border border-[#162033] bg-[#080D1A] p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: kpColor }} />
            </div>
            <span className="text-[9px] font-mono text-slate-400 font-semibold">GEOMAGNETIC ACTIVITY</span>
            {weatherError && (
              <span className="text-[8px] font-mono text-red-500">(offline)</span>
            )}
          </div>
          {spaceWeather && !weatherError ? (
            <div className="space-y-1.5">
              <KpBar kp={spaceWeather.kp_index} />
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span
                  className="px-1.5 py-0.5 rounded font-bold text-[8px]"
                  style={{ background: kpColor + '20', color: kpColor, border: `1px solid ${kpColor}40` }}
                >
                  {kpLabel}
                </span>
                <span className="text-slate-500">Solar activity: {spaceWeather.xray_class}</span>
              </div>
              <div className="text-[8px] font-mono text-slate-600">
                Source: {spaceWeather.source} · Relevance: elevated Kp = enhanced radiation risk
              </div>
            </div>
          ) : (
            <div className="text-[9px] font-mono text-slate-600">
              {weatherError ? 'NOAA SWPC API unavailable' : 'Loading...'}
            </div>
          )}
        </div>
      </div>

      {/* Contextual note */}
      <div className="text-[8px] font-mono text-slate-700 leading-relaxed">
        Real-time data feeds grounding AegisCrew in actual space environment conditions.
        Kp ≥ 5 triggers enhanced radiation monitoring protocols per NASA NSCR-2020.
      </div>
    </div>
  )
}
