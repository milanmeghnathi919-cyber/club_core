import React, { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Animated number that counts up to its value on mount and whenever the
 * value changes (e.g. switching today / week / month on the dashboards).
 *
 * Zero dependencies: requestAnimationFrame + ease-out cubic.
 * Honors prefers-reduced-motion by jumping straight to the final value,
 * so the printed result is always byte-identical to a plain render.
 */
export const CountUp = ({ value, format, duration = 900, className = '' }) => {
  const parsed = Number(value)
  const target = Number.isFinite(parsed) ? parsed : 0

  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = displayRef.current

    if (from === target || prefersReducedMotion()) {
      displayRef.current = target
      setDisplay(target)
      return undefined
    }

    const startedAt = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      if (t === 1) {
        displayRef.current = target
      } else {
        displayRef.current = from + (target - from) * eased
      }
      setDisplay(displayRef.current)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  const rendered = format ? format(display) : `${Math.round(display)}`
  return <span className={className}>{rendered}</span>
}

export default CountUp
