import { words } from './keywords'
import type { Repo } from './types'

export interface RepoLink {
  aId: number
  bId: number
  reason: string
  strength: number
}

const MAX_LINKS_PER_REPO = 2

function tokensOf(repo: Repo): Map<string, number> {
  const tokens = new Map<string, number>()
  for (const topic of repo.topics) tokens.set(topic.toLowerCase(), 3)
  for (const w of words(repo.name.replace(/[-_.]/g, ' '))) tokens.set(w, Math.max(tokens.get(w) ?? 0, 2))
  for (const w of words(repo.description ?? '')) if (!tokens.has(w)) tokens.set(w, 1)
  return tokens
}

// Red strings connect projects that share something real: a topic, a name or description word, or a rare language.
// Each project keeps at most two strings so the board stays readable.
export function relatedLinks(repos: Repo[], maxLinks = 12): RepoLink[] {
  const tokens = repos.map(tokensOf)
  const langCount = new Map<string, number>()
  for (const r of repos) if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1)

  const candidates: RepoLink[] = []
  for (let i = 0; i < repos.length; i += 1) {
    for (let j = i + 1; j < repos.length; j += 1) {
      const a = repos[i]
      const b = repos[j]
      const ta = tokens[i]
      const tb = tokens[j]
      if (!a || !b || !ta || !tb) continue
      const shared = [...ta.keys()].filter((k) => tb.has(k))
      if (shared.length > 0) {
        const strength = shared.reduce((sum, k) => sum + Math.min(ta.get(k) ?? 0, tb.get(k) ?? 0), 0)
        const shown = shared
          .slice(0, 2)
          .map((k) => `"${k}"`)
          .join(' and ')
        candidates.push({ aId: a.id, bId: b.id, reason: `Both mention ${shown}`, strength })
      } else if (a.language && a.language === b.language && (langCount.get(a.language) ?? 0) <= 3) {
        candidates.push({ aId: a.id, bId: b.id, reason: `Both are written in ${a.language}`, strength: 0.5 })
      }
    }
  }

  const degree = new Map<number, number>()
  const chosen: RepoLink[] = []
  for (const c of candidates.sort((x, y) => y.strength - x.strength)) {
    if (chosen.length >= maxLinks) break
    if ((degree.get(c.aId) ?? 0) >= MAX_LINKS_PER_REPO || (degree.get(c.bId) ?? 0) >= MAX_LINKS_PER_REPO) continue
    chosen.push(c)
    degree.set(c.aId, (degree.get(c.aId) ?? 0) + 1)
    degree.set(c.bId, (degree.get(c.bId) ?? 0) + 1)
  }
  return chosen
}
