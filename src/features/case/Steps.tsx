import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel'
import { RoadPanel } from '../../components/RoadPanel'
import { Trail } from '../../components/Trail'
import { CAUSE_LABEL } from '../../config/rules'
import { fmtDate, fmtDays, fmtStars } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { LIKELIHOOD_LABEL } from '../../lib/rules'
import type { ArchiveEntry } from '../../store'
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

export function StepWhy({ m }: { m: CaseModel }) {
  const reduce = useReducedMotion()
  const glide = reduce ? { duration: 0 } : { type: 'spring' as const, duration: 0.35, bounce: 0.1 }
  return (
    <div>
      <p className="font-hand text-3xl leading-none">What most likely happened?</p>
      <p className="mt-2 text-ink-soft">We ranked the reasons from the evidence. Pick the one that feels true. You know this project better than we do.</p>
      <ul className="mt-5 space-y-2" role="radiogroup" aria-label="Why it stopped">
        {m.causes.map((g) => {
          const on = m.cause === g.cause
          return (
            <li key={g.cause}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => m.setCause(g.cause)}
                className={`relative block w-full rounded-md px-4 py-3 text-left transition-opacity duration-150 ${on || g.likelihood !== 'unlikely' ? '' : 'opacity-70'}`}
              >
                <span className="absolute inset-0 rounded-md bg-ink/[0.04]" />
                {on && <motion.span layoutId="why-ring" className="absolute inset-0 rounded-md border-2 border-string" transition={glide} />}
                <span className="relative flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg">{CAUSE_LABEL[g.cause]}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${g.likelihood === 'likely' ? 'text-string' : 'text-ink-soft'}`}>
                    {LIKELIHOOD_LABEL[g.likelihood]}
                  </span>
                </span>
                <span className="relative mt-0.5 block text-sm text-ink-soft">{g.why}</span>
              </button>
            </li>
          )
        })}
      </ul>
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
        Projects like yours that appeared after {fmtDate(m.lastDate)}. Add up to {MAX_COMPARE} to compare in the last step.
      </p>

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
              const picked = m.picks.some((p) => p.id === r.id)
              const full = !picked && m.picks.length >= MAX_COMPARE
              return (
                <motion.li
                  key={r.id}
                  className="flex items-start gap-3 rounded-md bg-ink/[0.04] px-3 py-2.5"
                  initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(8px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ duration: 0.3, ease: EASE_OUT, delay: reduce ? 0 : Math.min(i, 6) * 0.04 }}
                >
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
                        {fmtStars(r.stargazers_count)} stars, started {new Date(r.created_at).getFullYear()}
                      </span>
                    </p>
                    {r.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{r.description}</p>}
                  </div>
                  <button
                    type="button"
                    aria-pressed={picked}
                    disabled={full}
                    title={full ? `You can compare up to ${MAX_COMPARE} projects` : undefined}
                    className={`btn small flex-none ${picked ? 'ink' : 'line'}`}
                    onClick={() => m.togglePick(r)}
                  >
                    {picked ? 'Added' : 'Compare'}
                  </button>
                </motion.li>
              )
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
        {m.picks.length > 0 ? 'Here is how your project stacks up against the ones you picked.' : 'You did not pick any project to compare, and that is fine.'}
      </p>

      {m.picks.length > 0 && (
        <div className="mt-4">
          <CompareTable mine={m.meta} others={m.picks} />
        </div>
      )}

      <div className="mt-6">
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
