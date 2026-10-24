import { DotsSixVertical, Scales, X } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel'
import { toast } from '../../lib/toast'
import { RoadPanel } from '../../components/RoadPanel'
import { Trail } from '../../components/Trail'
import { fmtDate, fmtDays, fmtMonth, fmtStars } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Repo } from '../../lib/types'
import type { ArchiveEntry } from '../../store'
import { DropZone } from '../dnd/DropZone'
import { CARD } from '../dnd/types'
import { useDraggable } from '../dnd/useDraggable'
import { CompareTable } from './CompareTable'
import { MAX_COMPARE } from './model'
import type { CaseModel } from './model'

export function StepWhen({ m }: { m: CaseModel }) {
  const { meta, stats } = m
  return (
    <div>
      <p className="font-hand text-4xl leading-none">Last seen {fmtDate(m.lastDate)}</p>
      <p className="mt-2 text-lg">
        Silent for {fmtDays(m.daysSilent)}
        {stats ? `, after ${stats.total} commit${stats.total === 1 ? '' : 's'} in total.` : '.'}
      </p>

      {stats ? (
        <Trail meta={meta} stats={stats} daysSilent={m.daysSilent} />
      ) : (
        <p className="mt-4 text-ink-soft">This repository has no commits to read, so there is no trail to draw.</p>
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold">Why we call it {m.cls.status}</p>
        <ul className="mt-1.5 space-y-1 border-l-2 border-string/70 pl-3 text-sm text-ink-soft">
          {m.cls.evidence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function StepAround({ m }: { m: CaseModel }) {
  const reduce = useReducedMotion()
  const [word, setWord] = useState('')
  const { world, similar } = m

  function addWord(e: FormEvent): void {
    e.preventDefault()
    const w = word.trim().toLowerCase()
    if (w && !m.keywords.includes(w)) m.setKeywords([...m.keywords, w])
    setWord('')
  }

  return (
    <div>
      <p className="font-hand text-3xl leading-none">Who else built this?</p>
      <p className="mt-2 text-ink-soft">
        You stopped on {fmtDate(m.lastDate)}. These started after that. Drag up to {MAX_COMPARE} into the tray to compare them in the last step.
      </p>

      <CompareTray m={m} />

      <ul className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Search words">
        {m.keywords.map((k) => (
          <li key={k} className="flex items-center gap-1 rounded-full bg-ink/10 py-1 pl-3 pr-1 text-sm">
            {k}
            <button
              type="button"
              aria-label={`Remove ${k}`}
              className="grid h-6 w-6 place-items-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-ink/15 hover:text-ink"
              onClick={() => m.setKeywords(m.keywords.filter((w) => w !== k))}
            >
              <span aria-hidden="true">x</span>
            </button>
          </li>
        ))}
        <li>
          <form onSubmit={addWord}>
            <label htmlFor="kw" className="sr-only">
              Add a search word
            </label>
            <input
              id="kw"
              className="h-8 w-32 rounded-full border border-ink/30 bg-white/60 px-3 text-sm placeholder:text-ink-soft/80"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Add a word"
            />
          </form>
        </li>
      </ul>

      {m.keywords.length === 0 && (
        <p className="mt-4 text-ink-soft">Add a word or two above and we will search GitHub for it.</p>
      )}

      {world.isFetching && (
        <div className="mt-5 space-y-2" role="status" aria-label="Searching GitHub">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      )}

      {world.isError && (
        <div className="mt-5">
          <ErrorPanel error={world.error} subject="that search" onRetry={() => void world.refetch()} />
        </div>
      )}

      {!world.isFetching && similar && (
        <div className="mt-5">
          <p className="font-semibold">
            {similar.length === 0
              ? 'Nothing like it has appeared since. The road looks open.'
              : `${similar.length} similar project${similar.length === 1 ? '' : 's'} appeared after you stopped.`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {similar.map((r, i) => {
              return <SimilarRow key={r.id} repo={r} index={i} picked={m.picks.some((p) => p.id === r.id)} reduce={Boolean(reduce)} />
            })}
          </ul>
          <p className="mt-2 text-xs text-ink-soft/90">Similar is not the same idea. Use this as evidence and judge for yourself.</p>
        </div>
      )}
    </div>
  )
}

interface MoveProps {
  m: CaseModel
  saved: ArchiveEntry | undefined
  justSaved: boolean
  onBackToBoard: () => void
}

export function StepMove({ m, saved, justSaved, onBackToBoard }: MoveProps) {
  return (
    <div>
      <p className="font-hand text-3xl leading-none">How do you want to start?</p>
      <p className="mt-2 text-ink-soft">
        {m.picks.length > 0 ? 'Here is how your project stacks up against the ones in your tray.' : 'Your compare tray is empty, and that is fine.'}
      </p>

      {m.picks.length > 0 && (
        <div className="mt-4">
          <CompareTable mine={m.meta} others={m.picks} />
        </div>
      )}

      <p className="mt-6 text-ink-soft">Click a road to read why. Drag the one you choose onto the verdict stamp at the bottom.</p>
      <div className="mt-3">
        <RoadPanel roads={m.roads} chosen={m.road} onChoose={m.setRoad} />
      </div>

      {m.modules.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold">Worth keeping in this repository</p>
          <p className="text-sm text-ink-soft">{m.modules.join(', ')}</p>
        </div>
      )}

      {(saved || justSaved) && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md bg-ink/[0.06] px-4 py-3" role="status">
          <p className="text-sm">
            {justSaved ? 'Saved to your archive.' : `Saved on ${saved ? fmtDate(saved.savedAt) : ''}.`} Come back to it any time.
          </p>
          <button type="button" className="btn line small" onClick={onBackToBoard}>
            Back to the board
          </button>
        </div>
      )}
    </div>
  )
}

function isRepo(v: unknown): v is Repo {
  return typeof v === 'object' && v !== null && 'id' in v && 'full_name' in v
}

// The compare tray stays in view while the list scrolls, so a card never has to travel far to reach it.
function CompareTray({ m }: { m: CaseModel }) {
  return (
    <div className="z-10 -mx-1 mt-4 bg-gradient-to-b from-[#e6d9bc] via-[#e6d9bc]/95 to-transparent px-1 pb-3 pt-1" style={{ position: 'sticky', top: 0 }}>
      <DropZone
        id="compare"
        accepts={[CARD.similar]}
        label={`Compare tray, ${m.picks.length} of ${MAX_COMPARE}. Drop a similar project here to compare it.`}
        className="on-paper flex min-h-[64px] flex-wrap items-center gap-2 px-3 py-2"
        onDrop={(payload) => {
          if (!isRepo(payload)) return false
          if (m.picks.some((p) => p.id === payload.id)) {
            toast(`${payload.full_name} is already in the tray.`)
            return false
          }
          if (m.picks.length >= MAX_COMPARE) {
            toast(`The tray holds ${MAX_COMPARE}. Take one out first.`)
            return false
          }
          m.togglePick(payload)
        }}
      >
        <Scales size={24} weight="bold" className="flex-none text-string" aria-hidden="true" />
        <span className="text-sm font-semibold">
          Compare tray {m.picks.length}/{MAX_COMPARE}
        </span>
        {m.picks.length === 0 && <span className="text-sm text-ink-soft">Drop a project here.</span>}
        {m.picks.map((r) => (
          <span key={r.id} className="flex items-center gap-1 rounded-full bg-ink py-1 pl-3 pr-1 text-sm text-cream">
            {r.full_name}
            <button
              type="button"
              aria-label={`Take ${r.full_name} out of the tray`}
              className="grid h-6 w-6 place-items-center rounded-full text-cream/70 transition-colors duration-150 hover:bg-cream/15 hover:text-cream"
              onClick={() => m.togglePick(r)}
            >
              <X size={14} weight="bold" aria-hidden="true" />
            </button>
          </span>
        ))}
      </DropZone>
    </div>
  )
}

function SimilarRow({ repo: r, index, picked, reduce }: { repo: Repo; index: number; picked: boolean; reduce: boolean }) {
  const drag = useDraggable({ type: CARD.similar, payload: r, label: r.full_name })
  return (
    <motion.li
      data-drag-item
      {...drag.pointer}
      className={`drag-row flex items-start gap-2 rounded-md px-2 py-2.5 ${picked ? 'bg-string/10' : 'bg-ink/[0.04]'}`}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.3, ease: EASE_OUT, delay: reduce ? 0 : Math.min(index, 6) * 0.04 }}
    >
      <button
        type="button"
        data-handle
        {...drag.keyboard}
        className="grid h-8 w-7 flex-none place-items-center rounded-md text-ink-soft transition-colors duration-150 hover:bg-ink/10 hover:text-ink"
      >
        <DotsSixVertical size={20} weight="bold" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <a
            href={r.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-string"
          >
            {r.full_name}
          </a>
          <span className="text-sm text-ink-soft">
            {fmtStars(r.stargazers_count)} stars, started {new Date(r.created_at).getFullYear()}, last push {fmtMonth(r.pushed_at ?? r.created_at)}
            {picked && ', in the tray'}
          </span>
        </p>
        {r.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{r.description}</p>}
      </div>
    </motion.li>
  )
}
