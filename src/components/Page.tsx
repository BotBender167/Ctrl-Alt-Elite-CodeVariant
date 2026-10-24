import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { EASE_OUT } from '../lib/motion'

// Route transition. Purpose: spatial consistency. New screens rise from below the one you left, and
// the old screen leaves quickly upward so navigation never feels like it is waiting on an animation.
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    ref.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.main
      ref={ref}
      id="main"
      tabIndex={-1}
      className={`outline-none ${className}`}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(16px)' }}
      animate={{ opacity: 1, transform: reduce ? 'none' : 'translateY(0px)' }}
      exit={{
        opacity: 0,
        transform: reduce ? 'none' : 'translateY(-8px)',
        transition: { duration: 0.18, ease: EASE_OUT },
      }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {children}
    </motion.main>
  )
}

// A screen that only fades. Used where children are positioned against the viewport (the board and its
// case file), because a transformed ancestor would break fixed positioning.
export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <motion.main
      ref={ref}
      id="main"
      tabIndex={-1}
      className={`outline-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.main>
  )
}

// Staggered entrance for blocks on a screen. Purpose: order. The eye is led from the title down to the
// first thing to do. The delay is capped so long lists never feel slow.
export function Reveal({
  index = 0,
  className = '',
  children,
}: {
  index?: number
  className?: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(12px)' }}
      animate={{ opacity: 1, transform: reduce ? 'none' : 'translateY(0px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: reduce ? 0 : 0.1 + Math.min(index, 8) * 0.05 }}
    >
      {children}
    </motion.div>
  )
}
