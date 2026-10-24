import { ArrowRight, Tent } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { fmtMonth } from '../lib/format'
import type { Classified } from '../lib/rules'
import type { Repo } from '../lib/types'
import { Reveal } from './Page'
import { StatusChip } from './StatusChip'

const TENT_COLOR = {
  alive: 'text-teal',
  dormant: 'text-mist',
  abandoned: 'text-accent',
  finished: 'text-cream',
} as const

export function CampCard({ repo, cls, index }: { repo: Repo; cls: Classified; index: number }) {
  return (
    <Reveal index={index}>
      <Link
        to={`/u/${repo.owner.login}/${repo.name}`}
        className="panel group flex items-center gap-4 p-4 transition-transform duration-200 ease-out active:scale-[0.99] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-cream/40"
      >
        <Tent size={44} weight="duotone" className={`flex-none ${TENT_COLOR[cls.status]}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xl font-semibold">{repo.name}</span>
            <StatusChip status={cls.status} />
          </div>
          <p className="mt-1 truncate text-sm text-mist">{cls.evidence[0]}</p>
          <p className="mt-1 flex gap-3 text-xs text-mist/80">
            <span>
              {fmtMonth(repo.created_at)} to {fmtMonth(repo.pushed_at ?? repo.created_at)}
            </span>
            {repo.language && <span>{repo.language}</span>}
          </p>
        </div>
        <ArrowRight
          size={22}
          weight="bold"
          className="flex-none text-mist transition-transform duration-200 ease-out group-hover:translate-x-1"
        />
      </Link>
    </Reveal>
  )
}
