'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Cpu,
  RefreshCw,
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Sliders,
  Layers,
  Lock,
  Radio,
  Check,
  ChevronRight,
  Play,
  Satellite,
  HeartPulse,
  Flame,
  Moon,
  AlertTriangle,
} from 'lucide-react'
import CobeGlobe from '@/components/CobeGlobe'

export const HeroLanding: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="w-full bg-[#050608] text-[#f5f7fa] selection:bg-[#38bdf8]/30 selection:text-[#f5f7fa]">
      
      {/* ─── Top Floating Navbar (Rectangular ROI Ledger Design) ───────────── */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6">
        <nav
          aria-label="Primary"
          className="rise flex w-full max-w-5xl items-center justify-between gap-8 border border-white/15 bg-black/80 py-2.5 pl-5 pr-3 shadow-2xl shadow-black/80 backdrop-blur-lg rounded-xl"
          style={{ animationDelay: '0.2s' }}
        >
          <a
            className="flex shrink-0 items-center gap-2.5"
            href="#hero"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('hero')
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              className="size-5.5 text-white"
            >
              <path
                d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 9h7v-7h-7v7z"
                fill="currentColor"
                fillOpacity="0.9"
              />
            </svg>
            <span className="font-display text-[15px] font-semibold tracking-tight text-white">
              AEGISCREW AI
            </span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#proof"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('proof')
              }}
              className="group relative py-1 text-sm font-medium text-[#9ca6b5] transition-colors hover:text-white"
            >
              Telemetry
              <span className="absolute -bottom-2.5 left-1/2 h-px w-0 -translate-x-1/2 bg-[#38bdf8] transition-all duration-300 ease-out group-hover:w-full"></span>
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('how-it-works')
              }}
              className="group relative py-1 text-sm font-medium text-[#9ca6b5] transition-colors hover:text-white"
            >
              How It Works
              <span className="absolute -bottom-2.5 left-1/2 h-px w-0 -translate-x-1/2 bg-[#38bdf8] transition-all duration-300 ease-out group-hover:w-full"></span>
            </a>
            <a
              href="#architecture"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('architecture')
              }}
              className="group relative py-1 text-sm font-medium text-[#9ca6b5] transition-colors hover:text-white"
            >
              Architecture
              <span className="absolute -bottom-2.5 left-1/2 h-px w-0 -translate-x-1/2 bg-[#38bdf8] transition-all duration-300 ease-out group-hover:w-full"></span>
            </a>
            <a
              href="#product"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('product')
              }}
              className="group relative py-1 text-sm font-medium text-[#9ca6b5] transition-colors hover:text-white"
            >
              Proof
              <span className="absolute -bottom-2.5 left-1/2 h-px w-0 -translate-x-1/2 bg-[#38bdf8] transition-all duration-300 ease-out group-hover:w-full"></span>
            </a>
          </div>

          <Link
            href="/dashboard"
            className="group relative inline-flex h-[38px] shrink-0 items-center justify-center gap-2 overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 px-5 transition-transform active:scale-95 rounded-lg"
          >
            <span className="relative z-10 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white">
              Open live dashboard
              <ChevronRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 text-white/80" />
            </span>
          </Link>
        </nav>
      </div>

      <main id="main">
        {/* ─── HERO SECTION: ABSOLUTE 4-CORNER HUD WITH CENTERED 3D GLOBE ───── */}
        <section
          id="hero"
          className="relative min-h-screen w-full overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 85% at 50% 0%, #0d1829 0%, #080f1a 45%, #050608 100%)',
              }}
            ></div>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(5,6,8,0.6) 62%, #050608 100%)',
              }}
            ></div>
          </div>

          {/* ─── 3D COBE GLOBE IN DEAD CENTER ─────────────────────────────────── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10">
            <div className="w-full max-w-[540px] aspect-square flex items-center justify-center">
              <CobeGlobe />
            </div>
          </div>

          {/* ─── TOP-LEFT: Main Headline (Anchored to Far Left) ─────────────────── */}
          <div className="absolute top-28 left-6 sm:left-10 lg:left-14 z-20 max-w-sm lg:max-w-md text-left space-y-4 pointer-events-auto">
            <h1 className="rise font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.06] tracking-tighter text-white" style={{ animationDelay: '0.2s' }}>
              <span className="block text-white/45 font-light">Deep space</span>
              <span className="block text-white font-semibold">isolates.</span>
              <span className="block text-white/45 font-light">AegisCrew</span>
              <span className="block text-white font-semibold">heals.</span>
            </h1>
          </div>

          {/* ─── TOP-RIGHT: Headline Part 2 + Live Telemetry HUD (Anchored to Far Right) */}
          <div className="absolute top-28 right-6 sm:right-10 lg:right-14 z-20 max-w-xs text-right space-y-3 pointer-events-auto">
            <h2 className="rise font-display text-3xl sm:text-4xl font-medium tracking-tighter text-white leading-tight" style={{ animationDelay: '0.3s' }}>
              <span className="block text-white/45 font-light">Every</span>
              <span className="block text-white font-semibold">vital</span>
              <span className="block text-white/45 font-light">in</span>
              <span className="block text-[#38bdf8] font-semibold">real-time.</span>
            </h2>

            <div className="rise p-3.5 rounded-xl bg-black/75 border border-white/10 text-left font-mono text-[11px] space-y-1.5 backdrop-blur-md shadow-2xl" style={{ animationDelay: '0.35s' }}>
              <div className="flex justify-between text-[#9ca6b5]">
                <span>Fleet Readiness:</span>
                <span className="text-[#39d98a] font-bold">94.8% GREEN</span>
              </div>
              <div className="flex justify-between text-[#9ca6b5]">
                <span>Comms Delay:</span>
                <span className="text-[#f5c451] font-bold">1,200s (20.0m)</span>
              </div>
              <div className="flex justify-between text-[#9ca6b5]">
                <span>Granite 4 MTTR:</span>
                <span className="text-[#38bdf8] font-bold">0.82s Real-Time</span>
              </div>
            </div>
          </div>

          {/* ─── BOTTOM-LEFT: Description & Protocol Status (Anchored to Far Left) ─ */}
          <div className="absolute bottom-10 left-6 sm:left-10 lg:left-14 z-20 max-w-sm lg:max-w-md text-left space-y-2.5 pointer-events-auto rise" style={{ animationDelay: '0.4s' }}>
            <p className="text-xs sm:text-sm font-light leading-relaxed text-[#9ca6b5]">
              Operating 140 million miles from Earth with a 22-minute speed-of-light delay, AegisCrew AI streams{' '}
              <span className="text-white font-medium">NASA-STD-3001 biometrics</span> and synthesizes clinical countermeasure protocols via{' '}
              <span className="text-white font-medium">IBM Granite 4</span> with zero ground dependency.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="size-1.5 rounded-full bg-[#39d98a]"></span>
              <span>NASA-HDBK-2203 Black Box Flight Ledger Active</span>
            </div>
          </div>

          {/* ─── BOTTOM-RIGHT: Action Buttons (Anchored to Far Right) ───────────── */}
          <div className="absolute bottom-10 right-6 sm:right-10 lg:right-14 z-20 flex items-center gap-3 pointer-events-auto rise" style={{ animationDelay: '0.5s' }}>
            <Link
              href="/dashboard"
              className="group relative inline-flex h-[46px] items-center justify-center gap-2 overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 px-6 transition-all active:scale-95 rounded-lg shadow-xl shadow-black/50"
            >
              <span className="relative z-10 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white">
                Open live dashboard
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 text-white/80" />
              </span>
            </Link>

            <button
              onClick={() => scrollToSection('proof')}
              className="group inline-flex h-[46px] items-center justify-center gap-2 border border-[#232a33] hover:border-white/25 px-5 text-xs font-medium uppercase tracking-wide text-[#9ca6b5] transition-colors hover:text-white rounded-lg"
            >
              <Play className="size-3 fill-current" />
              Telemetry
            </button>
          </div>

        </section>

        {/* ─── SECTION 1: TELEMETRY & SYSTEM PROOF (Exact ROI Ledger 3-Column Layout) ─── */}
        <section
          id="proof"
          className="relative flex min-h-screen w-full flex-col justify-center scroll-mt-24 px-6 py-20"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
            
            {/* Left Column: System Status Box */}
            <section className="corner-ticks relative flex flex-1 flex-col justify-between border border-dashed border-[#232a33] bg-[#050608] p-8 transition-colors duration-500 hover:border-[#38bdf8]/40 rounded-xl">
              <div className="space-y-7">
                <div className="flex items-center justify-between border-b border-dashed border-[#232a33] pb-4">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-2">
                    <Activity className="size-3 text-[#38bdf8]" />
                    [ Flight Surgeon Ledger Status ]
                  </span>
                  <div className="flex gap-1.5">
                    <span className="size-1.5 bg-[#38bdf8] rounded-full"></span>
                    <span className="size-1.5 bg-[#232a33] rounded-full"></span>
                    <span className="size-1.5 bg-[#232a33] rounded-full"></span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#5d6875]">Active Crew Fleet</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-5xl font-medium tracking-tighter text-white">4</p>
                    <span className="text-sm font-mono text-[#9ca6b5]">Artemis Digital Twins</span>
                  </div>
                  <p className="mt-2 text-xs font-mono text-[#9ca6b5]">
                    Evaluating Vance (ASTRO-01), Jensen (ASTRO-02), Thorne (ASTRO-03), and Lin (ASTRO-04).
                  </p>
                </div>

                <div className="rule-fade"></div>

                <dl className="grid grid-cols-2 gap-5">
                  <div>
                    <dt className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5d6875]">
                      <CheckCircle2 className="size-3 text-[#39d98a]" />
                      Fleet Readiness
                    </dt>
                    <dd className="font-display text-4xl font-medium tracking-tighter text-[#39d98a]">
                      94.8%
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5d6875]">
                      <RefreshCw className="size-3 text-[#38bdf8]" />
                      SOPs Applied
                    </dt>
                    <dd className="font-display text-4xl font-medium tracking-tighter text-[#38bdf8]">
                      6
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2 border-t border-dashed border-[#232a33] pt-4 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#5d6875]">Avoided Radio Delay (22m one-way latency)</span>
                    <span className="text-[#39d98a] font-bold">1,200.0s Saved</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5d6875]">Edge Granite 4 Synthesis Speed</span>
                    <span className="text-slate-300 font-bold">0.824s Real-Time</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5">
                    <span className="text-white font-bold">Autonomous Time Margin</span>
                    <span className="text-[#39d98a] font-black">+1,199.2s Faster</span>
                  </div>
                </div>
              </div>

              <p className="mt-7 flex items-start gap-2 border border-[#38bdf8]/25 bg-[#38bdf8]/5 p-3 text-[11px] font-mono leading-relaxed text-[#38bdf8]/90 rounded-lg">
                <span>NASA-HDBK-2203 flight telemetry logged to immutable black-box ledger with cryptographic audit trail.</span>
              </p>
            </section>

            {/* Center Column: Featured Target Showcase */}
            <section className="group relative min-h-[480px] flex-1 overflow-hidden border border-[#232a33] rounded-xl lg:flex-[1.6] bg-[#080c14] p-8 flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-b from-[#121e2d] via-[#09121a] to-[#050608] pointer-events-none"></div>

              <div className="relative z-10 flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                  <Radio className="size-3 text-[#38bdf8]" />
                  [ Featured Scenario // SPE Radiation Flare ]
                </span>
                <span className="flex items-center gap-1.5 border border-[#39d98a]/40 bg-[#050608]/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[#39d98a] backdrop-blur-sm rounded-full">
                  <Check className="size-3" />
                  Telemetry Verified
                </span>
              </div>

              <div className="relative z-10 my-6 space-y-3">
                <div className="p-4 rounded-xl bg-[#050608]/90 border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-[10px] text-[#5d6875] uppercase tracking-wider">// Autonomous Countermeasure Pipeline</div>
                  <div className="text-white/90">
                    <span className="text-[#38bdf8] font-bold">aegis.halt_eva</span>(<span className="text-[#f5c451]">"ASTRO-02_JENSEN"</span>) <span className="text-slate-500">→</span>
                    <span className="text-[#38bdf8] font-bold"> aegis.storm_shelter_ingress</span>(<span className="text-[#f5c451]">"WATER_WALL_MODULE_C"</span>)
                  </div>
                  <div className="text-[#39d98a] text-[11px] flex items-center gap-2 pt-1 border-t border-white/5">
                    <span>✓ Radiation Dose 87.4 mGy/d contained</span>
                    <span>•</span>
                    <span>Granite 4 SOP Synthesis 0.8s</span>
                  </div>
                </div>

                <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
                  Solar Particle Event Countermeasure
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-[#9ca6b5]">
                  SPE flare detected on ASTRO-02 Jensen during exterior maintenance. AegisCrew triggers emergency EVA freeze and routes crew to the water-shielded module without waiting for 20m Earth radio sync.
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#5d6875]">
                  twin · ASTRO-02 (Mark Jensen · Flight Engineer)
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="text-xs font-mono text-white hover:text-[#38bdf8] font-bold flex items-center gap-1.5"
                >
                  Inspect Live Telemetry <ArrowRight className="size-3" />
                </Link>
                <span className="text-[10px] font-mono text-slate-500">0.8s Autonomous Resolution</span>
              </div>
            </section>

            {/* Right Column: 4 Capabilities */}
            <section className="flex flex-1 flex-col border border-[#232a33] bg-[#050608] p-8 rounded-xl">
              <div className="mb-6 flex items-center justify-between border-b border-dashed border-[#232a33] pb-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]">
                  [ Capabilities ]
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5d6875]">
                  04 PILLARS
                </span>
              </div>

              <ul className="flex flex-1 flex-col justify-between space-y-4">
                <li className="border-b border-[#232a33]/60 pb-3 last:border-0">
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 font-mono text-[10px] text-[#5d6875]">01</span>
                    <div>
                      <h4 className="text-sm font-medium tracking-tight text-white font-mono">NASA-STD-3001 Streams</h4>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">Continuous 5-min ingest across 8 biometric telemetry streams.</p>
                    </div>
                  </div>
                </li>
                <li className="border-b border-[#232a33]/60 pb-3 last:border-0">
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 font-mono text-[10px] text-[#5d6875]">02</span>
                    <div>
                      <h4 className="text-sm font-medium tracking-tight text-white font-mono">Three-Pillar Risk Engine</h4>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">Borbély circadian sleep debt, cardiac strain, and radiation dosimetry.</p>
                    </div>
                  </div>
                </li>
                <li className="border-b border-[#232a33]/60 pb-3 last:border-0">
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 font-mono text-[10px] text-[#5d6875]">03</span>
                    <div>
                      <h4 className="text-sm font-medium tracking-tight text-white font-mono">IBM Granite 4 RAG</h4>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">Grounding in NASA SP-2010-3407 Flight Surgeon SOP manuals.</p>
                    </div>
                  </div>
                </li>
                <li className="pb-1">
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 font-mono text-[10px] text-[#5d6875]">04</span>
                    <div>
                      <h4 className="text-sm font-medium tracking-tight text-white font-mono">Black Box Flight Recorder</h4>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">Cryptographic flight audit trail for Houston post-transit sync.</p>
                    </div>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </section>

        {/* ─── SECTION 2: HOW IT WORKS (Exact ROI Ledger 3-Step Grid) ─────────── */}
        <section
          id="how-it-works"
          className="relative flex min-h-screen w-full flex-col justify-center scroll-mt-24 px-6 py-20"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative mb-12 flex w-full flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="flex max-w-3xl flex-col gap-3">
                <span className="text-sm font-medium uppercase tracking-widest text-[#38bdf8]">
                  // AUTONOMOUS PROTOCOL
                </span>
                <h2 className="font-display text-4xl font-medium tracking-tighter sm:text-5xl md:text-6xl text-white">
                  Deterministic recovery, zero <span className="text-[#38bdf8]">hallucinated medicine.</span>
                </h2>
                <p className="max-w-xl text-base font-light leading-relaxed text-[#9ca6b5]">
                  When astronauts exhibit acute clinical anomalies, AegisCrew runs statistical baseline diagnostics, retrieves NASA Flight Surgeon SOPs via IBM Granite 4, and executes emergency countermeasures in seconds.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <article className="corner-ticks group relative flex flex-col border border-[#232a33] bg-[#0f1216]/50 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="mb-6 flex items-center justify-between">
                  <Sliders className="size-5 text-[#38bdf8]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#5d6875]">01</span>
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold tracking-tight text-white">
                  Isolate Vital Deviations
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca6b5]">
                  When physiological telemetry shifts, multivariate IsolationForest algorithms isolate the exact stream (SpO₂, HRV RMSSD, Core Temp) that breached personalized baseline thresholds.
                </p>
              </article>

              <article className="corner-ticks group relative flex flex-col border border-[#232a33] bg-[#0f1216]/50 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="mb-6 flex items-center justify-between">
                  <ShieldCheck className="size-5 text-[#39d98a]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#5d6875]">02</span>
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold tracking-tight text-white">
                  Granite 4 Clinical RAG
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca6b5]">
                  Clinical countermeasure protocols generated by IBM Granite 4 must conform to NASA SP-2010-3407 Flight Surgeon procedures, citing exact step-by-step clinical actions.
                </p>
              </article>

              <article className="corner-ticks group relative flex flex-col border border-[#232a33] bg-[#0f1216]/50 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="mb-6 flex items-center justify-between">
                  <Lock className="size-5 text-[#38bdf8]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#5d6875]">03</span>
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold tracking-tight text-white">
                  Immutable Flight Receipts
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca6b5]">
                  Every medical intervention is cryptographically sealed into local SQLite flight black-box ledgers, recording physiological delta, ML risk scores, and clinical prescriptions.
                </p>
              </article>
            </div>

            {/* Worked Example Box (Exact ROI Ledger Design) */}
            <div className="mt-8 border border-[#232a33] bg-[#0f1216]/30 p-8 rounded-xl">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[#232a33] pb-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]">
                  [ Worked Example · Parmitano EVA-23 Helmet Water Leak ]
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#5d6875]">
                  target · ASTRO-02_EVA_INCIDENT (NASA Historical Case)
                </span>
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div>
                  <p className="mb-4 text-sm leading-relaxed text-[#9ca6b5]">
                    During an EVA, 1.5L of water enters helmet. SpO₂ drops to 93.1% with severe acoustic attenuation. AegisCrew autonomously terminates EVA and begins emergency airlock repressurization in 0.8s.
                  </p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#5d6875]">from nominal status</span>
                      <span className="text-[#9ca6b5] line-through">EVA-Active, Heart Rate 72 bpm, SpO2 99%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5d6875]">to emergency SOP</span>
                      <span className="text-white font-medium">TERMINATE EVA → AIRLOCK REPRESSURIZATION → O₂ FLUSH</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-6">
                    <div>
                      <p className="font-display text-3xl font-medium tracking-tighter text-[#39d98a]">100%</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#5d6875]">SOP Compliance</p>
                    </div>
                    <div>
                      <p className="font-display text-3xl font-medium tracking-tighter text-white">~0.8s</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#5d6875]">Autonomous MTTR</p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  <li className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-[#38bdf8] bg-[#38bdf8]/[0.04] px-4 py-3 rounded-r-lg">
                    <div>
                      <p className="font-mono text-xs text-white">Gate 1 // NASA-STD-3001 Protocol Conformance</p>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">All 8 clinical vitals evaluated against life support thresholds.</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#39d98a] font-bold">
                      ✓ PASSED (100%)
                    </span>
                  </li>
                  <li className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-[#38bdf8] bg-[#38bdf8]/[0.04] px-4 py-3 rounded-r-lg">
                    <div>
                      <p className="font-mono text-xs text-white">Gate 2 // IBM Granite 4 Flight Surgeon Grounding</p>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">Cites NASA SP-2010-3407 emergency repressurization checklist.</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#39d98a] font-bold">
                      ✓ 100.0% MATCH
                    </span>
                  </li>
                  <li className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-[#38bdf8] bg-[#38bdf8]/[0.04] px-4 py-3 rounded-r-lg">
                    <div>
                      <p className="font-mono text-xs text-white">Gate 3 // Black Box Cryptographic Seal</p>
                      <p className="mt-0.5 text-xs text-[#9ca6b5]">SHA-256 hash verified and stored in local mission flight vault.</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#39d98a] font-bold">
                      ✓ SECURE AUDIT
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: ARCHITECTURE (Exact ROI Ledger 4-Grid System) ───────── */}
        <section
          id="architecture"
          className="relative flex min-h-screen w-full flex-col justify-center scroll-mt-24 px-6 py-20"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative mb-12 flex w-full flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="flex max-w-3xl flex-col gap-3">
                <span className="text-sm font-medium uppercase tracking-widest text-[#38bdf8]">
                  // SYSTEM TOPOLOGY
                </span>
                <h2 className="font-display text-4xl font-medium tracking-tighter sm:text-5xl md:text-6xl text-white">
                  Architected for deep space, built on <span className="text-[#38bdf8]">IBM Granite 4.</span>
                </h2>
                <p className="max-w-xl text-base font-light leading-relaxed text-[#9ca6b5]">
                  A complete operational clinical framework uniting biometric telemetry, three-pillar risk scoring, and zero-latency autonomous reasoning.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <article className="group flex gap-5 border border-[#232a33] bg-[#0f1216]/30 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="flex size-10 shrink-0 items-center justify-center border border-[#232a33] rounded-lg text-[#9ca6b5] group-hover:text-white group-hover:border-white/30">
                  <Cpu className="size-5" />
                </div>
                <div>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-white">IBM Granite 4 Clinical Engine</h3>
                    <span className="font-mono text-[10px] text-[#5d6875]">01</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#9ca6b5]">
                    Local on-habitat LLM inference (<code className="text-white font-mono">ibm/granite-4-h-small</code>) delivering expert Flight Surgeon medical briefings in 0.8s without Earth connectivity.
                  </p>
                </div>
              </article>

              <article className="group flex gap-5 border border-[#232a33] bg-[#0f1216]/30 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="flex size-10 shrink-0 items-center justify-center border border-[#232a33] rounded-lg text-[#9ca6b5] group-hover:text-white group-hover:border-white/30">
                  <Layers className="size-5" />
                </div>
                <div>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-white">Three-Pillar Risk Engine</h3>
                    <span className="font-mono text-[10px] text-[#5d6875]">02</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#9ca6b5]">
                    Real-time synthesis of Borbély 2-process circadian sleep debt, autonomic cardiac strain (HRV RMSSD), and cumulative radiation dosimetry.
                  </p>
                </div>
              </article>

              <article className="group flex gap-5 border border-[#232a33] bg-[#0f1216]/30 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="flex size-10 shrink-0 items-center justify-center border border-[#232a33] rounded-lg text-[#9ca6b5] group-hover:text-white group-hover:border-white/30">
                  <Lock className="size-5" />
                </div>
                <div>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-white">NASA-HDBK-2203 Black Box</h3>
                    <span className="font-mono text-[10px] text-[#5d6875]">03</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#9ca6b5]">
                    Cryptographic local flight recorder preserving immutable telemetry snapshots, anomaly scores, and intervention logs for post-mission Houston sync.
                  </p>
                </div>
              </article>

              <article className="group flex gap-5 border border-[#232a33] bg-[#0f1216]/30 p-8 transition-colors duration-500 hover:border-white/20 rounded-xl">
                <div className="flex size-10 shrink-0 items-center justify-center border border-[#232a33] rounded-lg text-[#9ca6b5] group-hover:text-white group-hover:border-white/30">
                  <Database className="size-5" />
                </div>
                <div>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-white">4 Artemis Digital Twins</h3>
                    <span className="font-mono text-[10px] text-[#5d6875]">04</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#9ca6b5]">
                    Grounded in individualized NASA baseline physiological profiles for Vance (Commander), Jensen (EVA Lead), Thorne (Science), and Lin (Systems).
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: PRODUCT CTA (Exact ROI Ledger Structure) ────────────── */}
        <section
          id="product"
          className="relative flex min-h-screen w-full flex-col items-center justify-center scroll-mt-24 px-6 py-20 text-center"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="mx-auto mb-6 max-w-3xl font-display text-4xl font-medium leading-[1.1] tracking-tighter sm:text-5xl md:text-6xl text-white">
              Space agencies make transit habitats.<br />
              <span className="text-[#38bdf8]">AegisCrew keeps the crew alive.</span>
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-base sm:text-lg font-light leading-relaxed text-[#9ca6b5]">
              Open the live Mission Control dashboard, simulate clinical telemetry anomalies on the 4 Artemis crew twins, and evaluate autonomous IBM Granite 4 countermeasures in real time.
            </p>

            <Link
              href="/dashboard"
              className="group relative inline-flex h-[54px] items-center justify-center gap-2 overflow-hidden bg-white/5 border border-white/20 hover:border-white/40 px-9 transition-all active:scale-95 rounded-lg"
            >
              <span className="relative z-10 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white">
                Open live dashboard
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 text-white/80" />
              </span>
            </Link>
          </div>
        </section>
      </main>

      {/* ─── FOOTER WITH GIANT WATERMARK (Exact ROI Ledger Design) ─────────── */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#07090e]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 pt-16 pb-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="size-6 text-white"
              >
                <path
                  d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 9h7v-7h-7v7z"
                  fill="currentColor"
                  fillOpacity="0.95"
                />
              </svg>
              <span className="font-mono text-base font-bold text-white tracking-tight">
                AEGISCREW AI
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Autonomous Deep-Space Clinical Intelligence powered by IBM Granite 4 &amp; NASA-STD-3001. Built for the IBM Bob AI Builders Challenge 2026.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#38bdf8] hover:text-white transition-colors"
              >
                Launch Mission Control Console →
              </Link>
            </div>
          </div>

          <div className="flex gap-16">
            <nav aria-label="Footer Navigation" className="flex flex-col gap-3">
              <span className="mb-1 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Navigation
              </span>
              <a
                href="#proof"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('proof')
                }}
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Telemetry
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('how-it-works')
                }}
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                How It Works
              </a>
              <a
                href="#architecture"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('architecture')
                }}
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Architecture
              </a>
              <a
                href="#product"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('product')
                }}
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Proof
              </a>
            </nav>
            <div className="flex flex-col gap-3">
              <span className="mb-1 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Powered By
              </span>
              <span className="text-sm text-slate-300">IBM Granite 4 Inference</span>
              <span className="text-sm text-slate-300">FastAPI Autonomous Backend</span>
              <span className="text-sm text-slate-300">NASA-STD-3001 Biometrics</span>
            </div>
          </div>
        </div>

        {/* CRISP GIANT OUTLINE BRANDING WATERMARK */}
        <div className="pointer-events-none select-none px-6 pb-6 pt-4 text-center">
          <p
            aria-hidden="true"
            className="font-display text-[13.5vw] font-black leading-[0.78] tracking-tighter text-transparent"
            style={{
              WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.28)',
            }}
          >
            AEGISCREW
          </p>
        </div>
      </footer>

    </div>
  )
}
