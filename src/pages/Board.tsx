import { Archive, MagnifyingGlass, Trash } from '@phosphor-icons/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActionZone, ZoneTray } from '../components/ActionZone'
import { ErrorPanel } from '../components/ErrorPanel'
import { Screen } from '../components/Page'
import { Stamp } from '../components/Stamp'
import { toast } from '../lib/toast'
import { CaseFile } from '../features/case/CaseFile'
import { Dock } from '../features/board/Dock'
import type { BoardFilter } from '../features/board/Dock'
import { Hub } from '../features/board/Hub'
import { SLOT_COUNT, placeItems } from '../features/board/layout'
import { cardOf, STATUS_ICON } from '../features/board/cards'
import { Grip, Note } from '../features/board/Note'
import { Inspector } from '../features/board/Inspector'
import { RoomLight } from '../features/board/RoomLight'
import { Strings } from '../features/board/Strings'
import type { PlacedLink } from '../features/board/Strings'
import { useDnd } from '../features/dnd/engine'
import { CARD } from '../features/dnd/types'
import type { RepoCard } from '../features/dnd/types'
import { useDraggable } from '../features/dnd/useDraggable'
import { useTitle } from '../hooks/useTitle'
import { daysBetween, fmtDays, fmtMonth } from '../lib/format'
import { useRepos } from '../lib/queries'
import { relatedLinks } from '../lib/relations'
import { classifyList } from '../lib/rules'
import type { Classified } from '../lib/rules'
import type { Repo } from '../lib/types'
import { useBoard, useSettings } from '../store'

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

const isRepoCard = (v: unknown): v is RepoCard =>
  typeof v === 'object' && v !== null && 'key' in v && 'name' in v && 'owner' in v

