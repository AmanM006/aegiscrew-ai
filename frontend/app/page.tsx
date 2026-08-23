'use client'

import Link from 'next/link'
import {
  Activity,
  Shield,
  Radio,
  Cpu,
  ArrowRight,
  Database,
  Satellite,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black font-sans text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">

      {/* Top Navbar */}
      <header className="border-b border-[#141E33] bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-mono font-bold text-sm tracking-wider text-white">AEGISCREW</span>
              <span className="text-[10px] font-mono text-sky-400 ml-1.5 px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">
                AI CMO
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-mono text-slate-400">
            <a href="#architecture" className="hover:text-sky-400 transition-colors">Architecture</a>
            <a href="#crewtwins" className="hover:text-sky-400 transition-colors">Crew Twins</a>
            <a href="#granite" className="hover:text-sky-400 transition-colors">Granite 4 Engine</a>
            <a href="#standards" className="hover:text-sky-400 transition-colors">NASA Standards</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-sky-950"
            >
              <span>Launch Mission Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(0,0,0,0))]" />
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>IBM Bob AI Builders Challenge 2026 — Grand Prize Entry</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white uppercase">
              Autonomous Medical Intelligence for Deep Space Exploration
            </h1>
            <p className="text-sm sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed font-sans">
              Aboard human-crewed Artemis Mars Transit missions, a 22-minute speed-of-light radio delay makes real-time Earth medical oversight impossible. 
              <strong className="text-slate-200 font-semibold"> AegisCrew AI</strong> operates as an on-board Chief Medical Officer powered by IBM Granite 4, continuous NASA-STD-3001 biometric streaming, and aerospace black-box decision auditing.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-sky-950/80"
            >
              <Satellite className="w-4 h-4" />
              <span>ENTER MISSION CONTROL CENTER</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/AmanM006/aegiscrew-ai"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-lg bg-[#080D1A] border border-[#1E293B] hover:border-slate-500 text-slate-200 font-mono text-sm flex items-center space-x-2 transition-all"
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>View GitHub Repository</span>
            </a>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 text-left">
            <div className="p-4 rounded-lg bg-[#080D1A] border border-[#141E33]">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Mission Target</div>
              <div className="text-base font-bold text-white font-mono mt-1">Artemis Mars Transit</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Deep Space Habitat (MET 142)</div>
            </div>
            <div className="p-4 rounded-lg bg-[#080D1A] border border-[#141E33]">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Comms Blackout</div>
              <div className="text-base font-bold text-amber-400 font-mono mt-1">1,200s (20.0 min)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Speed-of-light one-way delay</div>
            </div>
            <div className="p-4 rounded-lg bg-[#080D1A] border border-[#141E33]">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Clinical AI Engine</div>
              <div className="text-base font-bold text-sky-400 font-mono mt-1">IBM Granite 4</div>
              <div className="text-[11px] text-slate-400 mt-0.5">NASA SP-2010-3407 RAG</div>
            </div>
            <div className="p-4 rounded-lg bg-[#080D1A] border border-[#141E33]">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Bio-Telemetry Data</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-1">1,440 NASA Frames</div>
              <div className="text-[11px] text-slate-400 mt-0.5">NASA-STD-3001 Baselines</div>
            </div>
          </div>

        </div>
      </section>

      {/* 4 Pillars Section */}
      <section id="architecture" className="py-20 px-6 max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono text-sky-400 uppercase tracking-widest">TECHNICAL SPECIFICATION</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">The Four Pillars of Deep-Space AI Medicine</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">Engineered with IBM Bob for the AI Builders Challenge (August 2026).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-6 rounded-xl bg-[#080D1A] border border-[#141E33] space-y-4">
            <div className="flex items-center justify-between border-b border-[#141E33] pb-3">
              <span className="font-mono text-2xl font-black text-sky-400">01</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">PHYSIOLOGY CORE</span>
            </div>
            <h3 className="text-base font-bold font-mono text-white">NASA-STD-3001 Bio-Telemetry Digital Twins</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingests continuous 5-minute telemetry across 8 vital streams: Heart Rate, HRV RMSSD (autonomic tone), SpO₂, Core Temp, Sleep Debt, Ambient CO₂, and PVT reaction latency.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#080D1A] border border-[#141E33] space-y-4">
            <div className="flex items-center justify-between border-b border-[#141E33] pb-3">
              <span className="font-mono text-2xl font-black text-sky-400">02</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">MATHEMATICAL MODELS</span>
            </div>
            <h3 className="text-base font-bold font-mono text-white">Three-Pillar Risk Engine &amp; Fatigue Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time composite scoring combining Fatigue Risk, Autonomic Tone Strain, and Cumulative Radiation Flux. Generates instant Traffic Light states (GREEN / AMBER / RED) for the mission crew.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#080D1A] border border-[#141E33] space-y-4">
            <div className="flex items-center justify-between border-b border-[#141E33] pb-3">
              <span className="font-mono text-2xl font-black text-sky-400">03</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">IBM GRANITE REASONER</span>
            </div>
            <h3 className="text-base font-bold font-mono text-white">IBM Granite 4 Clinical RAG &amp; SP-2010-3407</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizes multi-modal flight surgeon briefings and prescribes exact clinical SOPs cited directly from NASA Flight Surgeon manuals.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#080D1A] border border-[#141E33] space-y-4">
            <div className="flex items-center justify-between border-b border-[#141E33] pb-3">
              <span className="font-mono text-2xl font-black text-sky-400">04</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">MISSION SIMULATOR</span>
            </div>
            <h3 className="text-base font-bold font-mono text-white">Deep-Space Anomaly Stress Testing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive injection engine capable of generating SPE radiation jumps, ECLSS scrubber gas leaks, and chronic sleep deprivation to validate autonomous AI decision-making.
            </p>
          </div>

        </div>
      </section>

      {/* Crew Twins Section */}
      <section id="crewtwins" className="py-20 px-6 max-w-6xl mx-auto space-y-12 border-t border-[#141E33]">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono text-sky-400 uppercase tracking-widest">ASTRONAUT DIGITAL TWINS</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">4 Artemis Deep-Space Crew Profiles</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">Individualized physiological baselines grounded in NASA life sciences data.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'ASTRO-01', name: 'Elena Vance', role: 'Commander / Pilot', hr: '58 bpm', hrv: '62.5 ms', risk: 'Workload & Sleep Debt' },
            { id: 'ASTRO-02', name: 'Mark Jensen', role: 'Flight Engineer / EVA', hr: '62 bpm', hrv: '58.0 ms', risk: 'Radiation & Physical Strain' },
            { id: 'ASTRO-03', name: 'Dr. Aris Thorne', role: 'Science Officer', hr: '66 bpm', hrv: '52.0 ms', risk: 'Circadian Desynchrony' },
            { id: 'ASTRO-04', name: 'Sara Lin', role: 'Payload Specialist', hr: '55 bpm', hrv: '65.0 ms', risk: 'Environmental ECLSS Shifts' },
          ].map((crew) => (
            <div key={crew.id} className="p-5 rounded-xl bg-[#080D1A] border border-[#141E33] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-sky-400">{crew.id}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">HEALTHY</span>
              </div>
              <div>
                <div className="font-bold text-white text-sm">{crew.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{crew.role}</div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 space-y-1 pt-2 border-t border-[#141E33]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseline HR:</span>
                  <span className="text-slate-200">{crew.hr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseline HRV:</span>
                  <span className="text-slate-200">{crew.hrv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Risk:</span>
                  <span className="text-amber-400/90">{crew.risk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 border-t border-[#141E33] bg-[#02050E] text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">Ready to Inspect the Mission Telemetry?</h2>
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-sm shadow-xl shadow-sky-950 transition-all"
          >
            <span>Launch Mission Control Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#141E33] py-6 px-8 text-center text-xs text-slate-500 font-mono bg-[#030610]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div>AegisCrew AI · Built with IBM Bob for the AI Builders Challenge 2026</div>
          <div>Powered by IBM watsonx.ai &amp; Granite 4 · NASA-STD-3001</div>
        </div>
      </footer>

    </div>
  )
}
