import { useState, useEffect, useRef } from 'react'

// ─── Easing ───────────────────────────────────────────────────────────────────

/** Cubic ease-out: fast start, smooth landing */
const easeOutCubic = (t) => 1 - (1 - t) ** 3

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Animates a number from 0 to `target` over `durationMs`.
 * Only runs when `active` is true.
 */
export function useCountUp(target, { durationMs = 900, active = true } = {}) {
  const [value, setValue] = useState(0)

  const startRef = useRef(null)

  // ─── Animation ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const parsed = Number(target)

    if (!active || target == null || Number.isNaN(parsed)) {
      setValue(0)
      return
    }

    const end = Math.max(0, Math.floor(parsed))

    if (end === 0) {
      setValue(0)
      return
    }

    startRef.current = null
    let frame

    const step = (now) => {
      if (startRef.current == null) startRef.current = now

      const t = Math.min(1, (now - startRef.current) / durationMs)
      setValue(Math.round(easeOutCubic(t) * end))

      if (t < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, active])

  return value
}