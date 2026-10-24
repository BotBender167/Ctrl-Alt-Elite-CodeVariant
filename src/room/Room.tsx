import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

export type RoomMode = 'outside' | 'inside'

const BASE = import.meta.env.BASE_URL
const CROSSFADE_EASE = [0.77, 0, 0.175, 1] as const

// Two places, one continuous story. Outside is the graveyard where dead projects rest (your video).
// Inside is the investigation room where each one gets examined. Moving between them is a slow crossfade
// so it feels like walking through a door, not like a page loading.
export function Room({ mode }: { mode: RoomMode }) {
  const reduce = useReducedMotion()
  const video = useRef<HTMLVideoElement>(null)
  const outside = mode === 'outside'
  const fade = reduce ? { duration: 0.2 } : { duration: 0.8, ease: CROSSFADE_EASE }

  useEffect(() => {
    const el = video.current
    if (!el || reduce) return
    if (outside) {
      el.currentTime = 0
      void el.play().catch(() => undefined)
    } else {
      el.pause()
    }
  }, [outside, reduce])

  return (
    <div className="fixed inset-0 overflow-hidden bg-room" aria-hidden="true">
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: outside ? 1 : 0 }} transition={fade}>
        {reduce ? (
          <img src={`${BASE}graveyard-end.jpg`} alt="" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={video}
            className="h-full w-full object-cover"
            src={`${BASE}graveyard.mp4`}
            poster={`${BASE}graveyard-start.jpg`}
            muted
            playsInline
            autoPlay
            preload="auto"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-room/55 via-transparent to-room/70" />
      </motion.div>

      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: outside ? 0 : 1 }} transition={fade}>
        <div className="stage-wrap hidden place-items-center min-[900px]:grid">
          <motion.div
            className="stage"
            initial={false}
            animate={{ transform: outside ? 'scale(1.05)' : 'scale(1)' }}
            transition={fade}
          >
            <img src={`${BASE}room.jpg`} alt="" className="h-full w-full select-none" draggable={false} />
            <div
              className="glowpulse absolute rounded-full"
              style={{
                left: '47%',
                top: '63%',
                width: '26%',
                aspectRatio: '1',
                translate: '-50% -50%',
                background: 'radial-gradient(circle, rgb(255 190 100 / 0.32), transparent 65%)',
                mixBlendMode: 'screen',
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgb(0 0 0 / 0.6) 100%)' }}
      />
    </div>
  )
}
