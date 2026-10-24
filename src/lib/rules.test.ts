import { describe, expect, it } from 'vitest'
import { extractKeywords, salvageModules, summarize } from './keywords'
import { classifyDeep, classifyList, rankCauses, scoreRoads, suggestCause } from './rules'
import type { Repo } from './types'

const NOW = new Date('2026-10-24T12:00:00Z').getTime()
const daysAgo = (d: number): string => new Date(NOW - d * 86_400_000).toISOString()

function repo(over: Partial<Repo> = {}): Repo {
  return {
    id: 1,
    name: 'chat-app',
    full_name: 'me/chat-app',
    html_url: 'https://github.com/me/chat-app',
    description: 'A realtime chat app',
    fork: false,
    created_at: daysAgo(400),
    pushed_at: daysAgo(300),
    size: 500,
    stargazers_count: 0,
    open_issues_count: 2,
    language: 'TypeScript',
    archived: false,
    default_branch: 'main',
    topics: [],
    homepage: null,
    owner: { login: 'me' },
    ...over,
  }
}

describe('classifyList', () => {
  it('marks a recent push alive', () => {
    expect(classifyList(repo({ pushed_at: daysAgo(10) }), NOW).status).toBe('alive')
  })
  it('marks a few months silent as dormant', () => {
    expect(classifyList(repo({ pushed_at: daysAgo(100) }), NOW).status).toBe('dormant')
  })
  it('marks long silence with open issues as abandoned and shows evidence', () => {
    const c = classifyList(repo(), NOW)
    expect(c.status).toBe('abandoned')
    expect(c.evidence.join(' ')).toContain('open issue')
  })
  it('treats an owner-archived repo as finished', () => {
    expect(classifyList(repo({ archived: true }), NOW).status).toBe('finished')
  })
  it('treats quiet repos with no issues and stars as finished', () => {
    expect(classifyList(repo({ open_issues_count: 0, stargazers_count: 5 }), NOW).status).toBe('finished')
  })
})

describe('classifyDeep', () => {
  it('upgrades to finished when a release exists without WIP markers', () => {
    const c = classifyDeep(repo(), { hasRelease: true, wip: false, burstShare: 0.2 }, NOW)
    expect(c.status).toBe('finished')
  })
  it('stays abandoned and explains a burst', () => {
    const c = classifyDeep(repo(), { hasRelease: false, wip: false, burstShare: 0.8 }, NOW)
    expect(c.status).toBe('abandoned')
    expect(c.evidence.join(' ')).toContain('80%')
  })
})

describe('suggestCause', () => {
  const base = { lifeDays: 90, burstShare: 0.2, sizeKb: 100, lastMessage: 'update readme', similarCount: null, daysSilent: 300 }
  it('picks hackathon ended for a short burst', () => {
    expect(suggestCause({ ...base, lifeDays: 5, burstShare: 0.9 }).cause).toBe('hackathon_ended')
  })
  it('picks someone shipped it first when the world check finds rivals', () => {
    expect(suggestCause({ ...base, similarCount: 4 }).cause).toBe('someone_shipped_it_first')
  })
  it('picks blocked from a worrying last commit message', () => {
    expect(suggestCause({ ...base, lastMessage: 'fix broken auth, still stuck' }).cause).toBe('blocked')
  })
  it('falls back to lost interest', () => {
    expect(suggestCause(base).cause).toBe('lost_interest')
  })
})

describe('scoreRoads', () => {
  it('prefers archive for a finished project', () => {
    const r = scoreRoads({ status: 'finished', daysSilent: 600, totalCommits: 80, similarCount: 1, topSimilarStars: 10, salvageCount: 1 })
    expect(r[0]?.road).toBe('archive')
  })
  it('prefers continue for a recent, progressed project in an open space', () => {
    const r = scoreRoads({ status: 'dormant', daysSilent: 60, totalCommits: 70, similarCount: 0, topSimilarStars: 0, salvageCount: 2 })
    expect(r[0]?.road).toBe('continue')
  })
  it('prefers repurpose or change when the space is crowded and parts are reusable', () => {
    const r = scoreRoads({ status: 'abandoned', daysSilent: 400, totalCommits: 40, similarCount: 6, topSimilarStars: 900, salvageCount: 5 })
    expect(['repurpose', 'change']).toContain(r[0]?.road)
  })
  it('always returns five roads with reasons', () => {
    const r = scoreRoads({ status: 'abandoned', daysSilent: 300, totalCommits: null, similarCount: null, topSimilarStars: 0, salvageCount: 0 })
    expect(r).toHaveLength(5)
    expect(r.every((x) => x.reasons.length > 0)).toBe(true)
  })
})

describe('keywords', () => {
  it('prefers topics and drops stopwords', () => {
    const k = extractKeywords({ name: 'my-app', topics: ['chatbot', 'realtime'], description: 'A simple app using the web', readme: '' })
    expect(k.slice(0, 2)).toEqual(['chatbot', 'realtime'])
    expect(k).not.toContain('the')
  })
  it('summarizes the first real paragraph', () => {
    const s = summarize('# Title\n\n![badge](x.png)\n\nThis is a tool that turns notes into flashcards for study.', null)
    expect(s).toContain('flashcards')
  })
  it('lists top-level folders worth keeping and ignores tooling dirs', () => {
    const m = salvageModules([
      { path: 'parser', type: 'tree' },
      { path: 'node_modules', type: 'tree' },
      { path: '.github', type: 'tree' },
    ])
    expect(m).toEqual(['parser'])
  })
})

describe('rankCauses', () => {
  const base = { lifeDays: 90, burstShare: 0.2, sizeKb: 100, lastMessage: 'update readme', similarCount: null, daysSilent: 300 }

  it('returns all six reasons, most plausible first, each with evidence', () => {
    const r = rankCauses({ ...base, lifeDays: 4, burstShare: 0.9 })
    expect(r).toHaveLength(6)
    expect(r[0]?.cause).toBe('hackathon_ended')
    expect(r[0]?.likelihood).toBe('likely')
    expect(r.every((g) => g.why.length > 0)).toBe(true)
  })

  it('rates "someone shipped it first" higher as more similar projects are found', () => {
    const score = (n: number) => rankCauses({ ...base, similarCount: n }).find((g) => g.cause === 'someone_shipped_it_first')?.score ?? 0
    expect(score(6)).toBeGreaterThan(score(1))
    expect(score(0)).toBeLessThan(score(1))
  })
})
