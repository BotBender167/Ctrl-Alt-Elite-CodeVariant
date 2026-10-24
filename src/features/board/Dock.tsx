import { LayoutGroup, motion, useReducedMotion } from 'motion/react'

export type BoardFilter = 'quiet' | 'all'

interface Props {
  user: string
  filter: BoardFilter
  quietCount: number
  allCount: number
  page: number
  pageCount: number
  shredded: number
  onRestore: () => void
  onFilter: (f: BoardFilter) => void
  onPage: (p: number) => void
}

// The quiet controls, in one bar directly above the zones. Each one has one job: say whose board this is, choose which
// projects are pinned, flip between pages of them, and bring back anything you shredded. The actions
// themselves live in the zones at the bottom.
export function Dock({ user, filter, quietCount, allCount, page, pageCount, shredded, onRestore, onFilter, onPage }: Props) {
  const reduce = useReducedMotion()
  const glide = reduce ? { duration: 0 } : { type: 'spring' as const, duration: 0.35, bounce: 0.1 }
  const tabs: Array<{ id: BoardFilter; label: string; n: number }> = [
    { id: 'quiet', label: 'Needs a verdict', n: quietCount },
    { id: 'all', label: 'Everything', n: allCount },
  ]

  return (
    <div className="pointer-events-none flex justify-center">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-full bg-room/85 p-1 ring-1 ring-cream/15 backdrop-blur-sm">
        <span className="px-3 text-sm text-mist">@{user}</span>
        <LayoutGroup id="dock">
          <div role="group" aria-label="Which projects to pin" className="flex">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={filter === t.id}
                className="relative rounded-full px-4 py-2 text-[15px]"
                onClick={() => onFilter(t.id)}
              >
                {filter === t.id && (
                  <motion.span layoutId="dock-pill" className="absolute inset-0 rounded-full bg-cream/15" transition={glide} />
                )}
                <span className={`relative transition-colors duration-150 ${filter === t.id ? 'text-cream' : 'text-cream/65'}`}>
                  {t.label} <span className="text-mist">{t.n}</span>
                </span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        {pageCount > 1 && (
          <div className="flex items-center gap-1 pl-1 text-sm text-mist" role="group" aria-label="Pages of projects">
            <button
              type="button"
              className="rounded-full px-3 py-2 text-cream/80 transition-colors duration-150 hover:text-cream disabled:opacity-30"
              disabled={page === 0}
              onClick={() => onPage(page - 1)}
            >
              Prev
            </button>
            <span className="tabular-nums" aria-live="polite">
              {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-cream/80 transition-colors duration-150 hover:text-cream disabled:opacity-30"
              disabled={page >= pageCount - 1}
              onClick={() => onPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
        {shredded > 0 && (
          <button
            type="button"
            className="rounded-full px-3 py-2 text-sm text-accent transition-colors duration-150 hover:text-cream"
            onClick={onRestore}
          >
            Bring back {shredded} shredded
          </button>
        )}
      </div>
    </div>
  )
}
