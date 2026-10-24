import { Link } from 'react-router-dom'
import { Page, Reveal } from '../components/Page'
import { Stamp } from '../components/Stamp'
import { CAUSE_LABEL, CAUSES, ROAD_LABEL } from '../config/rules'
import { useTitle } from '../hooks/useTitle'
import { fmtDate, fmtDays } from '../lib/format'
import { useArchive } from '../store'

export default function Archive() {
  useTitle('Archive')
  const entries = useArchive((s) => s.entries)
  const remove = useArchive((s) => s.remove)
  const list = Object.values(entries).sort((a, b) => b.savedAt.localeCompare(a.savedAt))

  const byCause = CAUSES.map((c) => ({ c, n: list.filter((e) => e.cause === c).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  const lives = list
    .map((e) => e.lifeDays)
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b)
  const median = lives.length > 0 ? (lives[Math.floor(lives.length / 2)] ?? 0) : null
  const short = lives.filter((n) => n <= 14).length
  const top = byCause[0]

  return (
    <Page className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-24 sm:px-6">
      <Reveal>
        <h1 className="text-[clamp(36px,6vw,60px)]">Your archive</h1>
        <p className="mt-2 text-lg text-cream/90">Every verdict you saved, kept in this browser so you can come back to it.</p>
      </Reveal>

      {list.length === 0 && (
        <Reveal index={1} className="paper mt-8 p-8 text-center">
          <h2 className="text-2xl">Nothing saved yet</h2>
          <p className="mt-2 text-ink-soft">Open a project, work through its case file and save your verdict. It will wait for you here.</p>
          <Link to="/" className="btn ink mt-5">
            Scan my repos
          </Link>
        </Reveal>
      )}

      {list.length > 0 && (
        <>
          <Reveal index={1} className="paper mt-8 p-5 sm:p-6">
            <h2 className="text-2xl">Your patterns</h2>
            {top && (
              <p className="mt-2">
                Most common cause: <span className="font-semibold text-string">{CAUSE_LABEL[top.c]}</span>, {top.n} of {list.length}.
              </p>
            )}
            {median !== null && (
              <p className="mt-1 text-ink-soft">
                The typical project here lived {fmtDays(median)}.{short > 0 && ` ${short} of ${lives.length} died within two weeks.`}
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {byCause.map(({ c, n }) => (
                <li key={c} className="flex items-center gap-3 text-sm">
                  <span className="w-44 flex-none text-ink-soft">{CAUSE_LABEL[c]}</span>
                  <span className="h-1.5 rounded-full bg-string" style={{ width: `${(n / list.length) * 100}%`, minWidth: 8 }} />
                  <span className="tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal index={2}>
            <ul className="paper mt-5 p-1.5">
              {list.map((e) => (
                <li key={e.key} className="flex items-center gap-4 rounded-md px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-3">
                      <span className="truncate font-display text-lg">{e.repo}</span>
                      <Stamp status={e.status} />
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {ROAD_LABEL[e.road]} chosen. It stopped because: {CAUSE_LABEL[e.cause].toLowerCase()}. Saved {fmtDate(e.savedAt)}.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-ink-soft underline decoration-ink/30 underline-offset-4 hover:text-ink"
                    onClick={() => remove(e.key)}
                  >
                    Remove
                  </button>
                  <Link to={`/u/${e.owner}/${e.repo}`} className="btn ink small">
                    Reopen
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </>
      )}
    </Page>
  )
}
