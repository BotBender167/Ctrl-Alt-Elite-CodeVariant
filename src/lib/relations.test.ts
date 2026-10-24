import { describe, expect, it } from 'vitest'
import { relatedLinks } from './relations'
import type { Repo } from './types'

function repo(id: number, name: string, over: Partial<Repo> = {}): Repo {
  return {
    id,
    name,
    full_name: `me/${name}`,
    html_url: `https://github.com/me/${name}`,
    description: null,
    fork: false,
    created_at: '2025-01-01T00:00:00Z',
    pushed_at: '2025-02-01T00:00:00Z',
    size: 10,
    stargazers_count: 0,
    open_issues_count: 0,
    language: null,
    archived: false,
    default_branch: 'main',
    topics: [],
    homepage: null,
    owner: { login: 'me' },
    ...over,
  }
}

describe('relatedLinks', () => {
  it('links projects that share a meaningful word and explains why', () => {
    const links = relatedLinks([repo(1, 'radar-scanner'), repo(2, 'radar-display'), repo(3, 'recipe-book')])
    expect(links).toHaveLength(1)
    expect(links[0]?.reason).toContain('radar')
  })

  it('links projects in the same rare language when nothing else matches', () => {
    const links = relatedLinks([repo(1, 'alpha', { language: 'Rust' }), repo(2, 'zeta', { language: 'Rust' })])
    expect(links[0]?.reason).toBe('Both are written in Rust')
  })

  it('gives each project at most two strings', () => {
    const names = ['one', 'two', 'six', 'ten', 'big']
    const links = relatedLinks(names.map((n, i) => repo(i + 1, `radar-${n}`)))
    const degree = new Map<number, number>()
    for (const l of links) {
      degree.set(l.aId, (degree.get(l.aId) ?? 0) + 1)
      degree.set(l.bId, (degree.get(l.bId) ?? 0) + 1)
    }
    expect([...degree.values()].every((d) => d <= 2)).toBe(true)
  })

  it('returns nothing for unrelated projects', () => {
    expect(relatedLinks([repo(1, 'garden'), repo(2, 'engine', { language: 'Go' })])).toEqual([])
  })
})
