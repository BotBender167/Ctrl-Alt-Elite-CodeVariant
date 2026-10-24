import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { setScene } from '../lib/audio'
import { doorClip, doorOpen, INTRO, INTRO_POSTER, introSource, ROOM_SRC, ROOM_SRCSET } from './intro'

export type RoomMode = 'outside' | 'inside'

const SEEK_EPSILON = 0.008

function useViewport(): { w: number; h: number } {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = (): void => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

function RoomImage() {
  return (
    <div className="stage-wrap grid place-items-center">
      <div className="stage">
        <img
          src={ROOM_SRC}
          srcSet={ROOM_SRCSET}
          sizes="100vw"
          alt=""
          width={3840}
          height={2226}
          decoding="async"
          className="h-full w-full select-none"
          draggable={false}
        />
        <div className="light-bulb" />
      </div>
    </div>
  )
}

// The walk. Purpose: arrival. You walk up to the house yourself, and the last stretch of scrolling swings
// the door open onto the room: the room is drawn through a slit where the door is, and the slit widens
// until it is the whole screen. A spring smooths the wheel so a notchy mouse still glides, and the video
// has a keyframe on every frame so seeking is instant.
function Walk() {
  const video = useRef<HTMLVideoElement>(null)
  const [src] = useState(introSource)
  const { w, h } = useViewport()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 })
  const clipPath = useTransform(smooth, (v) => doorClip(doorOpen(v), w, h))
  const roomOpacity = useTransform(smooth, (v) => (v < INTRO.doorStart - 0.005 ? 0 : 1))
  const spill = useTransform(smooth, (v) => 1 + 0.45 * (1 - doorOpen(v)))
  const zoom = useTransform(smooth, (v) => 0.8 + 0.2 * doorOpen(v))
  const filter = useTransform(spill, (s) => `brightness(${s.toFixed(3)})`)

  useMotionValueEvent(smooth, 'change', (v) => {
    setScene('walk', v)
    const el = video.current
    if (!el || !Number.isFinite(el.duration)) return
    const t = Math.min(1, Math.max(0, v / INTRO.videoEnd)) * (el.duration - 0.04)
    if (Math.abs(el.currentTime - t) > SEEK_EPSILON) el.currentTime = t
  })

  return (
    <>
      <div className="absolute inset-0">
        <video ref={video} className="h-full w-full object-cover" src={src} poster={INTRO_POSTER} muted playsInline preload="auto" />
        <div className="absolute inset-0 bg-gradient-to-b from-room/45 via-transparent to-room/70" />
      </div>
      <motion.div className="absolute inset-0 bg-room" style={{ clipPath, opacity: roomOpacity, filter }}>
        <motion.div className="absolute inset-0" style={{ scale: zoom, transformOrigin: '50% 58%' }}>
          <RoomImage />
        </motion.div>
      </motion.div>
    </>
  )
}

// Two places, one continuous story. Outside is the house where the dead projects rest (the scrolling
// video). Inside is the investigation room where each one gets examined, with a lamp that is slowly dying.
export function Room({ mode }: { mode: RoomMode }) {
  const reduce = useReducedMotion()
  const walking = mode === 'outside' && !reduce

  useEffect(() => {
    if (!walking) setScene('room', 1)
  }, [walking])

  return (
    <div className="fixed inset-0 overflow-hidden bg-room" aria-hidden="true">
      {walking ? <Walk /> : <RoomImage />}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgb(0 0 0 / 0.6) 100%)' }}
      />
    </div>
  )
}
