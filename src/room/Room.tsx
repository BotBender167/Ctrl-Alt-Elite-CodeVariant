import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, useState } from 'react'
import { INTRO, INTRO_POSTER, introSource } from './intro'

export type RoomMode = 'outside' | 'inside'

const BASE = import.meta.env.BASE_URL
const SEEK_EPSILON = 0.008

// The haunted house, scrubbed by your scroll. Purpose: arrival. You walk up to the house yourself, and the
// last stretch of scrolling dissolves the video into the room behind it. A spring smooths the wheel so a
// notchy mouse still glides, and the video is encoded with a keyframe on every frame so seeking is instant.
function Walk() {
  const video = useRef<HTMLVideoElement>(null)
  const [src] = useState(introSource)
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 })
  const opacity = useTransform(smooth, [INTRO.fadeFrom, 1], [1, 0])

  useMotionValueEvent(smooth, 'change', (v) => {
    const el = video.current
    if (!el || !Number.isFinite(el.duration)) return
    const t = Math.min(1, Math.max(0, v / INTRO.videoEnd)) * (el.duration - 0.05)
    if (Math.abs(el.currentTime - t) > SEEK_EPSILON) el.currentTime = t
  })

  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <video ref={video} className="h-full w-full object-cover" src={src} poster={INTRO_POSTER} muted playsInline preload="auto" />
      <div className="absolute inset-0 bg-gradient-to-b from-room/55 via-transparent to-room/75" />
    </motion.div>
  )
}

// Two places, one continuous story. Outside is the house where the dead projects rest (the scrolling
// video). Inside is the investigation room where each one gets examined, with a lamp that is slowly dying.
export function Room({ mode }: { mode: RoomMode }) {
  const reduce = useReducedMotion()
  const walking = mode === 'outside' && !reduce

  return (
    <div className="fixed inset-0 overflow-hidden bg-room" aria-hidden="true">
      <div className="stage-wrap grid place-items-center">
        <div className="stage">
          <img src={`${BASE}room.jpg`} alt="" className="h-full w-full select-none" draggable={false} />
          <div className="light-bulb" />
        </div>
      </div>
      {walking && <Walk />}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgb(0 0 0 / 0.6) 100%)' }}
      />
    </div>
  )
}
