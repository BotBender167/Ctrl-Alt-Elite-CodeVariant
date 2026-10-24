import { describe, expect, it } from 'vitest'
import { isAllowedPath, parseTarget } from './allow.js'

describe('proxy allow-list', () => {
  it.each([
    '/users/octocat/repos',
    '/repos/octocat/Hello-World',
    '/repos/octocat/Hello-World/commits',
    '/repos/octocat/Hello-World/readme',
    '/repos/octocat/Hello-World/releases',
    '/repos/octocat/Hello-World/git/trees/main',
    '/search/repositories',
  ])('allows %s', (path) => {
    expect(isAllowedPath(path)).toBe(true)
  })

  it.each([
    '/user',
    '/user/emails',
    '/repos/octocat/Hello-World/contents/secret.txt',
    '/repos/octocat/Hello-World/issues',
    '/users/octocat/repos/../../user',
    '/repos//x/commits',
    '/orgs/github/members',
  ])('blocks %s', (path) => {
    expect(isAllowedPath(path)).toBe(false)
  })
})

describe('parseTarget', () => {
  it('keeps the query string for allowed paths', () => {
    expect(parseTarget('/users/octocat/repos?per_page=100')?.search).toBe('?per_page=100')
  })
  it('rejects absolute URLs, protocol-relative URLs and non-strings', () => {
    expect(parseTarget('https://evil.example/users/a/repos')).toBeNull()
    expect(parseTarget('//evil.example/users/a/repos')).toBeNull()
    expect(parseTarget(undefined)).toBeNull()
    expect(parseTarget(['/users/a/repos'])).toBeNull()
  })
})
