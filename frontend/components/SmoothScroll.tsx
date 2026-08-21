'use client'

import { useEffect } from 'react'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: any = null
    const initLenis = async () => {
      try {
        const Lenis = (await import('lenis')).default
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 2,
        })

        function raf(time: number) {
          lenis.raf(time)
          requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)
      } catch (e) {
        console.warn('Lenis smooth scroll running in fallback mode', e)
      }
    }

    initLenis()

    return () => {
      if (lenis) lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
