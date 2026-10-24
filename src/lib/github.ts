import { z } from 'zod'
import { useRate, useSettings } from '../store'
import { CommitItemSchema, RepoSchema, SearchSchema, TreeSchema } from './types'
import type { CommitItem, CommitStats, ProjectData, Repo, TreeEntry } from './types'

const BASE = 'https://api.github.com'
const TTL_MS = 10 * 60 * 1000
const MAX_PARALLEL = 4
const DAY_MS = 86_400_000

export type GhErrorKind = 'not_found' | 'rate_limited' | 'network' | 'empty' | 'other'

export class GhError extends Error {
  kind: GhErrorKind
  resetAt: number | null
  constructor(kind: GhErrorKind, message: string, resetAt: number | null = null) {
    super(message)
    this.kind = kind
    this.resetAt = resetAt
  }
}

interface Hit {
  t: number
  body: string
  link: string | null
}

const CACHE_PREFIX = 'ub:c:'

function readCache(key: string): Hit | null {
  try {
    const s = localStorage.getItem(CACHE_PREFIX + key)
    if (!s) return null
    const hit = JSON.parse(s) as Hit
    return Date.now() - hit.t < TTL_MS ? hit : null
  } catch {
    return null
  }
}

function writeCache(key: string, hit: Hit): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(hit))
  } catch {
    // Storage full: drop old cached responses and try once more.
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k)
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(hit))
    } catch {
      // Caching is best effort.
    }
  }
}

let active = 0
const waiting: Array<() => void> = []

function acquire(): Promise<void> {
  if (active < MAX_PARALLEL) {
    active += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    waiting.push(() => {
      active += 1
      resolve()
    })
  })
}

function release(): void {
  active -= 1
  waiting.shift()?.()
}

const inflight = new Map<string, Promise<Hit>>()

async function raw(path: string, accept = 'application/vnd.github+json'): Promise<Hit> {
  const key = `${accept}|${path}`
  const cached = readCache(key)
  if (cached) return cached
  const pending = inflight.get(key)
  if (pending) return pending

  const run = (async (): Promise<Hit> => {
    await acquire()
    try {
      const headers: Record<string, string> = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' }
      const token = useSettings.getState().token
      if (token) headers.Authorization = `Bearer ${token}`

      let res: Response
      try {
        res = await fetch(BASE + path, { headers })
      } catch {
        throw new GhError('network', 'Could not reach GitHub. Check your connection.')
      }

      const remaining = res.headers.get('x-ratelimit-remaining')
      const limit = res.headers.get('x-ratelimit-limit')
      const reset = res.headers.get('x-ratelimit-reset')
      const resetAt = reset ? Number(reset) * 1000 : null
      // Search has its own tiny quota, so only the main (core) quota is shown to the user.
      const isCore = (res.headers.get('x-ratelimit-resource') ?? 'core') === 'core'
      if (remaining !== null && isCore) {
        useRate.getState().set({ remaining: Number(remaining), limit: Number(limit ?? 0), resetAt })
      }

      const body = await res.text()
      if (res.status === 404) throw new GhError('not_found', 'Not found')
      if (res.status === 409) throw new GhError('empty', 'This repository is empty')
      if (res.status === 403 || res.status === 429) {
        throw new GhError('rate_limited', 'GitHub rate limit reached', resetAt)
      }
      if (!res.ok) throw new GhError('other', `GitHub returned ${res.status}`)

      const hit: Hit = { t: Date.now(), body, link: res.headers.get('link') }
      writeCache(key, hit)
      return hit
    } finally {
      release()
    }
  })()

  inflight.set(key, run)
  run.then(
    () => inflight.delete(key),
    () => inflight.delete(key),
  )
  return run
}

function parse<T>(schema: z.ZodType<T>, body: string): T {
  const result = schema.safeParse(JSON.parse(body))
  if (!result.success) throw new GhError('other', 'GitHub sent an unexpected response')
  return result.data
}

export async function listRepos(user: string): Promise<Repo[]> {
  const base = `/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`
  const first = await raw(base)
  const repos = parse(z.array(RepoSchema), first.body)
  if (first.link?.includes('rel="next"')) {
    const second = await raw(`${base}&page=2`)
    return repos.concat(parse(z.array(RepoSchema), second.body))
  }
  return repos
}

