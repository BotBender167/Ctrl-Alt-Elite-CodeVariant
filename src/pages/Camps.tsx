import { GitFork } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CampCard } from '../components/CampCard'
import { ErrorPanel } from '../components/ErrorPanel'
import { Page, Reveal } from '../components/Page'
import { STATUS_HELP, STATUS_LABEL } from '../config/rules'
import type { Status } from '../config/rules'
import { classifyList } from '../lib/rules'
import { useRepos } from '../lib/queries'
import { useSettings } from '../store'

type Filter = 'all' | Status
const ORDER: Status[] = ['abandoned', 'dormant', 'finished', 'alive']

function Skeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-[98px]" />
      ))}
    </div>
  )
}

export default function Camps() {
  const { user = '' } = useParams()
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
  const needsAttention = counts.abandoned + counts.dormant

  return (
    <Page className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-28 sm:px-6">
      <Reveal>
        <Link to="/" className="text-sm text-mist hover:text-cream">
          Back to the start
        </Link>
        <h1 className="mt-2 text-[clamp(56px,10vw,104px)]">
          The camps of <span className="text-accent">@{user}</span>
        </h1>
      </Reveal>

      {query.isPending && (
        <div className="mt-8">
          <Skeletons />
        </div>
      )}

      {query.isError && (
        <div className="mt-10">
          <ErrorPanel error={query.error} subject={`@${user}`} onRetry={() => void query.refetch()} />
        </div>
      )}

      {query.isSuccess && items.length === 0 && (
        <Reveal index={1} className="panel mt-10 p-8 text-center">
          <h2 className="!text-[44px]">No public camps yet</h2>
          <p className="mt-3 text-mist">@{user} has no public repositories to look at. Try another username.</p>
        </Reveal>
      )}

      {query.isSuccess && items.length > 0 && (
        <>
          <Reveal index={1}>
            <p className="mt-3 text-lg text-mist">
              {items.length} projects found.{' '}
              {needsAttention > 0 ? (
                <span className="text-cream">{needsAttention} have gone quiet and need a verdict.</span>
              ) : (
                <span className="text-cream">Everything here is moving. Nice.</span>
              )}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
              <button type="button" aria-pressed={filter === 'all'} className={`btn small ${filter === 'all' ? '' : 'ghost'}`} onClick={() => setFilter('all')}>
                All {items.length}
              </button>
              {ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={filter === s}
                  title={STATUS_HELP[s]}
                  disabled={counts[s] === 0}
                  className={`btn small ${filter === s ? '' : 'ghost'} disabled:opacity-40`}
                  onClick={() => setFilter(s)}
                >
                  {STATUS_LABEL[s]} {counts[s]}
                </button>
              ))}
              {forkCount > 0 && (
                <button type="button" aria-pressed={showForks} className="btn ghost small ml-auto" onClick={() => setShowForks((v) => !v)}>
                  <GitFork size={18} /> {showForks ? 'Hide' : 'Show'} {forkCount} forks
                </button>
              )}
            </div>
          </Reveal>

          <div className="mt-6 space-y-3">
            {visible.map((item, i) => (
              <CampCard key={item.repo.id} repo={item.repo} cls={item.cls} index={i + 2} />
            ))}
          </div>
        </>
      )}
    </Page>
  )
}
