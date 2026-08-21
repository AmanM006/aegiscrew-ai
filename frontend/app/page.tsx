'use client'

import Link from 'next/link'
import { Satellite, ArrowRight, ShieldCheck, Activity, BrainCircuit, Radiation, Radio, Flame, CheckCircle2, ChevronRight, Cpu } from 'lucide-react'

export default function HeroLandingPage() {
  return (
    <div className="min-h-screen bg-[#030610] text-[#E2E8F0] antialiased selection:bg-sky-500/20 selection:text-sky-300">
      
      {/* Top Navbar */}
      <header className="border-b border-[#141E33] px-8 py-4 sticky top-0 z-50 backdrop-blur-md bg-[#030610]/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-950/70 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Satellite className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-white text-sm tracking-tight">AEGISCREW</span>
              <span className="font-mono font-semibold text-sky-400 text-sm">AI</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-medium ml-1">IBM BOB 2026</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-mono text-slate-400">
            <a href="#mission" className="hover:text-slate-200 transition-colors">01. CHALLENGE</a>
            <a href="#architecture" className="hover:text-slate-200 transition-colors">02. ARCHITECTURE</a>
            <a href="#digital-twins" className="hover:text-slate-200 transition-colors">03. DIGITAL TWINS</a>
            <a href="#ibm-granite" className="hover:text-slate-200 transition-colors">04. IBM GRANITE 3.0</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-sky-950"
            >
              <span>Launch Mission Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-28 px-6 relative z-10 border-b border-[#141E33]">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>NASA-STD-3001 Grounded · Autonomous On-Board Chief Medical Officer</span>
          </div>

          {/* Title */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-mono leading-tight">
              AUTONOMOUS CREW MEDICINE FOR DEEP SPACE
            </h1>
            <p className="text-base sm:text-lg text-slate-400 font-sans max-w-3xl mx-auto leading-relaxed">
              Earth is 22 minutes away by radio. When a solar particle event strikes or life support scrubbers fail on the way to Mars, Earth ground surgeons cannot react in time. <strong className="text-slate-200">AegisCrew AI</strong> bridges the blackout with IBM Granite 3.0.
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
              <div className="text-base font-bold text-sky-400 font-mono mt-1">IBM Granite 3.0</div>
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
            <h3 className="text-base font-bold font-mono text-white">IBM Granite 3.0 Clinical RAG &amp; SP-2010-3407</h3>
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
          <div>Powered by IBM watsonx.ai &amp; Granite 3.0 · NASA-STD-3001</div>
        </div>
      </footer>

    </div>
  )
}
