import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CampRow } from '../components/CampRow'
import { ErrorPanel } from '../components/ErrorPanel'
import { Page, Reveal } from '../components/Page'
import { EASE_OUT } from '../lib/motion'
import { STATUS_HELP, STATUS_LABEL } from '../config/rules'
import type { Status } from '../config/rules'
import { useTitle } from '../hooks/useTitle'
import { useRepos } from '../lib/queries'
import { classifyList } from '../lib/rules'
import { useSettings } from '../store'

type Filter = 'all' | Status
const ORDER: Status[] = ['abandoned', 'dormant', 'finished', 'alive']

export default function Camps() {
  const { user = '' } = useParams()
  useTitle(`@${user}`)
  const reduce = useReducedMotion()
  const query = useRepos(user)
  const setLastUser = useSettings((s) => s.setLastUser)
  const [filter, setFilter] = useState<Filter>('all')
  const [showForks, setShowForks] = useState(false)

  useEffect(() => {
    setLastUser(user)
  }, [user, setLastUser])

  const items = useMemo(
    () => (query.data ?? []).filter((r) => showForks || !r.fork).map((repo) => ({ repo, cls: classifyList(repo) })),
    [query.data, showForks],
  )
  const counts = useMemo(() => {
    const c: Record<Status, number> = { alive: 0, dormant: 0, abandoned: 0, finished: 0 }
    for (const i of items) c[i.cls.status] += 1
    return c
  }, [items])
  const visible = filter === 'all' ? items : items.filter((i) => i.cls.status === filter)
  const forkCount = (query.data ?? []).filter((r) => r.fork).length
  const quiet = counts.abandoned + counts.dormant
  const pill = reduce ? { duration: 0 } : { type: 'spring' as const, duration: 0.35, bounce: 0.1 }

  const tabs: Array<{ id: Filter; label: string; n: number; help?: string }> = [
    { id: 'all', label: 'All', n: items.length },
    ...ORDER.filter((s) => counts[s] > 0).map((s) => ({ id: s, label: STATUS_LABEL[s], n: counts[s], help: STATUS_HELP[s] })),
  ]

  return (
    <Page className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-28 sm:px-6">
      <Reveal>
        <h1 className="text-[clamp(56px,10vw,104px)]">
          The camps of <span className="text-accent">@{user}</span>
        </h1>
      </Reveal>

      {query.isPending && (
        <div className="mt-8 space-y-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[72px]" />
          ))}
          <p className="sr-only" role="status">
            Reading the repositories
          </p>
        </div>
      )}

      {query.isError && (
        <div className="mt-10">
          <ErrorPanel error={query.error} subject={`@${user}`} onRetry={() => void query.refetch()} />
        </div>
      )}

      {query.isSuccess && items.length === 0 && (
        <Reveal index={1} className="panel mt-10 p-8 text-center">
          <h2 className="text-[44px]">No public camps yet</h2>
          <p className="mt-3 text-mist">@{user} has no public repositories to look at.</p>
          <Link to="/" className="btn mt-5">
            Try another username
          </Link>
        </Reveal>
      )}

      {query.isSuccess && items.length > 0 && (
        <>
          <Reveal index={1}>
            <p className="mt-3 text-lg text-cream/90">
              {quiet > 0 ? `${quiet} of ${items.length} have gone quiet and need a verdict.` : `All ${items.length} are moving. Nice.`}
            </p>
            <LayoutGroup>
              <div className="mt-5 flex flex-wrap items-center gap-1" role="group" aria-label="Filter by status">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={filter === t.id}
                    title={t.help}
                    className="relative rounded-full px-4 py-1.5 text-[15px]"
                    onClick={() => setFilter(t.id)}
                  >
                    {filter === t.id && (
                      <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-cream/15" transition={pill} />
                    )}
                    <span className={`relative transition-colors duration-150 ${filter === t.id ? 'text-cream' : 'text-cream/65'}`}>
                      {t.label} <span className="text-mist">{t.n}</span>
                    </span>
                  </button>
                ))}
                {forkCount > 0 && (
                  <button
                    type="button"
                    aria-pressed={showForks}
                    className="ml-auto px-2 py-1.5 text-sm text-mist underline decoration-cream/30 underline-offset-4 hover:text-cream"
                    onClick={() => setShowForks((v) => !v)}
                  >
                    {showForks ? 'Hide' : 'Show'} {forkCount} fork{forkCount === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            </LayoutGroup>
          </Reveal>

          <Reveal index={2}>
            <ul className="panel mt-5 p-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((item, i) => (
                  <motion.li
                    key={item.repo.id}
                    layout={reduce ? false : 'position'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      opacity: { duration: 0.22, ease: EASE_OUT, delay: Math.min(i, 8) * 0.03 },
                      layout: { duration: 0.3, ease: EASE_OUT },
                    }}
                  >
                    <CampRow repo={item.repo} cls={item.cls} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Reveal>
        </>
      )}
    </Page>
  )
}
