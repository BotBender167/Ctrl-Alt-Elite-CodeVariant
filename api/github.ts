import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseTarget } from './_lib/allow.js'

// Server-side GitHub proxy. It adds a token (so the quota is 5,000 an hour instead of 60 per visitor network),
// and lets Vercel's CDN cache repeated lookups. Enable it by setting VITE_API_PROXY=/api/github at build time.
const ACCEPT = new Set(['application/vnd.github+json', 'application/vnd.github.raw+json'])
const PASS_THROUGH = ['content-type', 'link', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'x-ratelimit-resource']

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const target = parseTarget(req.query.path)
  if (!target) {
    res.status(400).json({ error: 'That path is not available through the proxy' })
    return
  }

  const requested = String(req.headers.accept ?? '')
  const headers: Record<string, string> = {
    Accept: ACCEPT.has(requested) ? requested : 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'unfinished-business',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const upstream = await fetch(target, { headers, signal: AbortSignal.timeout(10_000) })
    const body = await upstream.text()
    for (const name of PASS_THROUGH) {
      const value = upstream.headers.get(name)
      if (value) res.setHeader(name, value)
    }
    if (upstream.ok) res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.status(upstream.status).send(body)
  } catch {
    res.status(502).json({ error: 'GitHub could not be reached' })
  }
}
