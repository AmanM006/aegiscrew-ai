'use client'

/**
 * Voice Interface for AegisCrew AI
 * Uses Web Speech API (SpeechRecognition + SpeechSynthesis) — no key required.
 * Real operational justification: astronaut in EVA suit gloves cannot type.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'

interface Props {
  onTranscript: (text: string) => void  // callback when voice input is ready
  speakText?: string                    // text to speak (set to trigger TTS)
  disabled?: boolean
}

// Browser compatibility shim — cast to any to avoid TS lib targeting issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

function getSpeechRecognition(): AnySpeechRecognition | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useSpeechAvailable(): boolean {
  return !!getSpeechRecognition()
}

export default function VoiceInterface({ onTranscript, speakText, disabled }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null)

  useEffect(() => {
    setSupported(!!getSpeechRecognition())
  }, [])

  // Cancel any ongoing speech on mount/unmount to prevent voiceover replay
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognition()
    if (!SpeechRecognitionAPI || listening || disabled) return
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognizerRef.current = recognition

    recognition.onstart = () => setListening(true)
    recognition.onend   = () => setListening(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        onTranscript(text)
        setTranscript('')
      }
    }

    recognition.onerror = () => setListening(false)
    recognition.start()
  }, [listening, disabled, onTranscript])

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop()
    setListening(false)
  }, [])

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      {/* Live transcript display */}
      {transcript && (
        <div className="flex-1 px-2 py-1 rounded bg-[#080D1A] border border-sky-500/30 text-[9px] font-mono text-sky-300 truncate max-w-[200px]">
          {transcript}
        </div>
      )}

      {/* Mic button */}
      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        disabled={disabled}
        title={listening ? 'Release to send' : 'Hold to speak — e.g. "Status on Commander Vance"'}
        className={`relative p-2 rounded-lg border text-[10px] font-mono transition-all ${
          listening
            ? 'border-red-500/60 bg-red-950/40 text-red-300'
            : 'border-[#162033] bg-[#080D1A] text-slate-400 hover:border-sky-500/40 hover:text-sky-300'
        } disabled:opacity-40`}
      >
        {listening ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span
              className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-400 -mt-0.5 -mr-0.5 animate-ping"
              style={{ animationDuration: '0.75s' }}
            />
          </>
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {/* TTS indicator */}
      {speakText && (
        <Volume2 className="w-3 h-3 text-emerald-500 animate-pulse" />
      )}
    </div>
  )
}
