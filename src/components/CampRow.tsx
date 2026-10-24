import { Tent } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { fmtMonth } from '../lib/format'
import type { Classified } from '../lib/rules'
import type { Repo } from '../lib/types'
import { StatusChip } from './StatusChip'

const TENT_COLOR = {
  alive: 'text-teal',
  dormant: 'text-mist',
  abandoned: 'text-accent',
  finished: 'text-cream',
} as const

// One quiet row per project. The tent colour repeats the status, so state is never carried by colour alone
// (the status word is always printed beside it).
export function CampRow({ repo, cls }: { repo: Repo; cls: Classified }) {
  return (
    <Link
      to={`/u/${repo.owner.login}/${repo.name}`}
      className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-150 active:bg-cream/10 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-cream/[0.07]"
    >
      <Tent size={28} weight="duotone" className={`flex-none ${TENT_COLOR[cls.status]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold transition-colors duration-150 group-hover:text-accent">{repo.name}</p>
        <p className="truncate text-sm text-mist">{cls.evidence[0]}</p>
      </div>
      <div className="flex-none text-right">
        <StatusChip status={cls.status} />
        <p className="text-xs text-mist/80">{fmtMonth(repo.pushed_at ?? repo.created_at)}</p>
      </div>
    </Link>
  )
}