export default function Board() {
  const { user = '', repo: openRepo } = useParams()
  useTitle(openRepo ?? `@${user}`)
  const navigate = useNavigate()
  const query = useRepos(user)
  const setLastUser = useSettings((s) => s.setLastUser)
  const hintSeen = useSettings((s) => s.hintSeen)
  const dismissHint = useSettings((s) => s.dismissHint)
  const { kept, hidden, keep, unkeep, hide, show, showAll } = useBoard()
  const [filter, setFilter] = useState<BoardFilter>('quiet')
  const [page, setPage] = useState(0)
  const [lit, setLit] = useState<number | null>(null)
  const holding = useDnd((s) => s.armed !== null)

  useEffect(() => {
    setLastUser(user)
  }, [user, setLastUser])

  const all = useMemo<Item[]>(
    () =>
      (query.data ?? [])
        .filter((r) => !r.fork)
        .map((repo) => ({ repo, cls: classifyList(repo) }))
        .sort(byUrgency),
    [query.data],
  )
  const shreddedCount = all.filter((i) => hidden[cardOf(i.repo).key]).length
  const items = all.filter((i) => !hidden[cardOf(i.repo).key])
  const quiet = items.filter((i) => i.cls.status === 'abandoned' || i.cls.status === 'dormant')
  const effective: BoardFilter = filter === 'quiet' && quiet.length === 0 ? 'all' : filter
  const list = effective === 'quiet' ? quiet : items
  const pageCount = Math.max(1, Math.ceil(list.length / SLOT_COUNT))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = list.slice(safePage * SLOT_COUNT, (safePage + 1) * SLOT_COUNT)

  const placed = useMemo(() => {
    const slots = placeItems(pageItems.map((i) => ({ id: i.repo.id, status: i.cls.status })))
    const bySlot = new Map(pageItems.map((item, i) => [item.repo.id, slots[i]] as const))
    const links: PlacedLink[] = []
    for (const l of relatedLinks(pageItems.map((i) => i.repo))) {
      const a = bySlot.get(l.aId)
      const b = bySlot.get(l.bId)
      if (a && b) links.push({ ...l, a, b })
    }
    const spokes = pageItems.flatMap((item, i) => {
      const slot = slots[i]
      return slot ? [{ id: item.repo.id, slot }] : []
    })
    return { slots, links, spokes }
  }, [pageItems])

  const litIndex = pageItems.findIndex((i) => i.repo.id === lit)
  const litItem = litIndex >= 0 ? pageItems[litIndex] : undefined

  function changeFilter(f: BoardFilter): void {
    setFilter(f)
    setPage(0)
    setLit(null)
  }

  const closeCase = () => navigate(`/u/${user}`)

  // The three zones. Each takes a project card and does one thing with it.
  function examine(payload: unknown): boolean {
    if (!isRepoCard(payload)) return false
    dismissHint()
    setLit(null)
    navigate(`/u/${payload.owner}/${payload.name}`)
    return true
  }
  function keepIt(payload: unknown): boolean {
    if (!isRepoCard(payload)) return false
    dismissHint()
    if (kept[payload.key]) {
      toast(`${payload.name} is already kept.`)
      return true
    }
    keep(payload.key)
    toast(`${payload.name} kept for later.`, () => unkeep(payload.key))
    return true
  }
  function shred(payload: unknown): boolean {
    if (!isRepoCard(payload)) return false
    dismissHint()
    setLit(null)
    hide(payload.key)
    toast(`${payload.name} shredded off your board.`, () => show(payload.key))
    return true
  }

  return (
    <LayoutGroup>
      <Screen className="fixed inset-0 z-10">
        {/* The board, on screens wide enough to show the whole room. */}
        <div className="stage-wrap hidden place-items-center min-[900px]:grid">
          <div className="stage pointer-events-auto">
            {query.isSuccess && pageItems.length > 0 && (
              <>
                <Strings spokes={placed.spokes} links={placed.links} lit={lit} />
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
                      kept={Boolean(kept[cardOf(item.repo).key])}
                      onLight={setLit}
                    />
                  )
                })}
                {!hintSeen && !openRepo && (
                  <span
                    className="sticky absolute px-[1cqw] py-[0.5cqw] text-[clamp(13px,1.9cqw,30px)]"
                    style={{ left: '58%', top: '55%', rotate: '-2deg' }}
                  >
                    Drag a note onto Examine to open it
                  </span>
                )}
              </>
            )}
            {!query.isError && <Hub user={user} filled count={query.isSuccess ? items.length : undefined} />}
            {query.isPending && <BoardSkeleton />}
            <RoomLight />
          </div>
        </div>

        <AnimatePresence>
          {litItem && !openRepo && !holding && <Inspector key={litItem.repo.id} repo={litItem.repo} cls={litItem.cls} />}
        </AnimatePresence>

        {/* Phones and narrow windows: the same notes as a simple pinned list, with the same zones below. */}
        <div className="h-full overflow-y-auto px-4 pb-44 pt-28 min-[900px]:hidden">
          {query.isSuccess && (
            <ul className="mx-auto max-w-md space-y-3">
              {pageItems.map((item) => (
                <li key={item.repo.id}>
                  <ListCard item={item} kept={Boolean(kept[cardOf(item.repo).key])} />
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

        {query.isSuccess && all.length === 0 && (
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

        {query.isSuccess && all.length > 0 && (
          <>
            <Dock
              user={user}
              filter={effective}
              quietCount={quiet.length}
              allCount={items.length}
              page={safePage}
              pageCount={pageCount}
              shredded={shreddedCount}
              onRestore={() => showAll(user)}
              onFilter={changeFilter}
              onPage={(p) => {
                setPage(p)
                setLit(null)
              }}
            />
            <ZoneTray>
              <ActionZone id="examine" accepts={[CARD.repo]} title="Examine" sub="Open the case file" icon={<MagnifyingGlass size={26} weight="bold" />} onDrop={examine} />
              <ActionZone id="keep" accepts={[CARD.repo]} title="Keep" sub="Mark it for later" icon={<Archive size={26} weight="bold" />} onDrop={keepIt} count={Object.keys(kept).filter((k) => k.startsWith(`${user.toLowerCase()}/`)).length} />
              <ActionZone id="shred" accepts={[CARD.repo]} title="Shred" sub="Take it off the board" icon={<Trash size={26} weight="bold" />} onDrop={shred} />
            </ZoneTray>
          </>
        )}

        <AnimatePresence>{openRepo && <CaseFile key={openRepo} user={user} repoName={openRepo} onClose={closeCase} />}</AnimatePresence>
      </Screen>
    </LayoutGroup>
  )
}

function ListCard({ item, kept }: { item: Item; kept: boolean }) {
  const { repo, cls } = item
  const Glyph = STATUS_ICON[cls.status]
  const drag = useDraggable({
    type: CARD.repo,
    payload: cardOf(repo),
    label: repo.name,
    ariaLabel: `${repo.name}, ${cls.status}, silent ${fmtDays(daysBetween(repo.pushed_at ?? repo.created_at))}`,
  })
  return (
    <div data-drag-item {...drag.pointer} {...drag.keyboard} className="paper drag-row flex items-center gap-2 p-3 data-[lifted]:opacity-30">
      <Grip />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <Glyph size={18} weight="bold" className="flex-none" aria-hidden="true" />
            <span className="break-words font-display text-lg">{repo.name}</span>
          </span>
          <Stamp status={cls.status} />
        </span>
        <span className="mt-1 block font-hand text-xl text-ink-soft">
          Last seen {fmtMonth(repo.pushed_at ?? repo.created_at)}, silent {fmtDays(daysBetween(repo.pushed_at ?? repo.created_at))}
          {kept && ', kept'}
        </span>
      </span>
    </div>
  )
}

function BoardSkeleton() {
  const slots = placeItems([1, 2, 3, 4, 5, 6].map((id) => ({ id, status: id % 2 ? ('abandoned' as const) : ('dormant' as const) })))
  return (
    <div role="status" aria-label="Reading the repositories">
      {slots.map((slot, i) => (
        <div
          key={i}
          className="paper absolute animate-pulse opacity-50"
          style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: '12.6cqw', height: '9cqw', translate: '-50% -50%', rotate: `${slot.rot}deg` }}
        />
      ))}
    </div>
  )
}
