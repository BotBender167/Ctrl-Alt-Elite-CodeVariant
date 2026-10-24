import { motion, useReducedMotion } from 'motion/react'

export type WorldMode = 'hero' | 'app'

const CAMERA_EASE = [0.77, 0, 0.175, 1] as const
const IMG_W = 2000
const IMG_H = 1116
const SRC = `${import.meta.env.BASE_URL}world.webp`

// The camera dives toward the valley between the cliffs, where the traveller is looking.
const CAMERA = {
  hero: 'translateY(0%) scale(1)',
  app: 'translateY(-3%) scale(1.35)',
} as const

function Glow({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <div
      className="glowpulse pointer-events-none absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        aspectRatio: '1',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color}, transparent 65%)`,
        mixBlendMode: 'screen',
      }}
    />
  )
}

export function World({ mode }: { mode: WorldMode }) {
  const reduce = useReducedMotion()
  const timing = reduce ? { duration: 0.2 } : { duration: 0.9, ease: CAMERA_EASE }

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: '50% 68%' }}
        initial={false}
        animate={{ transform: mode === 'hero' ? CAMERA.hero : CAMERA.app }}
        transition={timing}
      >
        {/* Cover-fit box with the image's own aspect ratio, so glows can be placed in image percentages. */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: `max(100vw, calc(100dvh * ${IMG_W} / ${IMG_H}))`,
            height: `max(100dvh, calc(100vw * ${IMG_H} / ${IMG_W}))`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src={SRC}
            alt=""
            width={IMG_W}
            height={IMG_H}
            fetchPriority="high"
            className="h-full w-full select-none object-cover"
            draggable={false}
          />
          <Glow x={33.8} y={64.5} size={14} color="rgb(246 178 90 / 0.55)" />
          <Glow x={55.2} y={73.5} size={7} color="rgb(160 245 240 / 0.6)" />
        </div>
      </motion.div>

      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, transparent 45%, rgb(6 14 20 / 0.5) 100%)' }}
      />
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={false}
        animate={{ opacity: mode === 'hero' ? 0.06 : 0.38 }}
        transition={timing}
      />
    </div>
  )
}
