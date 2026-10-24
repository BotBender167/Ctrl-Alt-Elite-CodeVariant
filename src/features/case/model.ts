import { useMemo, useState } from 'react'
import type { Cause, Road } from '../../config/rules'
import { daysBetween, daysBetweenDates } from '../../lib/format'
import { extractKeywords, readmeLooksWip, salvageModules, summarize } from '../../lib/keywords'
import { useWorld } from '../../lib/queries'
import { classifyDeep, rankCauses, scoreRoads } from '../../lib/rules'
import type { ProjectData, Repo } from '../../lib/types'

export const MAX_COMPARE = 3

// Everything a case file knows about one project, computed once and shared by all four steps.
export function useCaseModel(data: ProjectData) {
  const { meta, stats, readme, tree, hasRelease } = data
  const [daysSilent] = useState(() => daysBetween(meta.pushed_at ?? meta.created_at))
  const cls = classifyDeep(meta, { hasRelease, wip: readmeLooksWip(readme), burstShare: stats?.burstShare ?? null })
  const lifeDays = stats ? daysBetweenDates(stats.firstDate, stats.lastDate) : null
  const lastDate = stats?.lastDate ?? meta.pushed_at ?? meta.created_at
  const summary = summarize(readme, meta.description)
  const modules = useMemo(() => salvageModules(tree), [tree])

  const defaultKeywords = useMemo(
    () => extractKeywords({ name: meta.name, topics: meta.topics, description: meta.description, readme }),
    [meta, readme],
  )
  const [customKeywords, setCustomKeywords] = useState<string[] | null>(null)
  const keywords = customKeywords ?? defaultKeywords

  // The search starts as soon as the file opens, so by the time someone reaches step three the results are ready.
  const world = useWorld(data, keywords, true)
  const similar: Repo[] | null = world.data ?? null

  const causes = rankCauses({
    lifeDays,
    burstShare: stats?.burstShare ?? null,
    sizeKb: meta.size,
    lastMessage: stats?.lastMessage ?? '',
    similarCount: similar ? similar.length : null,
    daysSilent,
  })
  const cause: Cause = causes[0]?.cause ?? 'lost_interest'

  const [picks, setPicks] = useState<Repo[]>([])
  function togglePick(repo: Repo): void {
    setPicks((current) => {
      if (current.some((r) => r.id === repo.id)) return current.filter((r) => r.id !== repo.id)
      return current.length >= MAX_COMPARE ? current : [...current, repo]
    })
  }

  const roads = scoreRoads({
    status: cls.status,
    daysSilent,
    totalCommits: stats?.total ?? null,
    similarCount: similar ? similar.length : null,
    topSimilarStars: similar?.[0]?.stargazers_count ?? 0,
    salvageCount: modules.length,
  })
  const [pickedRoad, setPickedRoad] = useState<Road | null>(null)
  const road: Road = pickedRoad ?? roads[0]?.road ?? 'archive'

  return {
    data,
    meta,
    stats,
    cls,
    daysSilent,
    lifeDays,
    lastDate,
    summary,
    modules,
    keywords,
    setKeywords: setCustomKeywords,
    world,
    similar,
    cause,
    picks,
    togglePick,
    roads,
    road,
    setRoad: setPickedRoad,
  }
}

export type CaseModel = ReturnType<typeof useCaseModel>
