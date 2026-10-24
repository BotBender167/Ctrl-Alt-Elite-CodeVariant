import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Route transition: enters from slightly below, leaves upward and quicker (exits should not make anyone wait).
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(18px)' }}
      animate={{ opacity: 1, transform: reduce ? 'none' : 'translateY(0px)' }}
      exit={{
        opacity: 0,
        transform: reduce ? 'none' : 'translateY(-10px)',
        transition: { duration: 0.2, ease: EASE_OUT },
      }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {children}
    </motion.main>
  )
}

// Staggered entrance for list items and stacked blocks, capped so long lists never feel slow.
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
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(14px)' }}
      animate={{ opacity: 1, transform: reduce ? 'none' : 'translateY(0px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: reduce ? 0 : 0.12 + Math.min(index, 10) * 0.045 }}
    >
      {children}
    </motion.div>
  )
}
