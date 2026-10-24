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

export type Likelihood = 'likely' | 'possible' | 'unlikely'

export interface CauseGuess {
  cause: Cause
  score: number
  likelihood: Likelihood
  why: string
}

export const LIKELIHOOD_LABEL: Record<Likelihood, string> = {
  likely: 'Likely',
  possible: 'Possible',
  unlikely: 'Unlikely',
}

function likelihoodOf(score: number): Likelihood {
  if (score >= 0.6) return 'likely'
  if (score >= 0.3) return 'possible'
  return 'unlikely'
}

// Every plausible reason gets a score and the evidence behind it, so people can pick the one that feels true.
export function rankCauses(i: CauseInput): CauseGuess[] {
  const life = i.lifeDays
  const burst = i.burstShare ?? 0
  const guesses: Array<{ cause: Cause; score: number; why: string }> = []

  if (i.similarCount === null) {
    guesses.push({ cause: 'someone_shipped_it_first', score: 0.15, why: 'We are still searching for similar projects.' })
  } else if (i.similarCount >= 1) {
    guesses.push({
      cause: 'someone_shipped_it_first',
      score: Math.min(0.95, 0.35 + i.similarCount * 0.12),
      why: `${i.similarCount} similar project${i.similarCount === 1 ? '' : 's'} appeared after you stopped.`,
    })
  } else {
    guesses.push({ cause: 'someone_shipped_it_first', score: 0.05, why: 'Nothing similar has appeared since.' })
  }

  if (life !== null && life <= RULES.hackathonLifeDays && burst >= RULES.burstShare) {
    guesses.push({ cause: 'hackathon_ended', score: 0.9, why: `The whole project lived ${fmtDays(life)}, in one burst.` })
  } else if (life !== null && life <= 30 && burst >= 0.4) {
    guesses.push({ cause: 'hackathon_ended', score: 0.5, why: `Most work happened in one short stretch, over ${fmtDays(life)}.` })
  } else {
    guesses.push({ cause: 'hackathon_ended', score: 0.08, why: 'The work was not squeezed into a single sprint.' })
  }

  if (life !== null && i.sizeKb >= RULES.scopeCreepSizeKb && life <= RULES.scopeCreepLifeDays) {
    guesses.push({ cause: 'scope_creep', score: 0.8, why: `A big codebase built in just ${fmtDays(life)}.` })
  } else if (life !== null && i.sizeKb >= 1500 && life <= 90) {
    guesses.push({ cause: 'scope_creep', score: 0.4, why: 'It grew quickly for how long it lived.' })
  } else {
    guesses.push({ cause: 'scope_creep', score: 0.08, why: 'The repository is a modest size for its age.' })
  }

  if (RULES.blockedWords.test(i.lastMessage)) {
    guesses.push({ cause: 'blocked', score: 0.7, why: `Your last commit message was "${i.lastMessage.slice(0, 60)}".` })
  } else {
    guesses.push({ cause: 'blocked', score: 0.1, why: 'The last commit does not read like a struggle.' })
  }

  if (life !== null && life >= RULES.longLifeDays) {
    guesses.push({ cause: 'life_got_busy', score: 0.6, why: `It ran for ${fmtDays(life)} before going quiet, which fits a busy stretch.` })
  } else {
    guesses.push({ cause: 'life_got_busy', score: 0.12, why: 'It did not run long enough to show a slow fade.' })
  }

  guesses.push({ cause: 'lost_interest', score: 0.25, why: 'The honest default when nothing else stands out.' })

  return guesses.map((g) => ({ ...g, likelihood: likelihoodOf(g.score) })).sort((x, y) => y.score - x.score)
}

export function suggestCause(i: CauseInput): { cause: Cause; why: string } {
  const top = rankCauses(i)[0]
  return top ? { cause: top.cause, why: top.why } : { cause: 'lost_interest', why: 'No signal either way.' }
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
