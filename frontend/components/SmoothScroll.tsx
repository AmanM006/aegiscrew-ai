'use client'

import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
}

export default function SmoothScroll({ children }: Props) {
  const lenisRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    let raf: number

    // Dynamic import so SSR is never affected
    import('lenis').then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })

      lenisRef.current = lenis

      function animate(time: number) {
        lenis.raf(time)
        raf = requestAnimationFrame(animate)
      }

      raf = requestAnimationFrame(animate)
    }).catch(() => {
      // Lenis unavailable — no smooth scroll, page still works
    })

    return () => {
      cancelAnimationFrame(raf)
      lenisRef.current?.destroy()
    }
  }, [])

  return <>{children}</>
}
