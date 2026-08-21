'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, ArrowRight, Activity, HeartPulse, Radiation, Brain, Lungs, BedDouble, FileText, Check, Sliders, Sun, X, Satellite, BookOpen, ExternalLink, Dna } from 'lucide-react'

export default function LuxuryAstroKitHeroPage() {
  const [activeTab, setActiveTab] = useState<number>(3)
  const [modalData, setModalData] = useState<{ title: string; subtitle: string; body: string } | null>(null)

  const standards = [
    {
      id: 'NASA-STD-3001',
      title: 'NASA-STD-3001',
      subtitle: 'NASA Space Flight Human-System Standard',
      desc: 'Crew health baselines, physiological constraint limits, and vital signs.',
      body: 'Volume 1 & 2: Crew Health, Habitability, Environmental Limits. Specifies strict thresholds for Heart Rate (45-120 bpm), SpO2 (>=95%), Core Temp (36.0-38.0°C), and 72-hr Sleep Debt (<4.5 hrs).',
    },
    {
      id: 'NASA SP-2010-3407',
      title: 'NASA SP-2010-3407',
      subtitle: 'NASA SP-2010-3407 Flight Surgeon Protocol',
      desc: 'Clinical countermeasure checklists and deep-space flight surgeon SOPs.',
      body: 'Standard Operating Procedures for Deep-Space Human Care. Contains clinical intervention codes: PROT-RAD-SPE-03 (Radiation Storm Shelter), PROT-ECLSS-CO2-02 (Hypercapnia Scrubber Flush), and PROT-CIRC-LIGHT-01 (Circadian Phototherapy).',
    },
    {
      id: 'IBM Granite 3.0',
      title: 'IBM watsonx.ai Granite 3.0',
      subtitle: 'ibm/granite-3-8b-instruct Clinical LLM',
      desc: '8B-parameter instruct clinical reasoning engine with NASA SP RAG.',
      body: 'State-of-the-art enterprise generative LLM with 8B parameters. Synthesizes multi-modal telemetry frames into executive briefings and countermeasure prescriptions with zero hallucination safeguards.',
    },
    {
      id: 'NASA OSDR Data',
      title: 'NASA OSDR Data',
      subtitle: 'NASA Open Science Data Repository',
      desc: 'Open Science Data Repository physiological and radiation timeseries dataset.',
      body: 'Contains 1,440 continuous 5-minute telemetry records over 30 mission days across 4 crew members, with authentic anomalies injected (SPE radiation flares, ECLSS CO2 leaks, and circadian exhaustion).',
    },
  ]

  return (
    <div className="min-h-screen bg-[#030509] text-[#E2E8F0] antialiased selection:bg-[#E5A93C]/20 selection:text-[#E5A93C] relative overflow-x-hidden">
      
      {/* Floating Left Utility Dock */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center space-y-4 p-2.5 rounded-full bg-[#080D1A]/80 backdrop-blur-xl border border-white/10 text-xs text-slate-400 font-mono shadow-2xl">
        <a href="https://github.com/AmanM006/aegiscrew-ai" target="_blank" rel="noreferrer" title="GitHub" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center hover:text-white transition-all">
          <i className="fa-brands fa-github text-sm"></i>
        </a>
        <Link href="/dashboard" title="Open Mission Control" className="w-8 h-8 rounded-full hover:bg-sky-500/20 flex items-center justify-center hover:text-sky-400 transition-all">
          <Satellite className="w-4 h-4" />
        </Link>
        <a href="#about" title="Architecture" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center hover:text-white transition-all">
          <Dna className="w-4 h-4" />
        </a>
        <a href="#universe" title="Radar Constellation" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center hover:text-white transition-all">
          <Activity className="w-4 h-4" />
        </a>
        <a href="#standards" title="NASA Standards" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center hover:text-white transition-all">
          <BookOpen className="w-4 h-4" />
        </a>
      </aside>

      {/* Floating Pill-Shaped Glass Navbar */}
      <nav className="sticky top-5 z-50 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-[#080D1A]/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-full bg-blue-950/90 border border-blue-500/30 flex items-center justify-center p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" alt="NASA" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono font-bold tracking-wider text-white">AEGISCREW</span>
              <span className="text-xs font-mono font-semibold text-sky-400">AI</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            <a href="#about" className="hover:text-white transition-colors">CHALLENGE</a>
            <a href="#universe" className="hover:text-white transition-colors">RADAR MESH</a>
            <a href="#standards" className="hover:text-white transition-colors">STANDARDS</a>
            <a href="#science" className="hover:text-white transition-colors">MARS PROTOCOLS</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-[11px] tracking-wider uppercase flex items-center space-x-1.5 transition-all shadow-lg shadow-sky-950"
            >
              <span>Mission Control</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-[1440px] mx-auto px-8 pt-16 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>NASA-STD-3001 Baseline · Artemis Mars Transit MET 142</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white leading-tight">
              Welcome to <span className="text-[#E5A93C] font-normal">AegisCrew</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-lg font-light">
              From the beginning of time, we have watched over space crews from Earth. As Artemis ventures to Mars across 22-minute communication blackouts, autonomous medical intelligence must stand watch.
            </p>

            <p className="text-xs text-slate-400 font-mono">
              Continuous bio-telemetry surveillance, deterministic risk scoring, and IBM Granite 3.0 clinical countermeasure synthesis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-xl"
            >
              <Satellite className="w-4 h-4" />
              <span>START MISSION CONTROL</span>
            </Link>
            <a href="#about" className="px-5 py-3 rounded-full bg-[#080D1A] border border-white/10 hover:border-slate-400 text-xs font-mono text-slate-300 uppercase tracking-wider transition-all">
              LEARN MORE
            </a>
          </div>

          <div className="pt-6 flex items-center space-x-6 text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
            <div>
              <div className="text-slate-200 font-bold">IBM watsonx.ai</div>
              <div>Granite 3.0 8B Instruct</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-800"></div>
            <div>
              <div className="text-slate-200 font-bold">NASA OSDR DATA</div>
              <div>1,440 Multi-Stream Frames</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-800"></div>
            <div>
              <div className="text-amber-400 font-bold">22-MIN MARS DELAY</div>
              <div>Autonomous Protocol Active</div>
            </div>
          </div>
        </div>

        {/* Hero Right Reticle */}
        <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px]">
          <Link href="/dashboard" className="relative w-80 h-80 rounded-full overflow-hidden shadow-2xl border border-slate-700/80 bg-black group cursor-pointer">
            <img 
              src="https://images-assets.nasa.gov/image/PIA23871/PIA23871~orig.jpg" 
              alt="Asteroid Surface" 
              className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-700 filter contrast-125"
            />
            <div className="absolute inset-0 border border-white/10 rounded-full"></div>
            <div className="absolute inset-4 border border-dashed border-white/20 rounded-full"></div>
          </Link>
        </div>
      </section>

      {/* Section 01: What is AegisCrew */}
      <section id="about" className="border-t border-[#141E33] py-28 px-8 max-w-[1440px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-500">
                <span className="font-mono text-sm">01</span>
                <span className="text-[9px] text-[#E5A93C]">◆</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
                What is <span className="text-[#E5A93C]">AegisCrew AI</span>?
              </h2>
            </div>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              AegisCrew AI is an autonomous, on-board Chief Medical Officer engineered for deep-space missions. When solar particle storms strike or cabin life support systems degrade, AegisCrew AI detects physiological degradation in real time and synthesizes deterministic clinical interventions.
            </p>
            <div className="pt-2">
              <Link href="/dashboard" className="text-xs font-mono tracking-widest text-slate-200 hover:text-white uppercase flex items-center space-x-2">
                <span>EXPLORE TELEMETRY PIPELINE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative min-h-[420px]">
            <div className="w-full h-96 rounded-lg overflow-hidden border border-slate-800 shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop" 
                alt="Andromeda Space" 
                className="w-full h-full object-cover brightness-95 contrast-110"
              />
              <Link
                href="/dashboard"
                className="absolute bottom-6 left-6 flex items-center space-x-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-mono hover:border-white transition-all shadow-xl"
              >
                <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[9px]"><Play className="w-2.5 h-2.5 fill-black" /></span>
                <span className="text-[10px] tracking-wider uppercase font-semibold">AEGISCREW IN ACTION · LIVE CONSOLE</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Radar Constellation & Standards */}
      <section id="universe" className="border-t border-[#141E33] py-28 px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
                The Universe of <span className="text-[#E5A93C]">AegisCrew</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-light max-w-md">
                Click on any sensor node to inspect the real-time physiological telemetry stream.
              </p>
            </div>

            <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-[#080D1A]/80 backdrop-blur-md border border-white/10 rounded-xl">
              <div className="w-[440px] h-[440px] border border-white/5 rounded-full absolute"></div>
              <div className="w-[320px] h-[320px] border border-dashed border-white/10 rounded-full absolute"></div>
              <div className="w-[190px] h-[190px] border border-white/10 rounded-full absolute"></div>
              <Link href="/dashboard" className="relative z-10 w-24 h-24 rounded-full border border-sky-500/40 bg-black flex flex-col items-center justify-center text-center p-1 shadow-2xl hover:scale-105 transition-transform">
                <span className="text-[11px] font-mono font-bold text-white tracking-tight">AegisCrew</span>
                <span className="text-[8px] font-mono text-sky-400 uppercase font-semibold">AI CORE</span>
              </Link>
            </div>
          </div>

          <div id="standards" className="lg:col-span-4 space-y-6 pt-2">
            <h3 className="text-xs font-mono tracking-widest text-white uppercase border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>TERMINOLOGY &amp; STANDARDS</span>
              <span className="text-[10px] text-slate-500 font-normal">Click to Inspect</span>
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              {standards.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setModalData(s)}
                  className="bg-[#080D1A]/80 backdrop-blur-md p-3 rounded-lg border border-white/10 cursor-pointer hover:border-amber-500/50 transition-all"
                >
                  <div className="text-slate-200 font-semibold flex items-center justify-between">
                    <span className="text-amber-400">{s.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Interactive 3 Tabs */}
      <section id="science" className="border-t border-[#141E33] py-28 px-8 max-w-[1440px] mx-auto space-y-10">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
            The science and data behind <span className="text-[#E5A93C]">AegisCrew</span> travels way beyond the stars.
          </h2>
          <p className="text-sm text-slate-400 font-light max-w-xl">
            Deterministic physiological mathematical models combined with enterprise generative AI reasoning to protect deep-space human life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-800 pb-3">
          <div
            onClick={() => setActiveTab(1)}
            className={`space-y-1 cursor-pointer pb-2 border-b-2 transition-all ${
              activeTab === 1 ? 'border-amber-500' : 'border-transparent'
            }`}
          >
            <div className={`text-[10px] font-mono uppercase ${activeTab === 1 ? 'text-amber-400' : 'text-slate-500'}`}>01</div>
            <div className={`flex items-center space-x-2 text-xs font-mono ${activeTab === 1 ? 'text-white font-bold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3" />
              <span>POTENTIAL APPLICATIONS</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab(2)}
            className={`space-y-1 cursor-pointer pb-2 border-b-2 transition-all ${
              activeTab === 2 ? 'border-amber-500' : 'border-transparent'
            }`}
          >
            <div className={`text-[10px] font-mono uppercase ${activeTab === 2 ? 'text-amber-400' : 'text-slate-500'}`}>02</div>
            <div className={`flex items-center space-x-2 text-xs font-mono ${activeTab === 2 ? 'text-white font-bold' : 'text-slate-400'}`}>
              <Sliders className="w-3 h-3" />
              <span>KEY COMPONENTS</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab(3)}
            className={`space-y-1 cursor-pointer pb-2 border-b-2 transition-all ${
              activeTab === 3 ? 'border-amber-500' : 'border-transparent'
            }`}
          >
            <div className={`text-[10px] font-mono uppercase ${activeTab === 3 ? 'text-amber-400' : 'text-slate-500'}`}>03</div>
            <div className={`flex items-center space-x-2 text-xs font-mono ${activeTab === 3 ? 'text-white font-bold' : 'text-slate-400'}`}>
              <Sun className="w-3 h-3 text-[#E5A93C]" />
              <span>USING AEGISCREW ON MARS</span>
            </div>
          </div>
        </div>

        {activeTab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#080D1A]/80 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <div className="lg:col-span-7 h-72 rounded-lg overflow-hidden border border-slate-700">
              <img src="https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=900&auto=format&fit=crop" alt="Deep Space" className="w-full h-full object-cover" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">DEEP SPACE APPLICATIONS</div>
              <h3 className="text-lg font-mono text-white font-semibold">Lunar Gateway, Mars Transit &amp; Habitats</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Scalable architecture for NASA Artemis Base Camp, Lunar Gateway orbital stations, and crewed Mars transit habitats where Earth telemetry latency exceeds medical reaction thresholds.
              </p>
              <Link href="/dashboard" className="inline-flex items-center space-x-2 text-xs font-mono text-sky-400 hover:text-sky-300 uppercase tracking-wider">
                <span>Open Full Mission Console</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#080D1A]/80 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <div className="lg:col-span-7 h-72 rounded-lg overflow-hidden border border-slate-700">
              <img src="https://images.unsplash.com/photo-1517976487541-b851944520e5?q=80&w=900&auto=format&fit=crop" alt="Cockpit" className="w-full h-full object-cover" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">SYSTEM ARCHITECTURE</div>
              <h3 className="text-lg font-mono text-white font-semibold">FastAPI Engine + Granite 3.0 Clinical RAG</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                High-performance mathematical physiological scoring engine built in Python, integrated with Pydantic v2 schemas and IBM Granite 3.0 instruct LLM for instantaneous automated countermeasure synthesis.
              </p>
              <Link href="/dashboard" className="inline-flex items-center space-x-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 uppercase tracking-wider">
                <span>Inspect Architecture Live</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#080D1A]/80 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <div className="lg:col-span-7 h-72 rounded-lg overflow-hidden border border-slate-700">
              <img src="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=900&auto=format&fit=crop" alt="Mars Surface" className="w-full h-full object-cover" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">MARS AUTONOMOUS OPERATIONS</div>
              <h3 className="text-lg font-mono text-white font-semibold">Autonomous Deep Space Intervention</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                When an anomaly is flagged, AegisCrew AI generates a clinical flight brief and issues exact pharmacological, EVA restriction, or storm shelter orders directly to the Mars crew without delay.
              </p>
              <Link href="/dashboard" className="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 hover:text-amber-300 uppercase tracking-wider">
                <span>LAUNCH LIVE MISSION CONTROL →</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Standards Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#080D1A] max-w-lg w-full p-6 rounded-xl border border-slate-700 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Satellite className="w-4 h-4 text-sky-400" />
                <h4 className="font-mono font-bold text-sm text-white">{modalData.title}</h4>
              </div>
              <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white font-mono text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="font-mono text-xs text-amber-400 font-semibold">{modalData.subtitle}</div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">{modalData.body}</p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
              <button onClick={() => setModalData(null)} className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-white">
                Dismiss
              </button>
              <Link href="/dashboard" className="px-4 py-1.5 rounded bg-sky-500 text-slate-950 font-mono font-bold text-xs">
                Open in Console →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#141E33] py-10 px-8 bg-[#020306] text-slate-500 font-mono text-[11px] relative z-10">
        <div className="max-w-[1440px] mx-auto flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <span className="text-slate-300 font-bold tracking-wider uppercase">AEGISCREW AI</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">Designed for IBM Bob AI Builders Challenge 2026</span>
          </div>
          <div className="text-slate-600 text-[10px]">
            © 2026 AegisCrew AI · Grounded in NASA-STD-3001 &amp; SP-2010-3407 · Powered by IBM watsonx.ai
          </div>
        </div>
      </footer>

    </div>
  )
}
