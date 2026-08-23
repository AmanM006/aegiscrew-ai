'use client'

import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'

interface CityMarker {
  id: string
  name: string
  lat: number
  lon: number
}

const CITIES: CityMarker[] = [
  { id: 'sf', name: 'SAN FRANCISCO', lat: 37.78, lon: -122.44 },
  { id: 'nyc', name: 'NEW YORK', lat: 40.71, lon: -74.01 },
  { id: 'paris', name: 'PARIS', lat: 48.85, lon: 2.35 },
  { id: 'dubai', name: 'DUBAI', lat: 25.20, lon: 55.27 },
  { id: 'saopaulo', name: 'SÃO PAULO', lat: -23.55, lon: -46.63 },
  { id: 'capetown', name: 'CAPE TOWN', lat: -33.92, lon: 18.42 },
  { id: 'tokyo', name: 'TOKYO', lat: 35.68, lon: 139.69 },
]

function getCobeMarkerScreenPos(lat: number, lon: number, phi: number, theta: number) {
  const radLat = (lat * Math.PI) / 180
  const radLon = (lon * Math.PI) / 180 - Math.PI
  const cosLat = Math.cos(radLat)
  const t0 = -cosLat * Math.cos(radLon)
  const t1 = Math.sin(radLat)
  const t2 = cosLat * Math.sin(radLon)

  const cosTheta = Math.cos(theta)
  const sinTheta = Math.sin(theta)
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)

  const c = cosPhi * t0 + sinPhi * t2
  const s = sinPhi * sinTheta * t0 + cosTheta * t1 - cosPhi * sinTheta * t2
  const depth = -sinPhi * cosTheta * t0 + sinTheta * t1 + cosPhi * cosTheta * t2

  // Visible only when on the front hemisphere and comfortably inside the sphere radius
  const distSq = c * c + s * s
  const isVisible = depth > 0.12 && distSq < 0.72

  const x = ((c + 1) / 2) * 100
  const y = ((-s + 1) / 2) * 100

  return { x, y, isVisible, depth }
}

