import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel'
import { Stamp } from '../../components/Stamp'
import { EASE_OUT } from '../../lib/motion'
import { useProject } from '../../lib/queries'
import { useArchive } from '../../store'
import { useCaseModel } from './model'
import type { CaseModel } from './model'
import { StepAround, StepMove, StepWhen, StepWhy } from './Steps'
import { VerdictZone } from './VerdictZone'
import type { Road } from '../../config/rules'

const STEPS = [
  { id: 'when', label: 'When it stopped', short: 'When' },
  { id: 'why', label: 'Why', short: 'Why' },
  { id: 'around', label: 'Built around it', short: 'Around' },
  { id: 'move', label: 'Your move', short: 'Move' },
] as const

const slide = {
  enter: (d: number) => ({ opacity: 0, transform: `translateX(${d * 28}px)` }),
  center: { opacity: 1, transform: 'translateX(0px)' },
  exit: (d: number) => ({ opacity: 0, transform: `translateX(${d * -28}px)` }),
}

interface Props {
  user: string
  repoName: string
  onClose: () => void
}

// The opened project. The paper surface glides here from the note you clicked, the way a folder opens,
// then four steps walk one question at a time: when it stopped, why, who else built it, and what to do.
export function CaseFile({ user, repoName, onClose }: Props) {
  const query = useProject(user, repoName)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panel.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center p-3 sm:p-6"
      initial={{ opacity: 1 }}
      exit={{ opacity: 1, transition: { duration: 0.35 } }}
    >
      <motion.button
        type="button"
        aria-label="Close the case file"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/65"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Case file for ${repoName}`}
        tabIndex={-1}
        className="relative flex max-h-[min(92dvh,860px)] w-full max-w-4xl flex-col outline-none"
      >
        <motion.div layoutId={`surface-${repoName.toLowerCase()}`} className="paper absolute inset-0" transition={{ duration: 0.4, ease: EASE_OUT }} />
        <motion.div
          className="relative flex min-h-0 flex-1 flex-col text-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.25, delay: 0.2 }}
        >
          {query.isError && (
            <div className="p-6">
              <Header name={repoName} onClose={onClose} />
              <div className="mt-6">
                <ErrorPanel error={query.error} subject={`${user}/${repoName}`} onRetry={() => void query.refetch()} />
              </div>
            </div>
          )}
          {!query.isError && !query.data && (
            <div className="p-6">
              <Header name={repoName} onClose={onClose} />
              <div className="mt-6 space-y-3" role="status" aria-label="Opening the case file">
                <div className="skeleton h-10 w-2/3" />
                <div className="skeleton h-40" />
                <div className="skeleton h-24" />
              </div>
            </div>
          )}
          {query.data && <FileBody data={query.data} onClose={onClose} />}
        </motion.div>
      </div>
    </motion.div>
  )
}

function Header({ name, onClose, status }: { name: string; onClose: () => void; status?: CaseModel['cls']['status'] }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="break-words text-3xl sm:text-4xl">{name}</h2>
        {status && (
          <p className="mt-1 text-lg">
            <Stamp status={status} />
          </p>
        )}
      </div>
      <button type="button" className="btn line small flex-none" onClick={onClose}>
        Close
      </button>
    </div>
  )
}

function FileBody({ data, onClose }: { data: NonNullable<ReturnType<typeof useProject>['data']>; onClose: () => void }) {
  const reduce = useReducedMotion()
  const m = useCaseModel(data)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [justSaved, setJustSaved] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const key = `${m.meta.owner.login}/${m.meta.name}`.toLowerCase()
  const saved = useArchive((s) => s.entries[key])
  const save = useArchive((s) => s.save)
  const glide = reduce ? { duration: 0 } : { type: 'spring' as const, duration: 0.35, bounce: 0.1 }
  const last = step === STEPS.length - 1

  useEffect(() => {
    if (!justSaved) return
    const id = window.setTimeout(() => setJustSaved(false), 2200)
    return () => window.clearTimeout(id)
  }, [justSaved])

  function go(next: number): void {
    if (next === step || next < 0 || next >= STEPS.length) return
    setDir(next > step ? 1 : -1)
    setStep(next)
    scroller.current?.scrollTo({ top: 0 })
  }

  function handleSave(road: Road): void {
    m.setRoad(road)
    save({
      key,
      owner: m.meta.owner.login,
      repo: m.meta.name,
      status: m.cls.status,
      cause: m.cause,
      road,
      lifeDays: m.lifeDays,
      burstShare: m.stats?.burstShare ?? null,
      daysSilent: m.daysSilent,
      totalCommits: m.stats?.total ?? null,
    })
    setJustSaved(true)
  }

  return (
    <>
      <div className="px-5 pt-5 sm:px-7 sm:pt-6">
        <Header name={m.meta.name} status={m.cls.status} onClose={onClose} />
        <LayoutGroup id="steps">
          <ol className="mt-4 flex gap-1 border-b border-ink/20" aria-label="Steps">
            {STEPS.map((s, i) => (
              <li key={s.id} className="relative flex-1">
                <button
                  type="button"
                  aria-current={i === step ? 'step' : undefined}
                  className={`relative w-full px-1 pb-2.5 pt-1 text-left text-sm transition-colors duration-150 sm:text-[15px] ${i === step ? 'font-semibold text-ink' : 'text-ink-soft hover:text-ink'}`}
                  onClick={() => go(i)}
                >
                  <span className="mr-1.5 font-display">{i + 1}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i === step ? s.label : s.short}</span>
                </button>
                {i === step && (
                  <motion.span layoutId="step-underline" className="absolute inset-x-0 -bottom-px h-[3px] bg-string" transition={glide} />
                )}
              </li>
            ))}
          </ol>
        </LayoutGroup>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            {step === 0 && <StepWhen m={m} />}
            {step === 1 && <StepWhy m={m} />}
            {step === 2 && <StepAround m={m} />}
            {step === 3 && <StepMove m={m} saved={saved} justSaved={justSaved} onBackToBoard={onClose} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink/20 px-5 py-3 sm:px-7">
        <button type="button" className="btn line small" disabled={step === 0} onClick={() => go(step - 1)}>
          Back
        </button>
        {last ? (
          <div className="min-w-0 flex-1">
            <VerdictZone saved={saved} justSaved={justSaved} onSave={handleSave} />
          </div>
        ) : (
          <>
            <p className="hidden text-sm text-ink-soft sm:block" aria-hidden="true">
              Step {step + 1} of {STEPS.length}
            </p>
            <button type="button" className="btn ink small" onClick={() => go(step + 1)}>
              Next: {STEPS[step + 1]?.label}
            </button>
          </>
        )}
      </div>
    </>
  )
}
