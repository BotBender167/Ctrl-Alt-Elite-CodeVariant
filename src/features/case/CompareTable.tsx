import { motion, useReducedMotion } from 'motion/react'
import { daysBetween, fmtDays, fmtStars } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Repo } from '../../lib/types'

const ACTIVE_WITHIN_DAYS = 180

function lastPush(repo: Repo): number {
  return daysBetween(repo.pushed_at ?? repo.created_at)
}

// Yours next to the projects you picked. Purpose: decision. The rows are the questions people actually ask:
// is it popular, is it still alive, how long has it been around.
export function CompareTable({ mine, others }: { mine: Repo; others: Repo[] }) {
  const reduce = useReducedMotion()
  const cols = [{ repo: mine, label: 'Yours' }, ...others.map((repo) => ({ repo, label: repo.name }))]
  const rows: Array<{ label: string; value: (r: Repo) => string }> = [
    { label: 'Stars', value: (r) => fmtStars(r.stargazers_count) },
    { label: 'Started', value: (r) => String(new Date(r.created_at).getFullYear()) },
    { label: 'Last updated', value: (r) => `${fmtDays(lastPush(r))} ago` },
    { label: 'Still active', value: (r) => (lastPush(r) < ACTIVE_WITHIN_DAYS ? 'Yes' : 'No') },
    { label: 'Language', value: (r) => r.language ?? 'Not stated' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="w-28 py-2 pr-3 font-normal text-ink-soft" scope="col">
              <span className="sr-only">Measure</span>
            </th>
            {cols.map((c, i) => (
              <motion.th
                key={c.repo.id}
                scope="col"
                className={`px-3 py-2 font-display text-base ${i === 0 ? 'bg-ink/[0.07]' : ''}`}
                initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={{ duration: 0.25, ease: EASE_OUT, delay: reduce ? 0 : i * 0.06 }}
              >
                <span className="block truncate">{c.label}</span>
              </motion.th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-ink/15">
              <th scope="row" className="py-2 pr-3 font-normal text-ink-soft">
                {row.label}
              </th>
              {cols.map((c, i) => (
                <td key={c.repo.id} className={`px-3 py-2 ${i === 0 ? 'bg-ink/[0.07] font-semibold' : ''}`}>
                  {row.value(c.repo)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
