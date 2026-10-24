import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { setScene } from '../lib/audio'
import { VIDEO_FPS } from './doorTrack'
import { doorClip, doorOpen, frameToShow, INTRO_POSTER, introSource, progressOfFrame, ROOM_SRC, ROOM_SRCSET, videoFrame } from './intro'

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
// screen. One plain video, scrubbed by your scroll: every frame is a keyframe so seeking is instant.
//
// Steadiness: the footage is 25 frames a second, so a slow scroll crosses a frame boundary every few pixels. A hand
// that wobbles there would flip the picture back and forth, so a frame stays on screen until you have moved a good
// way past it (HOLD_FRAMES). When you stop, it settles on the nearest whole frame. The doorway and the room are
// drawn for that same frame, so the picture and the cut-out never disagree.
const SETTLE_MS = 140

function Walk() {
  const video = useRef<HTMLVideoElement>(null)
  const shown = useRef(-1)
  const settle = useRef(0)
  const drawn = useMotionValue(0)
  const [src, setSrc] = useState(introSource)
  const { w, h } = useViewport()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 26, mass: 0.5 })
  const clipPath = useTransform(drawn, (v) => doorClip(v, w, h))
  const zoom = useTransform(drawn, (v) => 0.62 + 0.38 * doorOpen(v))

  function showFrame(frame: number): void {
    const el = video.current
    if (!el || !Number.isFinite(el.duration)) return
    // aimed at the middle of the frame so rounding can never land on the one before
    el.currentTime = Math.min((frame + 0.5) / VIDEO_FPS, el.duration - 0.001)
  }

  function update(progress: number, settled: boolean): void {
    const frame = frameToShow(shown.current, videoFrame(progress), settled)
    if (frame !== shown.current) {
      shown.current = frame
      showFrame(frame)
    }
    drawn.set(progressOfFrame(shown.current, progress))
  }

  useMotionValueEvent(smooth, 'change', (v) => {
    setScene('walk', v)
    update(v, false)
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => update(smooth.get(), true), SETTLE_MS)
  })

  useEffect(() => () => window.clearTimeout(settle.current), [])

  // A seek asked for before the file's header arrived is dropped, so it is replayed once the video can show a
  // frame. A 1440p file the device cannot decode falls back to 1080p.
  useEffect(() => {
    const el = video.current
    if (!el) return
    const replay = () => {
      if (shown.current >= 0) showFrame(shown.current)
    }
    const failed = () => setSrc((s) => (s.endsWith('intro-1440.mp4') ? s.replace('intro-1440', 'intro-1080') : s))
    el.addEventListener('loadedmetadata', replay)
    el.addEventListener('error', failed)
    replay()
    return () => {
      el.removeEventListener('loadedmetadata', replay)
      el.removeEventListener('error', failed)
    }
  }, [src])

  return (
    <>
      <div className="absolute inset-0">
        <video ref={video} className="h-full w-full object-cover" src={src} poster={INTRO_POSTER} muted playsInline preload="auto" />
        <div className="absolute inset-0 bg-gradient-to-b from-room/45 via-transparent to-room/70" />
      </div>
      <motion.div className="absolute inset-0 bg-room" style={{ clipPath, willChange: 'clip-path' }}>
        <motion.div className="absolute inset-0" style={{ scale: zoom, transformOrigin: '50% 58%', willChange: 'transform' }}>
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
