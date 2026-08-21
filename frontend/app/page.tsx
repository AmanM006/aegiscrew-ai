'use client'

import Link from 'next/link'
import { Search, Play, ArrowRight, Clock, Share2 } from 'lucide-react'

export default function NasaEarthlingHeroPage() {
  return (
    <div className="min-h-screen bg-[#05070B] text-[#E2E8F0] antialiased selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* HERO SECTION WITH NASA CURVED HORIZON PANORAMA */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#030408] bg-[radial-gradient(circle_at_50%_15%,rgba(56,189,248,0.15)_0%,transparent_65%)]">
        
        {/* Background Image of Earth Curve Horizon */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=90&w=2400&auto=format&fit=crop')" }}
        />
        
        {/* Gradient Overlay fading into dark body */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030408]/75 via-[#030408]/20 via-[#05070B]/40 to-[#05070B] pointer-events-none" />

        {/* NASA TOP NAVBAR (EXACT REPLICA) */}
        <header className="w-full px-8 py-6 z-30 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <span className="font-extrabold text-2xl tracking-tighter text-white">NASA</span>
              <span className="text-slate-600 font-light text-lg">|</span>
              <span className="text-xs font-mono tracking-widest text-slate-300 uppercase">AEGISCREW <span className="text-sky-400">AI</span></span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-7 text-xs font-light text-slate-300">
              <a href="#what-we-do" className="hover:text-white transition-colors">Missions</a>
              <Link href="/dashboard" className="hover:text-white transition-colors">Bio-Telemetry</Link>
              <a href="#what-we-do" className="hover:text-white transition-colors">Granite AI</a>
              <a href="#what-we-do" className="hover:text-white transition-colors">NASA-STD-3001</a>
              <a href="https://github.com/AmanM006/aegiscrew-ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <Link href="/dashboard" className="hover:text-white transition-colors font-medium text-sky-300">Console</Link>
              <a href="https://github.com/AmanM006/aegiscrew-ai" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                <Share2 className="w-3.5 h-3.5" />
              </a>
            </nav>
          </div>
        </header>

        {/* CENTER HERO CONTENT ("Welcome aboard, Earthling") */}
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 z-20 pt-16 pb-12">
          <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white font-sans">
            Welcome aboard, Earthling
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Artemis Mars Transit · Autonomous Deep-Space Chief Medical Officer standing 24/7 watch over crew physiological resilience across 22-minute communication blackouts.
          </p>

          {/* Centered Command Search Pill */}
          <div className="max-w-md mx-auto pt-2">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                window.location.href = '/dashboard'
              }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/15 rounded-full px-5 py-3 flex items-center justify-between text-xs text-slate-300 shadow-2xl transition-all focus-within:border-sky-500/60"
            >
              <input 
                type="text" 
                placeholder="Search astronaut vitals, radiation storms, clinical protocols..." 
                className="bg-transparent border-none outline-none w-full text-slate-200 placeholder:text-slate-400 text-xs font-light"
              />
              <button type="submit" className="text-slate-400 hover:text-sky-400 pl-3">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* FLOATING LIVE STREAM PILL */}
        <div className="max-w-4xl mx-auto px-6 pb-20 text-center z-20">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center space-x-3.5 px-6 py-3 rounded-full bg-[#080E1A]/80 backdrop-blur-xl border border-white/20 shadow-2xl text-white transition-all hover:bg-slate-900 hover:border-white/40 group"
          >
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </span>
            <div className="text-left font-sans">
              <div className="text-[9px] font-mono text-sky-400 uppercase tracking-widest font-semibold">LIVE BIO-TELEMETRY STREAM</div>
              <div className="text-xs font-medium text-slate-100">Artemis II-M Mars Transit · Mission Day 142 Telemetry Console</div>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 02: WHAT DOES AEGISCREW DO? */}
      <section id="what-we-do" className="py-24 px-8 max-w-5xl mx-auto text-center space-y-6 relative z-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
          What Does AegisCrew Do?
        </h2>

        <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed max-w-3xl mx-auto">
          We reach for new heights and safeguard the human frontier for deep space exploration. Thousands of miles away on the voyage to Mars, radio signals take 22 minutes to reach Earth. When solar flares strike or atmospheric scrubbers fail, <strong className="text-slate-200 font-medium">AegisCrew AI</strong> synthesizes autonomous, deterministic clinical countermeasures using <strong className="text-sky-400 font-medium">IBM Granite 3.0</strong> and <strong className="text-slate-200 font-medium">NASA-STD-3001</strong> ground truth to keep astronauts alive.
        </p>

        <div className="pt-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-medium text-slate-200 uppercase tracking-widest transition-all"
          >
            <span>Enter Mission Control</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* SECTION 03: NASA 4-COLUMN CARDS & EVENTS STRIP */}
      <section className="py-16 px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link href="/dashboard" className="bg-[#080C16] border border-[#141C2E] rounded-lg overflow-hidden flex flex-col justify-between group hover:border-[#243452] transition-all">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images-assets.nasa.gov/image/PIA23871/PIA23871~orig.jpg" 
                alt="Asteroid Bennu" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-black/70 text-slate-300 border border-white/10">
                DOSIMETRY
              </span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-sky-400 transition-colors">
                SPE Radiation Surge &amp; Solar Flare Storm Shelter Protocols
              </h3>
              <p className="text-xs text-slate-400 font-light line-clamp-2">
                Real-time detection of solar particle flux surges above 10.0 mGy/day triggering shelter ingress.
              </p>
            </div>
          </Link>

          <Link href="/dashboard" className="bg-[#080C16] border border-[#141C2E] rounded-lg overflow-hidden flex flex-col justify-between group hover:border-[#243452] transition-all">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1517976487541-b851944520e5?q=80&w=600&auto=format&fit=crop" 
                alt="Cockpit" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-black/70 text-slate-300 border border-white/10">
                PHYSIOLOGY
              </span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-sky-400 transition-colors">
                NASA-STD-3001 Continuous 8-Vital Astronaut Digital Twins
              </h3>
              <p className="text-xs text-slate-400 font-light line-clamp-2">
                HRV autonomic tone, SpO2, core body temp, sleep debt, and PVT reaction speed surveillance.
              </p>
            </div>
          </Link>

          <Link href="/dashboard" className="bg-[#080C16] border border-[#141C2E] rounded-lg overflow-hidden flex flex-col justify-between group hover:border-[#243452] transition-all">
            <div className="h-44 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=600&auto=format&fit=crop" 
                alt="Solar Array" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-black/70 text-slate-300 border border-white/10">
                IBM GRANITE
              </span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-sky-400 transition-colors">
                IBM watsonx.ai Granite 3.0 Clinical RAG &amp; SP-2010-3407
              </h3>
              <p className="text-xs text-slate-400 font-light line-clamp-2">
                Automated Flight Surgeon executive briefings and deterministic clinical prescriptions.
              </p>
            </div>
          </Link>

          <div className="bg-[#080C16] border border-[#141C2E] rounded-lg p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">NASA Events &amp; Log</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>MET Day 142 · 14:00 UTC</span>
                  </div>
                  <div className="text-slate-200 text-xs font-medium">SPE Solar Surge Injected</div>
                  <p className="text-[11px] text-slate-400 font-sans">Radiation spike on Engineer Mark Jensen (87.4 mGy).</p>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>MET Day 142 · 16:30 UTC</span>
                  </div>
                  <div className="text-slate-200 text-xs font-medium">IBM Granite Countermeasure</div>
                  <p className="text-[11px] text-slate-400 font-sans">PROT-RAD-SPE-03 storm shelter ingress prescribed.</p>
                </div>
              </div>
            </div>

            <Link href="/dashboard" className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center space-x-1.5 pt-2 border-t border-slate-800">
              <span>Open Full Mission Console</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-10 px-8 text-center text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-base text-white">NASA</span>
            <span className="text-slate-600">|</span>
            <span>AegisCrew AI · Built with IBM Bob for the AI Builders Challenge 2026</span>
          </div>
          <div>
            Powered by IBM watsonx.ai Granite 3.0 · Grounded in NASA-STD-3001 &amp; SP-2010-3407
          </div>
        </div>
      </footer>

    </div>
  )
}
