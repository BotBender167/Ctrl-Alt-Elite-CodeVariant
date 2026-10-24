import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { FarArt, ForeArt, MidArt, SkyArt } from './art'

export type WorldMode = 'hero' | 'app'

const ORIGIN = '50% 80%'
const CAMERA_EASE = [0.77, 0, 0.175, 1] as const

interface Depth {
  scale: number
  y: number
}

// Nearer layers travel further, which sells the descent into the valley.
const DEPTH: Record<'sky' | 'far' | 'mid' | 'fore', Depth> = {
  sky: { scale: 1.05, y: 0 },
  far: { scale: 1.14, y: -1 },
  mid: { scale: 1.32, y: -2 },
  fore: { scale: 1.9, y: 14 },
}

function Layer({ mode, depth, children }: { mode: WorldMode; depth: Depth; children: ReactNode }) {
  const reduce = useReducedMotion()
  const hero = 'translateY(0%) scale(1)'
  const app = `translateY(${depth.y}%) scale(${depth.scale})`
  return (
    <motion.div
      className="absolute inset-0"
      style={{ transformOrigin: ORIGIN }}
      initial={false}
      animate={{ transform: mode === 'hero' ? hero : app }}
      transition={reduce ? { duration: 0.2 } : { duration: 0.9, ease: CAMERA_EASE }}
    >
      {children}
    </motion.div>
  )
}

export function World({ mode }: { mode: WorldMode }) {
  const reduce = useReducedMotion()
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-ink" aria-hidden="true">
      <Layer mode={mode} depth={DEPTH.sky}>
        <SkyArt />
      </Layer>
      <Layer mode={mode} depth={DEPTH.far}>
        <FarArt />
      </Layer>
      <Layer mode={mode} depth={DEPTH.mid}>
        <MidArt />
      </Layer>
      <Layer mode={mode} depth={DEPTH.fore}>
        <ForeArt />
      </Layer>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, transparent 40%, rgb(6 14 20 / 0.55) 100%)' }}
      />
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={false}
        animate={{ opacity: mode === 'hero' ? 0.08 : 0.62 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.9, ease: CAMERA_EASE }}
      />
    </div>
  )
}
