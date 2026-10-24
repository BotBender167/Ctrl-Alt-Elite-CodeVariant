import { Archive as ArchiveIcon, ArrowRight, Trash } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Page, Reveal } from '../components/Page'
import { StatusChip } from '../components/StatusChip'
import { CAUSE_LABEL, CAUSES, ROAD_LABEL } from '../config/rules'
import { fmtDate, fmtDays } from '../lib/format'
import { useArchive } from '../store'

export default function Archive() {
  const entries = useArchive((s) => s.entries)
  const remove = useArchive((s) => s.remove)
  const list = Object.values(entries).sort((a, b) => b.savedAt.localeCompare(a.savedAt))

  const byCause = CAUSES.map((c) => ({ c, n: list.filter((e) => e.cause === c).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  const lives = list.map((e) => e.lifeDays).filter((n): n is number => n !== null).sort((a, b) => a - b)
  const median = lives.length > 0 ? (lives[Math.floor(lives.length / 2)] ?? 0) : null
  const short = lives.filter((n) => n <= 14).length
  const top = byCause[0]

  return (
    <Page className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-28 pt-28 sm:px-6">
      <Reveal>
        <h1 className="text-[clamp(56px,10vw,104px)]">Your archive</h1>
        <p className="mt-2 text-lg text-mist">Every verdict you saved, kept in this browser so you can come back to it.</p>
      </Reveal>

      {list.length === 0 && (
        <Reveal index={1} className="panel mt-8 p-8 text-center">
          <ArchiveIcon size={48} weight="duotone" className="mx-auto text-accent" />
          <h2 className="mt-3 !text-[44px]">Nothing saved yet</h2>
          <p className="mt-2 text-mist">Open a project, choose a road and press save. It will wait for you here.</p>
          <Link to="/" className="btn mt-5">
            Scan my repos
          </Link>
        </Reveal>
      )}

      {list.length > 0 && (
        <>
          <Reveal index={1} className="panel mt-8 p-5 sm:p-6">
            <h2 className="text-[44px]">Your patterns</h2>
            {top && (
              <p className="mt-2 text-lg">
                Most common cause: <span className="font-semibold text-accent">{CAUSE_LABEL[top.c]}</span>, {top.n} of {list.length}.
              </p>
            )}
            {median !== null && (
              <p className="mt-1 text-mist">
                The typical project here lived {fmtDays(median)}.{short > 0 && ` ${short} of ${lives.length} died within two weeks.`}
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {byCause.map(({ c, n }) => (
                <li key={c} className="flex items-center gap-3 text-sm">
                  <span className="w-48 flex-none text-mist">{CAUSE_LABEL[c]}</span>
                  <span className="h-2 rounded-full bg-accent" style={{ width: `${(n / list.length) * 100}%`, minWidth: 8 }} />
                  <span className="tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="mt-6 space-y-3">
            {list.map((e, i) => (
              <Reveal key={e.key} index={i + 2}>
                <div className="panel flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate text-xl font-semibold">{e.repo}</span>
                      <StatusChip status={e.status} />
                    </div>
                    <p className="mt-1 text-sm text-mist">
                      {ROAD_LABEL[e.road]} chosen. It stopped because: {CAUSE_LABEL[e.cause].toLowerCase()}.
                    </p>
                    <p className="mt-0.5 text-xs text-mist/80">Saved {fmtDate(e.savedAt)}</p>
                  </div>
                  <button type="button" aria-label={`Remove ${e.repo}`} className="btn ghost small !px-3" onClick={() => remove(e.key)}>
                    <Trash size={18} />
                  </button>
                  <Link to={`/u/${e.owner}/${e.repo}`} className="btn small">
                    Reopen <ArrowRight size={18} weight="bold" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </Page>
  )
}
