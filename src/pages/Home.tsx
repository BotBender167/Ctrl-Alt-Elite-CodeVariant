import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { SpeakerHigh } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Page'
import { Hub } from '../features/board/Hub'
import { RoomLight } from '../features/board/RoomLight'
import { CARD } from '../features/dnd/types'
import { useDraggable } from '../features/dnd/useDraggable'
import { useTitle } from '../hooks/useTitle'
import { enableSound } from '../lib/audio'
import { INTRO } from '../room/intro'
import { useSettings } from '../store'

const USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
const DEMOS = ['BotBender167', 'octocat'] as const
const SHADOW = '[text-shadow:0_2px_24px_rgb(0_0_0/0.95)]'
const HANDOFF_MS = 380

// A line of the opening that is visible only while you are scrolling through its part of the walk.
// With three points it starts visible (the title is on screen before you scroll); with four it fades in too.
function Caption({ progress, at, className, children }: { progress: MotionValue<number>; at: number[]; className: string; children: ReactNode }) {
  const opacity = useTransform(progress, at, at.length === 3 ? [1, 1, 0] : [0, 1, 1, 0])
  const lift = useTransform(progress, at, at.length === 3 ? [0, 0, -10] : [14, 0, 0, -10])
  return (
    <motion.div className={`pointer-events-none fixed inset-x-0 px-5 text-center ${SHADOW} ${className}`} style={{ opacity, y: lift }}>
      {children}
    </motion.div>
  )
}

export default function Home() {
  useTitle()
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const lastUser = useSettings((s) => s.lastUser)
  const setLastUser = useSettings((s) => s.setLastUser)
  const sound = useSettings((s) => s.sound)
  const setSound = useSettings((s) => s.setSound)
  const field = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(lastUser ?? '')
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [ready, setReady] = useState(Boolean(reduce))
  const { scrollYProgress } = useScroll()

  // A reload keeps the scroll position, so read where we are on arrival as well as when it changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setReady(Boolean(reduce) || (max > 0 && window.scrollY / max >= INTRO.readyAt))
    })
    return () => cancelAnimationFrame(id)
  }, [reduce])
  useMotionValueEvent(scrollYProgress, 'change', (v) => setReady(Boolean(reduce) || v >= INTRO.readyAt))
  const roomOpacity = useTransform(scrollYProgress, [INTRO.doorEnd - 0.04, INTRO.readyAt], [0, 1])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0])
  const barHeight = useTransform(scrollYProgress, (v) => `${v * 100}%`)

  const user = name.trim().replace(/^@/, '')
  const drag = useDraggable({ type: CARD.id, payload: 'id', label: 'ID card', ariaLabel: 'Your ID card' })

  // Dropping the card on the profile circle is the scan. A bad username sends the card back with a reason.
  function scan(): boolean {
    if (!USER_RE.test(user)) {
      setError('That is not a GitHub username. Use letters, numbers and single hyphens.')
      return false
    }
    setError('')
    setLastUser(user)
    setScanning(true)
    window.setTimeout(() => navigate(`/u/${user}`), reduce ? 0 : HANDOFF_MS)
    return true
  }

  return (
    <Screen hold className="relative z-10">
      <div style={{ height: reduce ? 0 : `${INTRO.trackVh}vh` }} aria-hidden="true" />

      {!reduce && (
        <>
          <Caption progress={scrollYProgress} at={[0, 0.07, 0.14]} className="top-[11vh]">
            <h1 className="text-[clamp(44px,8vw,112px)] uppercase leading-[0.98] tracking-tight text-cream">
              Unfinished
              <br />
              Business
            </h1>
            <p className="mt-3 font-hand text-[clamp(24px,3.2vw,46px)] text-cream">Everyone has one.</p>
          </Caption>
          <Caption progress={scrollYProgress} at={[0.2, 0.27, 0.42, 0.49]} className="bottom-[16vh]">
            <p className="font-hand text-[clamp(26px,3.4vw,50px)] text-cream">Somewhere, a project is still waiting for you.</p>
          </Caption>
          <Caption progress={scrollYProgress} at={[0.5, 0.56, 0.64, 0.71]} className="bottom-[16vh]">
            <p className="font-hand text-[clamp(26px,3.4vw,50px)] text-cream">Let us go in and find it.</p>
          </Caption>
          <motion.div
            className={`pointer-events-none fixed inset-x-0 bottom-[5vh] flex flex-col items-center gap-2 text-sm uppercase tracking-[0.16em] text-cream ${SHADOW}`}
            style={{ opacity: hintOpacity }}
          >
            Scroll to walk in
            <span className="h-10 w-px bg-gradient-to-b from-cream to-transparent" aria-hidden="true" />
            {!sound && (
              <button
                type="button"
                className="pointer-events-auto mt-1 flex items-center gap-2 rounded-full bg-room/70 px-4 py-2 text-[13px] normal-case tracking-normal text-cream ring-1 ring-cream/25 backdrop-blur-sm transition-colors duration-150 hover:bg-room/90"
                onClick={() => {
                  setSound(true)
                  void enableSound()
                }}
              >
                <SpeakerHigh size={16} weight="bold" aria-hidden="true" /> Best with sound. Turn it on
              </button>
            )}
          </motion.div>
          <div className="pointer-events-none fixed right-5 top-1/2 h-28 w-0.5 -translate-y-1/2 bg-cream/20" aria-hidden="true">
            <motion.div className="w-full bg-accent" style={{ height: barHeight }} />
          </div>
        </>
      )}

      <motion.div
        className="stage-wrap grid place-items-center"
        style={{ opacity: reduce ? 1 : roomOpacity, pointerEvents: ready ? 'auto' : 'none' }}
        inert={!ready}
      >
        <div className="stage free pointer-events-auto">
          <Hub user={user || 'you'} filled={scanning} onDrop={scan} />

          {!scanning && (
            <div
              data-drag-item
              {...drag.pointer}
              {...drag.keyboard}
              role="group"
              className="idcard drag"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button, a')) field.current?.focus()
              }}
            >
              <small>Investigator ID, click to type your username</small>
              <label htmlFor="username" className="sr-only">
                GitHub username
              </label>
              <input
                ref={field}
                id="username"
                name="username"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. octocat"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'username-error' : undefined}
              />
              <span className="idcard-go">drag me onto the circle</span>
              <span className="idcard-try">
                Try{' '}
                {DEMOS.map((d, i) => (
                  <span key={d}>
                    {i > 0 && ' or '}
                    <button type="button" onClick={() => setName(d)}>
                      {d}
                    </button>
                  </span>
                ))}
              </span>
            </div>
          )}

          {error && (
            <p id="username-error" role="alert" className="sticky home-error">
              {error}
            </p>
          )}
          {!scanning && !error && <p className="sticky home-hint">Drag the card onto the circle to scan</p>}
          <RoomLight />
        </div>
      </motion.div>
    </Screen>
  )
}
