import { Campfire, Signpost } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { RULES } from '../config/rules'
import { daysBetweenDates, fmtDate, fmtDays } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import type { CommitStats, Repo } from '../lib/types'

const W = 1000
const H = 210
const BORN_X = 70
const NOW_X = 930
const Y_BORN = 150
const Y_BURST = 90
const Y_LAST = 120

interface Stop {
  key: string
  x: number
  y: number
  icon?: ReactNode
  title: string
  detail: string
  extra?: string
  side: 'above' | 'below'
}

function buildTrail(meta: Repo, stats: CommitStats | null, daysSilent: number) {
  const born = stats?.firstDate ?? meta.created_at
  const last = stats?.lastDate ?? meta.pushed_at ?? meta.created_at
  const life = daysBetweenDates(born, last)
  const span = Math.max(1, life + daysSilent)
  const avail = NOW_X - BORN_X
  const lastX = Math.min(NOW_X - 170, Math.max(BORN_X + 190, BORN_X + (life / span) * avail))
  const hasBurst = Boolean(stats && stats.burstShare >= 0.3 && life >= 2)
  const burstX = hasBurst ? BORN_X + Math.min((lastX - BORN_X) * 0.5, Math.max(70, (RULES.burstDays / span) * avail)) : 0

  const lived = hasBurst
    ? `M${BORN_X} ${Y_BORN} C${BORN_X + 40} ${Y_BORN} ${burstX - 60} ${Y_BURST} ${burstX} ${Y_BURST} S${lastX - 70} ${Y_LAST} ${lastX} ${Y_LAST}`
    : `M${BORN_X} ${Y_BORN} C${BORN_X + (lastX - BORN_X) * 0.5} ${Y_BORN} ${lastX - (lastX - BORN_X) * 0.4} ${Y_LAST} ${lastX} ${Y_LAST}`
  const silent = `M${lastX} ${Y_LAST} L${NOW_X} ${Y_LAST}`

  const stops: Stop[] = [{ key: 'born', x: BORN_X, y: Y_BORN, title: 'Started', detail: fmtDate(born), side: 'below' }]
  if (hasBurst && stats) {
    stops.push({
      key: 'burst',
      x: burstX,
      y: Y_BURST,
      title: `${Math.round(stats.burstShare * 100)}% of the work`,
      detail: `in the first ${RULES.burstDays} days`,
      side: 'above',
    })
  }
  stops.push({
    key: 'last',
    x: lastX,
    y: Y_LAST,
    icon: <Campfire size={22} weight="duotone" />,
    title: 'Last seen',
    detail: fmtDate(last),
    extra: stats?.lastMessage ? `"${stats.lastMessage.slice(0, 38)}"` : undefined,
    side: 'below',
  })
  stops.push({
    key: 'now',
    x: NOW_X,
    y: Y_LAST,
    icon: <Signpost size={22} weight="duotone" />,
    title: 'Today',
    detail: `${fmtDays(daysSilent)} later`,
    side: 'above',
  })
  return { lived, silent, stops }
}

// The trail turns "when did it stop" into a distance you can see. Purpose: explanation. It draws once from
// the first commit to the last, then the dotted stretch fades in, so the length of the silence is the last thing you read.
export function Trail({ meta, stats, daysSilent }: { meta: Repo; stats: CommitStats | null; daysSilent: number }) {
  const reduce = useReducedMotion()
  const { lived, silent, stops } = buildTrail(meta, stats, daysSilent)

  return (
    <>
      <div className="relative mx-auto hidden w-full pb-14 pt-10 text-ink sm:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <motion.path
            d={lived}
            fill="none"
            stroke="#1c1710"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT, delay: 0.25 }}
          />
          <motion.path
            d={silent}
            fill="none"
            stroke="#7a6c52"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="1 13"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 1.05 }}
          />
        </svg>
        {stops.map((s, i) => (
          <div key={s.key} className="absolute" style={{ left: `${(s.x / W) * 100}%`, top: `${(s.y / H) * 100}%` }}>
            <motion.div
              className={
                s.icon
                  ? 'absolute grid h-10 w-10 place-items-center rounded-full bg-paper-2 text-string ring-2 ring-ink/70'
                  : 'absolute h-3.5 w-3.5 rounded-full bg-ink'
              }
              style={s.icon ? { left: -20, top: -20 } : { left: -7, top: -7 }}
              initial={{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.35 + i * 0.25 }}
            >
              {s.icon}
            </motion.div>
            <motion.div
              className="absolute w-40 text-center text-sm leading-snug"
              style={{ left: -80, ...(s.side === 'above' ? { bottom: s.icon ? 30 : 16 } : { top: s.icon ? 30 : 16 }) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.5 + i * 0.25 }}
            >
              <span className="block font-semibold">{s.title}</span>
              <span className="block text-ink-soft">{s.detail}</span>
              {s.extra && <span className="mt-0.5 block font-hand text-base italic text-ink-soft">{s.extra}</span>}
            </motion.div>
          </div>
        ))}
      </div>

      <ol className="space-y-3 text-ink sm:hidden">
        {stops.map((s) => (
          <li key={s.key} className="text-sm leading-snug">
            <span className="font-semibold">{s.title}</span> <span className="text-ink-soft">{s.detail}</span>
            {s.extra && <span className="block font-hand text-base text-ink-soft">{s.extra}</span>}
          </li>
        ))}
      </ol>
    </>
  )
}
