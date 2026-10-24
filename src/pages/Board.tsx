import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Stamp } from '../components/Stamp'
import { ErrorPanel } from '../components/ErrorPanel'
import { Screen } from '../components/Page'
import { CaseFile } from '../features/case/CaseFile'
import { Dock } from '../features/board/Dock'
import type { BoardFilter } from '../features/board/Dock'
import { Note } from '../features/board/Note'
import { SLOT_COUNT, slotFor } from '../features/board/slots'
import { Strings } from '../features/board/Strings'
import type { PlacedLink } from '../features/board/Strings'
import { useTitle } from '../hooks/useTitle'
import { daysBetween, fmtMonth } from '../lib/format'
import { useRepos } from '../lib/queries'
import { relatedLinks } from '../lib/relations'
import { classifyList } from '../lib/rules'
import type { Classified } from '../lib/rules'
import type { Repo } from '../lib/types'
import { useSettings } from '../store'

interface Item {
  repo: Repo
  cls: Classified
}

const PRIORITY = { abandoned: 0, dormant: 1, finished: 2, alive: 3 } as const

// Quiet projects first, and within a group the most recently active first: those are the easiest to revive.
function byUrgency(a: Item, b: Item): number {
  const p = PRIORITY[a.cls.status] - PRIORITY[b.cls.status]
  if (p !== 0) return p
  return (b.repo.pushed_at ?? '').localeCompare(a.repo.pushed_at ?? '')
}

export default function Board() {
  const { user = '', repo: openRepo } = useParams()
  useTitle(openRepo ?? `@${user}`)
  const navigate = useNavigate()
  const query = useRepos(user)
  const setLastUser = useSettings((s) => s.setLastUser)
  const hintSeen = useSettings((s) => s.hintSeen)
  const dismissHint = useSettings((s) => s.dismissHint)
  const [filter, setFilter] = useState<BoardFilter>('quiet')
  const [page, setPage] = useState(0)
  const [lit, setLit] = useState<number | null>(null)

  useEffect(() => {
    setLastUser(user)
  }, [user, setLastUser])

  const items = useMemo<Item[]>(
    () =>
      (query.data ?? [])
        .filter((r) => !r.fork)
        .map((repo) => ({ repo, cls: classifyList(repo) }))
        .sort(byUrgency),
    [query.data],
  )
  const quiet = items.filter((i) => i.cls.status === 'abandoned' || i.cls.status === 'dormant')
  const effective: BoardFilter = filter === 'quiet' && quiet.length === 0 ? 'all' : filter
  const list = effective === 'quiet' ? quiet : items
  const pageCount = Math.max(1, Math.ceil(list.length / SLOT_COUNT))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = list.slice(safePage * SLOT_COUNT, (safePage + 1) * SLOT_COUNT)

  const placed = useMemo(() => {
    const slots = pageItems.map((item, i) => slotFor(i, item.repo.id))
    const bySlot = new Map(pageItems.map((item, i) => [item.repo.id, slots[i]] as const))
    const links: PlacedLink[] = []
    for (const l of relatedLinks(pageItems.map((i) => i.repo))) {
      const a = bySlot.get(l.aId)
      const b = bySlot.get(l.bId)
      if (a && b) links.push({ ...l, a, b })
    }
    return { slots, links }
  }, [pageItems])

  function changeFilter(f: BoardFilter): void {
    setFilter(f)
    setPage(0)
    setLit(null)
  }

  const closeCase = () => navigate(`/u/${user}`)

  return (
    <LayoutGroup>
      <Screen className="fixed inset-0 z-10">
        {/* The board, on screens wide enough to show the whole room. */}
        <div className="stage-wrap hidden place-items-center min-[900px]:grid">
          <div className="stage pointer-events-auto">
            {query.isSuccess && pageItems.length > 0 && (
              <>
                <Strings links={placed.links} lit={lit} />
                {pageItems.map((item, i) => {
                  const slot = placed.slots[i]
                  if (!slot) return null
                  return (
                    <Note
                      key={item.repo.id}
                      repo={item.repo}
                      cls={item.cls}
                      slot={slot}
                      index={i}
                      open={openRepo?.toLowerCase() === item.repo.name.toLowerCase()}
                      faded={lit !== null && lit !== item.repo.id}
                      onFocusRepo={setLit}
                      onOpen={dismissHint}
                    />
                  )
                })}
                {!hintSeen && !openRepo && (
                  <span
                    className="sticky absolute px-[1cqw] py-[0.5cqw] text-[clamp(13px,1.9cqw,30px)]"
                    style={{ left: '14%', top: '6.4%', rotate: '-2deg' }}
                  >
                    Click a note to open its case file
                  </span>
                )}
              </>
            )}
            {query.isPending && <BoardSkeleton />}
          </div>
        </div>

        {/* Phones and narrow windows: the same notes as a simple pinned list. */}
        <div className="h-full overflow-y-auto px-4 pb-28 pt-20 min-[900px]:hidden">
          {query.isSuccess && (
            <ul className="mx-auto max-w-md space-y-3">
              {pageItems.map((item) => (
                <li key={item.repo.id}>
                  <Link to={`/u/${item.repo.owner.login}/${item.repo.name}`} onClick={dismissHint} className="paper block p-4">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="break-words font-display text-lg">{item.repo.name}</span>
                      <Stamp status={item.cls.status} />
                    </span>
                    <span className="mt-1 block font-hand text-xl text-ink-soft">
                      Last seen {fmtMonth(item.repo.pushed_at ?? item.repo.created_at)}, silent {daysBetween(item.repo.pushed_at ?? item.repo.created_at)} days
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {query.isError && (
          <div className="absolute inset-0 grid place-items-center px-4">
            <ErrorPanel error={query.error} subject={`@${user}`} onRetry={() => void query.refetch()} />
          </div>
        )}

        {query.isSuccess && items.length === 0 && (
          <div className="absolute inset-0 grid place-items-center px-4">
            <div className="paper max-w-md space-y-3 p-6 text-center">
              <h2 className="text-2xl">No public projects</h2>
              <p className="text-ink-soft">@{user} has no public repositories to examine.</p>
              <Link to="/" className="btn ink small">
                Try another username
              </Link>
            </div>
          </div>
        )}

        {query.isSuccess && items.length > 0 && (
          <Dock
            user={user}
            filter={effective}
            quietCount={quiet.length}
            allCount={items.length}
            page={safePage}
            pageCount={pageCount}
            onFilter={changeFilter}
            onPage={(p) => {
              setPage(p)
              setLit(null)
            }}
          />
        )}

        <AnimatePresence>{openRepo && <CaseFile key={openRepo} user={user} repoName={openRepo} onClose={closeCase} />}</AnimatePresence>
      </Screen>
    </LayoutGroup>
  )
}

function BoardSkeleton() {
  return (
    <div role="status" aria-label="Reading the repositories">
      {[0, 1, 2, 3, 5, 6].map((i) => {
        const slot = slotFor(i, i + 3)
        return (
          <div
            key={i}
            className="paper absolute animate-pulse opacity-50"
            style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: '13.5cqw', height: '10.6cqw', translate: '-50% -50%', rotate: `${slot.rot}deg` }}
          />
        )
      })}
    </div>
  )
}
