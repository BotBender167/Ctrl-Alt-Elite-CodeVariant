import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { setScene } from '../lib/audio'
import { VIDEO_FPS } from './doorTrack'
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
// screen. One plain video, scrubbed by your scroll: every frame is a keyframe so seeking is instant.
//
// Flow: the scroll is smoothed by a soft spring, and the video simply follows it, with no holding or snapping to
// whole frames. Only one seek is ever in flight; when it lands, the latest wanted moment is requested, so a fast
// scroll glides instead of queueing seeks and jumping. The doorway is drawn for the same smoothed position.
function Walk() {
  const video = useRef<HTMLVideoElement>(null)
  const wanted = useRef(0)
  const drawn = useMotionValue(0)
  const [src, setSrc] = useState(introSource)
  const { w, h } = useViewport()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.6 })
  const clipPath = useTransform(drawn, (v) => doorClip(v, w, h))
  const zoom = useTransform(drawn, (v) => 0.62 + 0.38 * doorOpen(v))

  function seek(): void {
    const el = video.current
    if (!el || el.seeking || !Number.isFinite(el.duration)) return
    const time = Math.min(wanted.current, el.duration - 0.001)
    if (Math.abs(el.currentTime - time) > 0.001) el.currentTime = time
  }

  function follow(progress: number): void {
    wanted.current = (videoFrame(progress) + 0.5) / VIDEO_FPS
    drawn.set(progress)
    seek()
  }

  useMotionValueEvent(smooth, 'change', (v) => {
    setScene('walk', v)
    follow(v)
  })

  // A seek asked for before the file's header arrived is dropped, so it is requested again once the video can show
  // a frame. A 1440p file the device cannot decode falls back to 1080p.
  useEffect(() => {
    const el = video.current
    if (!el) return
    const failed = () => setSrc((s) => (s.endsWith('intro-1440.mp4') ? s.replace('intro-1440', 'intro-1080') : s))
    el.addEventListener('loadedmetadata', seek)
    el.addEventListener('seeked', seek)
    el.addEventListener('error', failed)
    follow(smooth.get())
    return () => {
      el.removeEventListener('loadedmetadata', seek)
      el.removeEventListener('seeked', seek)
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
