// The proxy only forwards the handful of read-only GitHub endpoints the app needs, so it cannot be used as an open relay.
const API_ORIGIN = 'https://api.github.com'
const NAME = String.raw`[\w.-]{1,100}`

const ALLOWED: readonly RegExp[] = [
  /^\/users\/[\w-]{1,39}\/repos$/,
  new RegExp(`^/repos/${NAME}/${NAME}$`),
  new RegExp(`^/repos/${NAME}/${NAME}/(commits|readme|releases)$`),
  new RegExp(`^/repos/${NAME}/${NAME}/git/trees/[^/]{1,100}$`),
  /^\/search\/repositories$/,
]

export function isAllowedPath(pathname: string): boolean {
  if (pathname.includes('..') || pathname.includes('//')) return false
  return ALLOWED.some((rule) => rule.test(pathname))
}

// Returns the GitHub URL to call, or null if the requested path is not on the allow-list.
export function parseTarget(raw: unknown): URL | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.length > 600) return null
  let url: URL
  try {
    url = new URL(raw, API_ORIGIN)
  } catch {
    return null
  }
  if (url.origin !== API_ORIGIN || !isAllowedPath(url.pathname)) return null
  return url
}
