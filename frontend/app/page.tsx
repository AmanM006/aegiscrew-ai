'use client'

import Link from 'next/link'
import { Play, ArrowRight, Activity, HeartPulse, Radiation, Brain, Lungs, BedDouble, FileText, Check, Sliders, Sun } from 'lucide-react'

export default function AstroKitHeroPage() {
  return (
    <div className="min-h-screen bg-[#040508] text-[#E2E8F0] antialiased selection:bg-[#E5A93C]/20 selection:text-[#E5A93C]">
      
      {/* Floating Left Utility Bar */}
      <aside className="fixed left-6 top-1/3 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center space-y-6 text-xs text-slate-500 font-mono">
        <a href="https://github.com/AmanM006/aegiscrew-ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
          <i className="fa-brands fa-github text-sm"></i>
        </a>
        <a href="#about" className="hover:text-white transition-colors"><Activity className="w-3.5 h-3.5" /></a>
        <a href="#universe" className="hover:text-white transition-colors"><Brain className="w-3.5 h-3.5" /></a>
        <div className="w-[1px] h-12 bg-slate-800"></div>
      </aside>

      {/* Top Header / Nav */}
      <header className="w-full px-8 py-6 z-50">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-xs font-mono font-bold tracking-tighter text-slate-200">
              Aegis
            </div>
            <span className="text-xs font-mono text-slate-400 tracking-wider">AEGISCREW <span className="text-white font-semibold">AI</span></span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            <a href="#about" className="hover:text-slate-200 transition-colors">AEGISCREW EXPLAINED</a>
            <a href="#universe" className="hover:text-slate-200 transition-colors">RADAR CONSTELLATION</a>
            <a href="#terminology" className="hover:text-slate-200 transition-colors">TERMINOLOGY</a>
          </nav>

          <div>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-sm border border-slate-700 hover:border-slate-400 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-mono font-medium tracking-widest text-slate-200 uppercase transition-all"
            >
              ENTER MISSION CONTROL
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1440px] mx-auto px-8 pt-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        <div className="lg:col-span-6 space-y-8 z-10">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white leading-tight">
              Welcome to <span className="text-[#E5A93C] font-normal">AegisCrew</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg font-light">
              From the beginning of spaceflight, ground controllers have watched over astronauts from Earth. As Artemis ventures to Mars across 22-minute communication blackouts, autonomous medical intelligence must stand watch.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Continuous bio-telemetry surveillance and clinical countermeasure synthesis with IBM Granite 3.0.
            </p>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 tracking-wider uppercase flex items-center space-x-2.5 transition-all shadow-sm"
            >
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>START NOW</span>
            </Link>
            <a href="#about" className="text-xs font-mono tracking-wider text-slate-400 hover:text-white uppercase transition-colors">
              LEARN MORE
            </a>
          </div>

          <div className="pt-8 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-950/80 border border-blue-600/40 flex items-center justify-center p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" alt="NASA" className="w-8 h-8 object-contain" />
            </div>
            <div className="text-[10px] font-mono leading-tight text-slate-400">
              <div className="font-bold text-slate-200">POWERED BY NASA OSDR</div>
              <div>NASA-STD-3001 &amp; IBM watsonx.ai</div>
            </div>
          </div>
        </div>

        {/* Hero Right: Celestial Reticle */}
        <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px]">
          <div className="relative w-72 h-72 rounded-full overflow-hidden shadow-2xl border border-slate-800/80 bg-radial from-slate-900 to-black">
            <img 
              src="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop" 
              alt="Mars Celestial Surface" 
              className="w-full h-full object-cover opacity-90 filter contrast-125 brightness-95"
            />
            <div className="absolute inset-0 border border-white/10 rounded-full"></div>
            <div className="absolute inset-4 border border-dashed border-white/20 rounded-full"></div>
          </div>

          <div className="absolute bottom-4 right-8 flex items-center space-x-3 bg-[#080D1A] p-2 rounded-sm border border-slate-800/90 shadow-lg">
            <div className="w-10 h-10 rounded-sm overflow-hidden">
              <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=200&auto=format&fit=crop" alt="Galaxy" className="w-full h-full object-cover" />
            </div>
            <div className="text-[9px] font-mono pr-2">
              <div className="text-slate-300 font-bold uppercase tracking-wider">DEEP SPACE TELEMETRY</div>
              <div className="text-slate-500">22-MIN MARS DELAY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: What is AegisCrew */}
      <section id="about" className="border-t border-[#141E33] py-24 px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-500">
                <span className="font-mono text-sm">01</span>
                <span className="text-[9px] text-[#E5A93C]">◆</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                What is <span className="text-[#E5A93C]">AegisCrew AI</span>?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
              AegisCrew AI is an autonomous, on-board Chief Medical Officer engineered for deep-space missions. When solar particle storms strike or cabin life support systems degrade, AegisCrew AI detects physiological degradation in real time and synthesizes deterministic clinical interventions.
            </p>
            <div className="pt-2">
              <Link href="/dashboard" className="text-xs font-mono tracking-widest text-slate-300 hover:text-white uppercase flex items-center space-x-2">
                <span>EXPLORE TELEMETRY PIPELINE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative min-h-[380px]">
            <div className="w-full h-80 rounded-sm overflow-hidden border border-slate-800 shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop" 
                alt="Nebula" 
                className="w-full h-full object-cover brightness-90 contrast-110"
              />
              <Link
                href="/dashboard"
                className="absolute bottom-6 left-6 flex items-center space-x-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-mono hover:border-white transition-all"
              >
                <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[9px]"><Play className="w-2.5 h-2.5 fill-black" /></span>
                <span className="text-[10px] tracking-wider uppercase">AEGISCREW IN ACTION · LIVE CONSOLE</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Horizon Silhouette */}
      <section className="border-t border-[#141E33] relative overflow-hidden bg-black">
        <div className="relative min-h-[440px] flex items-center justify-center px-8 py-20">
          <img 
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop" 
            alt="Horizon" 
            className="absolute inset-0 w-full h-full object-cover opacity-35 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
          <div className="relative z-10 max-w-2xl text-center space-y-6">
            <div className="flex items-center justify-center space-x-2 text-slate-500">
              <span className="font-mono text-sm">02</span>
              <span className="text-[10px] text-[#E5A93C]">◎</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              How Autonomous AI Protects <span className="text-[#E5A93C]">Deep-Space Crews</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed max-w-lg mx-auto">
              Every 5 minutes, 8 bio-telemetry streams from all 4 astronauts are evaluated against NASA flight medical limits. When autonomic tone collapses or radiation surges, clinical protocols are synthesized before cognitive exhaustion sets in.
            </p>
            <div className="pt-4">
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-sm border border-slate-700 bg-white text-black font-mono font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                START NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Radar Constellation */}
      <section id="universe" className="border-t border-[#141E33] py-28 px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                The Universe of <span className="text-[#E5A93C]">AegisCrew</span>
              </h2>
              <p className="text-xs text-slate-400 font-light max-w-md">
                Multi-modal intelligence mesh interconnecting physiological sensors, ML risk models, and IBM Granite RAG.
              </p>
            </div>

            <div className="relative w-full h-[460px] flex items-center justify-center overflow-hidden bg-[#080D1A] rounded-sm border border-slate-800">
              <div className="w-[400px] h-[400px] border border-white/5 rounded-full absolute"></div>
              <div className="w-[280px] h-[280px] border border-dashed border-white/10 rounded-full absolute"></div>
              <div className="w-[160px] h-[160px] border border-white/10 rounded-full absolute"></div>
              <div className="relative z-10 w-20 h-20 rounded-full border border-slate-500 bg-black flex flex-col items-center justify-center text-center p-1 shadow-2xl">
                <span className="text-[10px] font-mono font-bold text-white tracking-tighter">AegisCrew</span>
                <span className="text-[8px] font-mono text-sky-400">CORE</span>
              </div>
            </div>
          </div>

          <div id="terminology" className="lg:col-span-4 space-y-6 pt-2">
            <h3 className="text-sm font-mono tracking-widest text-white uppercase border-b border-slate-800 pb-3">
              TERMINOLOGY &amp; STANDARDS
            </h3>
            <div className="space-y-4 text-xs font-mono">
              <div className="border-l-2 border-[#E5A93C] pl-3 space-y-1">
                <div className="text-slate-200 font-semibold">NASA-STD-3001</div>
                <p className="text-[11px] text-slate-500 font-sans">Space Flight Human-System Standard for crew vitals &amp; environmental safety.</p>
              </div>
              <div className="border-l-2 border-slate-800 pl-3 space-y-1">
                <div className="text-slate-300">NASA SP-2010-3407</div>
                <p className="text-[11px] text-slate-500 font-sans">Flight Surgeon Medical Checklist &amp; Clinical Countermeasure Protocols.</p>
              </div>
              <div className="border-l-2 border-slate-800 pl-3 space-y-1">
                <div className="text-slate-300">IBM Granite 3.0</div>
                <p className="text-[11px] text-slate-500 font-sans">8B-parameter instruct enterprise LLM for clinical RAG countermeasure synthesis.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#141E33] py-10 px-8 bg-[#020306] text-slate-500 font-mono text-[11px]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <span className="text-slate-300 font-bold tracking-wider uppercase">AEGISCREW AI</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">Designed for IBM Bob AI Builders Challenge</span>
          </div>
          <div className="text-slate-600 text-[10px]">
            © 2026 AegisCrew AI · Grounded in NASA-STD-3001 &amp; SP-2010-3407
          </div>
        </div>
      </footer>

    </div>
  )
}