export async function getRepo(owner: string, repo: string): Promise<Repo> {
  const hit = await raw(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`)
  return parse(RepoSchema, hit.body)
}

function lastPage(link: string | null): number | null {
  const m = link?.match(/[?&]page=(\d+)>;\s*rel="last"/)
  return m ? Number(m[1]) : null
}

function commitDate(item: CommitItem): string {
  return item.commit.committer?.date ?? item.commit.author?.date ?? new Date(0).toISOString()
}

// One-commit pages let us read totals from the Link header instead of downloading history.
async function commitPage(
  owner: string,
  repo: string,
  extra: string,
): Promise<{ count: number; first: CommitItem | undefined }> {
  const hit = await raw(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1${extra}`)
  const items = parse(z.array(CommitItemSchema), hit.body)
  return { count: lastPage(hit.link) ?? items.length, first: items[0] }
}

export async function commitStats(repo: Repo): Promise<CommitStats | null> {
  const owner = repo.owner.login
  try {
    const latest = await commitPage(owner, repo.name, '')
    if (!latest.first || latest.count === 0) return null
    const total = latest.count
    const oldest = total > 1 ? (await commitPage(owner, repo.name, `&page=${total}`)).first : latest.first
    const firstDate = oldest ? commitDate(oldest) : repo.created_at
    const until = new Date(new Date(firstDate).getTime() + 10 * DAY_MS).toISOString()
    const burst = await commitPage(owner, repo.name, `&since=${encodeURIComponent(firstDate)}&until=${encodeURIComponent(until)}`)
    return {
      total,
      firstDate,
      lastDate: commitDate(latest.first),
      lastMessage: latest.first.commit.message.split('\n')[0] ?? '',
      burstCount: burst.count,
      burstShare: Math.min(1, burst.count / total),
    }
  } catch (e) {
    if (e instanceof GhError && e.kind === 'empty') return null
    throw e
  }
}

export async function getReadme(owner: string, repo: string): Promise<string> {
  try {
    const hit = await raw(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      'application/vnd.github.raw+json',
    )
    return hit.body.slice(0, 20_000)
  } catch (e) {
    if (e instanceof GhError && (e.kind === 'not_found' || e.kind === 'empty')) return ''
    throw e
  }
}

export async function getTopLevel(owner: string, repo: string, branch: string): Promise<TreeEntry[]> {
  try {
    const hit = await raw(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}`,
    )
    return parse(TreeSchema, hit.body).tree
  } catch (e) {
    if (e instanceof GhError && e.kind !== 'rate_limited' && e.kind !== 'network') return []
    throw e
  }
}

export async function getHasRelease(owner: string, repo: string): Promise<boolean> {
  try {
    const hit = await raw(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=1`)
    return parse(z.array(z.unknown()), hit.body).length > 0
  } catch (e) {
    if (e instanceof GhError && e.kind !== 'rate_limited' && e.kind !== 'network') return false
    throw e
  }
}

export async function loadProject(owner: string, repo: string): Promise<ProjectData> {
  const meta = await getRepo(owner, repo)
  const [stats, readme, tree, hasRelease] = await Promise.all([
    commitStats(meta),
    getReadme(owner, repo),
    getTopLevel(owner, repo, meta.default_branch),
    getHasRelease(owner, repo),
  ])
  return { meta, stats, readme, tree, hasRelease }
}

// Looks for projects like this one that appeared after the last commit. Matching on name, description and
// topics (not README text) and on the same language keeps the results about the same idea, not just the same words.
export async function searchSimilar(
  keywords: string[],
  sinceIso: string,
  selfFullName: string,
  language: string | null,
): Promise<Repo[]> {
  if (keywords.length === 0) return []
  const since = sinceIso.slice(0, 10)
  const lang = language ? ` language:${language.includes(' ') ? `"${language}"` : language}` : ''
  const run = async (words: string[]): Promise<Repo[]> => {
    const q = `${words.join(' ')} in:name,description,topics created:>${since} fork:false${lang}`
    const hit = await raw(`/search/repositories?q=${encodeURIComponent(q)}&per_page=8`)
    return parse(SearchSchema, hit.body).items.filter((r) => r.full_name.toLowerCase() !== selfFullName.toLowerCase())
  }
  const attempts = [keywords.slice(0, 3), keywords.slice(0, 2), keywords.slice(0, 1)].filter(
    (w, i, all) => all.findIndex((x) => x.join() === w.join()) === i,
  )
  for (const words of attempts) {
    const found = await run(words)
    if (found.length > 0) return found
  }
  return []
}
