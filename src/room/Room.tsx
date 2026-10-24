import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { setScene } from '../lib/audio'
import { VIDEO_FPS, VIDEO_FRAMES } from './doorTrack'
import { planFrames } from './frames'
import type { Slot } from './frames'
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
// video sit on top of each other, one on the frame you are at and one on the next, and the top one fades in as
// you move between them. The two trade places as you cross a frame, so the frame you are looking at is never
// the one being re-seeked (that is what makes a paused scroll look shaky). Every frame is a keyframe, so seeking
// is instant, and a spring smooths the wheel.
function Walk() {
  const videos = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null])
  const held = useRef<[number, number]>([-1, -1])
  const fade0 = useMotionValue(1)
  const fade1 = useMotionValue(0)
  const [src] = useState(introSource)
  const { w, h } = useViewport()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 26, mass: 0.5 })
  const clipPath = useTransform(smooth, (v) => doorClip(v, w, h))
  const zoom = useTransform(smooth, (v) => 0.62 + 0.38 * doorOpen(v))
  const glow = useTransform(smooth, (v) => 0.4 * (1 - doorOpen(v)))

  // Put a frame on a video, aiming at the middle of it so rounding can never land on the one before.
  function show(slot: Slot, frame: number): void {
    const el = videos.current[slot]
    if (!el || !Number.isFinite(el.duration)) return
    held.current[slot] = frame
    el.currentTime = Math.min((frame + 0.5) / VIDEO_FPS, el.duration - 0.001)
  }

  useMotionValueEvent(smooth, 'change', (v) => {
    setScene('walk', v)
    const f = videoFrame(v)
    const frame = Math.min(VIDEO_FRAMES - 1, Math.floor(f))
    const next = Math.min(VIDEO_FRAMES - 1, frame + 1)
    const { under, over, seeks } = planFrames(held.current, frame, next)
    for (const [slot, to] of seeks) show(slot, to)
    // the video on top fades in over the one underneath
    const [lower, upper] = under === 0 ? [fade0, fade1] : [fade1, fade0]
    lower.set(1)
    upper.set(frame === next ? 0 : f - frame)
    const lowerEl = videos.current[under]
    const upperEl = videos.current[over]
    if (lowerEl) lowerEl.style.zIndex = '0'
    if (upperEl) upperEl.style.zIndex = '1'
  })

  return (
    <>
      <div className="absolute inset-0">
        <motion.video
          ref={(el) => {
            videos.current[0] = el
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: fade0 }}
          src={src}
          poster={INTRO_POSTER}
          muted
          playsInline
          preload="auto"
        />
        <motion.video
          ref={(el) => {
            videos.current[1] = el
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: fade1 }}
          src={src}
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-room/45 via-transparent to-room/70" />
      </div>
      <motion.div className="absolute inset-0 bg-room" style={{ clipPath, willChange: 'clip-path' }}>
        <motion.div className="absolute inset-0" style={{ scale: zoom, transformOrigin: '50% 58%', willChange: 'transform' }}>
          <RoomImage />
        </motion.div>
        {/* light spilling out through the door: a warm wash that fades as the door opens (opacity only, so it costs nothing to animate) */}
        <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: glow, background: 'rgb(255 214 150)' }} />
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