export default function CobeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const phiRef = useRef(0)
  const labelsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const theta = 0.2

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: any = null
    let animId: number

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 1200,
        height: 1200,
        phi: 0,
        theta: theta,
        dark: 0,
        diffuse: 1.2,
        scale: 1,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [1, 1, 1], // Pure white luminous globe
        markerColor: [0.0, 0.27, 0.96], // #0045f6 electric royal blue
        glowColor: [1, 1, 1],
        offset: [0, 0],
        markers: [
          { location: [37.78, -122.44], size: 0.05, id: 'sf' },        // San Francisco
          { location: [40.71, -74.01],   size: 0.05, id: 'nyc' },       // New York
          { location: [48.85, 2.35],     size: 0.04, id: 'paris' },     // Paris
          { location: [25.20, 55.27],    size: 0.04, id: 'dubai' },     // Dubai
          { location: [-23.55, -46.63],  size: 0.05, id: 'saopaulo' },  // São Paulo
          { location: [-33.92, 18.42],   size: 0.05, id: 'capetown' },  // Cape Town
          { location: [35.68, 139.69],   size: 0.05, id: 'tokyo' },     // Tokyo
        ],
        arcs: [
          { from: [37.78, -122.44], to: [35.68, 139.69], color: [0.0, 0.27, 0.96] },  // SF -> Tokyo
          { from: [40.71, -74.01],  to: [48.85, 2.35],    color: [0.0, 0.27, 0.96] },  // NYC -> London/Paris
        ],
        arcColor: [0.0, 0.27, 0.96],
        arcWidth: 0.6,
        arcHeight: 0.3,
        markerElevation: 0.02,
      })

      const animate = () => {
        if (!pointerInteracting.current) {
          phiRef.current += 0.003
        }
        const currentPhi = phiRef.current + pointerInteractionMovement.current
        globe.update({ phi: currentPhi })

        // Direct high-performance DOM positioning for each marker label
        CITIES.forEach((c) => {
          const el = labelsRef.current[c.id]
          if (el) {
            const pos = getCobeMarkerScreenPos(c.lat, c.lon, currentPhi, theta)
            el.style.left = `${pos.x}%`
            el.style.top = `${pos.y}%`
            el.style.opacity = pos.isVisible ? '1' : '0'
            el.style.transform = `translate(-50%, -100%) scale(${Math.max(0.75, pos.depth + 0.55)})`
          }
        })

        animId = requestAnimationFrame(animate)
      }
      animId = requestAnimationFrame(animate)
    } catch (e) {
      console.warn('Cobe WebGL initialization error', e)
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (globe) globe.destroy()
    }
  }, [])

  return (
    <div className="w-full max-w-[540px] aspect-square mx-auto relative flex items-center justify-center select-none">
      
      {/* ─── Luminous Glass Core Sphere ─────────────────────────────────────── */}
      <div className="absolute w-[80%] h-[80%] rounded-full bg-gradient-to-b from-white via-[#FAFBFD] to-[#E5EDF8] shadow-[0_0_90px_rgba(255,255,255,0.8),inset_0_0_35px_rgba(0,69,246,0.08)] pointer-events-none z-0" />
      
      {/* ─── Outer Soft Atmospheric Glow ─────────────────────────────────────── */}
      <div className="absolute w-[85%] h-[85%] rounded-full border border-white/60 shadow-[0_0_50px_rgba(255,255,255,0.5)] pointer-events-none z-5" />

      {/* ─── WebGL Canvas Sphere ────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          aspectRatio: '1',
        }}
        className="cursor-grab active:cursor-grabbing relative z-10"
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current
          if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
        }}
        onPointerUp={() => {
          pointerInteracting.current = null
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          pointerInteracting.current = null
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current
            pointerInteractionMovement.current = delta * 0.005
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current
            pointerInteractionMovement.current = delta * 0.005
          }
        }}
      />

      {/* ─── Center Stencil Scanline Typography ("AEGISCREW") ────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
        <div
          className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.18em] select-none text-center"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, #0045f6 0px, #0045f6 3px, transparent 3px, transparent 6.5px)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 16px rgba(0,69,246,0.35))',
          }}
        >
          AEGISCREW
        </div>
      </div>

      {/* ─── 3D Circling Text Orbit Ring (Natural 3D Depth) ─────────────────── */}
      <div
        className="absolute inset-[-5%] pointer-events-none z-20 flex items-center justify-center overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 40%, black 52%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 40%, black 52%, black 100%)',
        }}
      >
        <svg
          className="w-full h-full animate-orbit-spin"
          viewBox="0 0 300 300"
        >
          <defs>
            <path
              id="aegisOrbitPath"
              d="M 150,150 m -134,0 a 134,134 0 1,0 268,0 a 134,134 0 1,0 -268,0"
            />
          </defs>
          <text className="font-mono fill-[#0045F6] text-[6.2px] uppercase font-black tracking-[0.14em]">
            <textPath href="#aegisOrbitPath">
              AEGISCREW AI · NASA-STD-3001 · IBM GRANITE 4 · DEEP SPACE CMO · AUTONOMOUS MEDICINE · ZERO GROUND DELAY · 
            </textPath>
          </text>
        </svg>
      </div>

      {/* ─── Dynamically Projected City Pin Badges (Exact Cobe 3D Tracking) ─── */}
      {CITIES.map((city) => (
        <div
          key={city.id}
          ref={(el) => {
            labelsRef.current[city.id] = el
          }}
          className="absolute z-30 pointer-events-none flex flex-col items-center transition-opacity duration-200"
          style={{ willChange: 'transform, left, top, opacity' }}
        >
          <div className="px-2 py-0.5 rounded-sm bg-[#0045F6] text-white font-mono text-[9px] font-black uppercase tracking-wide shadow-md shadow-blue-600/40 whitespace-nowrap">
            {city.name}
          </div>
        </div>
      ))}

    </div>
  )
}
