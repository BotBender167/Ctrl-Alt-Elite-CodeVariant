import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { setScene } from '../lib/audio'
import { VIDEO_FPS, VIDEO_FRAMES } from './doorTrack'
import { doorClip, doorOpen, INTRO_POSTER, introSource, ROOM_SRC, ROOM_SRCSET, videoFrame } from './intro'

export type RoomMode = 'outside' | 'inside'

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

// The walk. Purpose: arrival. You walk up to the house yourself and the door swings open in the footage.
// The room is drawn only inside the doorway, which follows the real door frame by frame (the witch who
// stands there is hidden behind it), and as the camera pushes in the doorway widens until the room fills the
// screen.
//
// Smoothness: the footage is 25 frames a second, which would step when you scroll slowly. So two copies of the
// video sit on top of each other, one on the frame you are at and one on the next, and the second fades in as
// you move between them. Every frame is a keyframe, so seeking is instant, and a spring smooths the wheel.
function Walk() {
  const first = useRef<HTMLVideoElement>(null)
  const second = useRef<HTMLVideoElement>(null)
  const asked = useRef<[number, number]>([-1, -1])
  const blend = useMotionValue(0)
  const [src] = useState(introSource)
  const { w, h } = useViewport()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 26, mass: 0.5 })
  const clipPath = useTransform(smooth, (v) => doorClip(v, w, h))
  const zoom = useTransform(smooth, (v) => 0.62 + 0.38 * doorOpen(v))
  const filter = useTransform(smooth, (v) => `brightness(${(1 + 0.5 * (1 - doorOpen(v))).toFixed(3)})`)

  // Ask a video for a frame, aiming at the middle of it so rounding can never land on the one before.
  function seek(el: HTMLVideoElement | null, frame: number, slot: 0 | 1): void {
    if (!el || !Number.isFinite(el.duration) || asked.current[slot] === frame) return
    asked.current[slot] = frame
    el.currentTime = Math.min((frame + 0.5) / VIDEO_FPS, el.duration - 0.001)
  }

  useMotionValueEvent(smooth, 'change', (v) => {
    setScene('walk', v)
    const f = videoFrame(v)
    const i = Math.min(VIDEO_FRAMES - 1, Math.floor(f))
    const next = Math.min(VIDEO_FRAMES - 1, i + 1)
    seek(first.current, i, 0)
    seek(second.current, next, 1)
    blend.set(i === next ? 0 : f - i)
  })

  return (
    <>
      <div className="absolute inset-0">
        <video ref={first} className="h-full w-full object-cover" src={src} poster={INTRO_POSTER} muted playsInline preload="auto" />
        <motion.video ref={second} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: blend }} src={src} muted playsInline preload="auto" />
        <div className="absolute inset-0 bg-gradient-to-b from-room/45 via-transparent to-room/70" />
      </div>
      <motion.div className="absolute inset-0 bg-room" style={{ clipPath, filter }}>
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
