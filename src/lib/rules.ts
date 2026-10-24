import { CAUSE_LABEL, ROADS, RULES } from '../config/rules'
import type { Cause, Road, Status } from '../config/rules'
import { daysBetween, fmtDays } from './format'
import type { Repo } from './types'

export interface Classified {
  status: Status
  evidence: string[]
}

export function classifyList(repo: Repo, now: number = Date.now()): Classified {
  const days = daysBetween(repo.pushed_at ?? repo.created_at, now)
  if (repo.archived) return { status: 'finished', evidence: ['Archived by its owner'] }
  if (days < RULES.aliveDays) {
    return { status: 'alive', evidence: [`Last push ${fmtDays(days)} ago (alive under ${RULES.aliveDays} days)`] }
  }
  if (days < RULES.dormantDays) {
    return {
      status: 'dormant',
      evidence: [`Last push ${fmtDays(days)} ago (dormant until ${RULES.dormantDays} days)`],
    }
  }
  const looksDone = repo.open_issues_count === 0 && (repo.stargazers_count >= 3 || Boolean(repo.homepage))
  if (looksDone) {
    return { status: 'finished', evidence: [`Quiet for ${fmtDays(days)}, no open issues, and people use it`] }
  }
  const evidence = [`Silent for ${fmtDays(days)} (abandoned after ${RULES.dormantDays} days)`]
  if (repo.open_issues_count > 0) evidence.push(`${repo.open_issues_count} open issue${repo.open_issues_count === 1 ? '' : 's'} left behind`)
  return { status: 'abandoned', evidence }
}

export interface DeepSignals {
  hasRelease: boolean
  wip: boolean
  burstShare: number | null
}

// After opening a project we know more, so the list guess can be corrected with evidence.
export function classifyDeep(repo: Repo, deep: DeepSignals, now: number = Date.now()): Classified {
  const base = classifyList(repo, now)
  const days = daysBetween(repo.pushed_at ?? repo.created_at, now)
  if (days < RULES.dormantDays || repo.archived) return base
  if (deep.hasRelease && !deep.wip) {
    return { status: 'finished', evidence: [...base.evidence, 'Has a published release and no work-in-progress markers'] }
  }
  const evidence = [...base.evidence]
  if (deep.wip) evidence.push('README still mentions work in progress')
  if (deep.burstShare !== null && deep.burstShare >= RULES.burstShare) {
    evidence.push(`${Math.round(deep.burstShare * 100)}% of all commits landed in the first ${RULES.burstDays} days`)
  }
  if (deep.wip || (deep.burstShare !== null && deep.burstShare >= RULES.burstShare)) {
    return { status: 'abandoned', evidence }
  }
  return { status: base.status, evidence }
}

export interface CauseInput {
  lifeDays: number | null
  burstShare: number | null
  sizeKb: number
  lastMessage: string
  similarCount: number | null
  daysSilent: number
}

export function suggestCause(i: CauseInput): { cause: Cause; why: string } {
  const life = i.lifeDays
  if (i.similarCount !== null && i.similarCount >= 3) {
    return { cause: 'someone_shipped_it_first', why: `${i.similarCount} similar projects appeared after you stopped` }
  }
  if (life !== null && life <= RULES.hackathonLifeDays && (i.burstShare ?? 0) >= RULES.burstShare) {
    return { cause: 'hackathon_ended', why: `The whole project lived ${fmtDays(life)}, in one burst` }
  }
  if (life !== null && i.sizeKb >= RULES.scopeCreepSizeKb && life <= RULES.scopeCreepLifeDays) {
    return { cause: 'scope_creep', why: `A big codebase built in just ${fmtDays(life)}` }
  }
  if (RULES.blockedWords.test(i.lastMessage)) {
    return { cause: 'blocked', why: `Last commit message: "${i.lastMessage.slice(0, 60)}"` }
  }
  if (life !== null && life >= RULES.longLifeDays) {
    return { cause: 'life_got_busy', why: `It ran for ${fmtDays(life)} before going quiet` }
  }
  return { cause: 'lost_interest', why: 'No stronger signal in the history, so this is the honest default' }
}

export function causeLabel(c: Cause): string {
  return CAUSE_LABEL[c]
}

export interface RoadInput {
  status: Status
  daysSilent: number
  totalCommits: number | null
  similarCount: number | null
  topSimilarStars: number
  salvageCount: number
}

export interface RoadScore {
  road: Road
  score: number
  reasons: string[]
}

const clamp = (n: number): number => Math.max(0, Math.min(1, n))

export function scoreRoads(i: RoadInput): RoadScore[] {
  const recency = clamp(1 - i.daysSilent / RULES.recencyHorizonDays)
  const progress = clamp((i.totalCommits ?? 0) / RULES.progressCommits)
  const salvage = clamp(i.salvageCount / RULES.salvageModulesFull)
  const known = i.similarCount !== null
  const crowded = known ? clamp((i.similarCount ?? 0) / RULES.crowdedAt) : 0.4
  const finished = i.status === 'finished'

  const raw: Record<Road, number> = {
    continue: 0.45 * recency + 0.35 * progress + 0.2 * (1 - crowded),
    restart: 0.5 * (1 - crowded) + 0.3 * (1 - progress) + 0.2 * recency,
    change: 0.5 * crowded + 0.3 * progress + 0.2 * salvage,
    repurpose: 0.5 * salvage + 0.3 * crowded + 0.2 * progress,
    archive: 0.4 * (1 - recency) + 0.3 * crowded + 0.3 * (1 - salvage),
  }
  if (finished) {
    raw.archive += 0.35
    raw.continue -= 0.2
    raw.restart -= 0.1
  }

  const reasons: Record<Road, string[]> = {
    continue: [],
    restart: [],
    change: [],
    repurpose: [],
    archive: [],
  }
  const unknownNote = 'World check not run yet, so similar projects are unknown'
  if (recency > 0.5) reasons.continue.push(`Only ${fmtDays(i.daysSilent)} silent, momentum is recoverable`)
  if (progress > 0.4) reasons.continue.push(`Real progress: ${i.totalCommits} commits already`)
  if (known && crowded < 0.3) reasons.continue.push('Few similar projects, the space is still open')

  if (known && crowded < 0.3) reasons.restart.push('The idea still looks open, nobody crowded it')
  if (progress < 0.3) reasons.restart.push('Little code to throw away')
  if (!known) reasons.restart.push(unknownNote)

  if (known && crowded >= 0.5) {
    reasons.change.push(`${i.similarCount} similar projects shipped since, so the idea itself is taken`)
  }
  if (progress > 0.3) reasons.change.push('You built enough to pivot from')

  if (salvage >= 0.4) reasons.repurpose.push(`${i.salvageCount} modules in the repo are worth lifting out`)
  if (known && crowded >= 0.4) reasons.repurpose.push('The idea is crowded, but the parts are still yours')

  if (recency < 0.3) reasons.archive.push(`Silent for ${fmtDays(i.daysSilent)}`)
  if (finished) reasons.archive.push('Looks complete, a rest with honour')
  if (known && crowded >= 0.6 && i.topSimilarStars >= 500) reasons.archive.push(`A rival has ${i.topSimilarStars} stars`)

  return ROADS.map((road) => ({
    road,
    score: Math.round(Math.max(0, Math.min(1, raw[road])) * 100),
    reasons: reasons[road].length > 0 ? reasons[road].slice(0, 3) : ['No strong signal either way'],
  })).sort((a, b) => b.score - a.score)
}
