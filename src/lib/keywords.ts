import { IGNORED_DIRS, RULES, STOPWORDS } from '../config/rules'
import type { TreeEntry } from './types'

interface KeywordInput {
  name: string
  topics: string[]
  description: string | null
  readme: string
}

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s_]+/)
    .map((w) => w.replace(/^-+|-+$/g, ''))
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOPWORDS.has(w))
}

// Topics are the strongest signal, then the name, description, README headings and opening text.
export function extractKeywords(input: KeywordInput, max = 4): string[] {
  const score = new Map<string, number>()
  const add = (list: string[], weight: number): void => {
    for (const w of list) score.set(w, (score.get(w) ?? 0) + weight)
  }
  add(
    input.topics.filter((t) => !STOPWORDS.has(t)),
    6,
  )
  add(words(input.name.replace(/[-_.]/g, ' ')), 3)
  add(words(input.description ?? ''), 3)
  const headings = input.readme
    .split('\n')
    .filter((l) => l.startsWith('#'))
    .join(' ')
  add(words(headings), 2)
  add(words(stripMarkdown(input.readme).slice(0, 800)), 1)
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w)
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[*_`>]/g, '')
}

export function summarize(readme: string, description: string | null): string {
  const paragraphs = stripMarkdown(readme)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 30)
  const first = paragraphs[0] ?? description ?? ''
  return first.length > 200 ? `${first.slice(0, 197)}...` : first
}

export function readmeLooksWip(readme: string): boolean {
  return RULES.wipReadme.test(readme)
}

export function salvageModules(tree: TreeEntry[]): string[] {
  const dirs = tree
    .filter((e) => e.type === 'tree' && !IGNORED_DIRS.has(e.path.toLowerCase()) && !e.path.startsWith('.'))
    .map((e) => e.path)
  const codeFiles = tree.filter((e) => e.type === 'blob' && /\.(js|jsx|ts|tsx|py|java|c|cpp|go|rs|rb|php|kt|swift|dart)$/i.test(e.path))
  const modules = dirs.slice(0, 8)
  if (codeFiles.length >= 3) modules.push(`${codeFiles.length} source files in the root`)
  return modules
}
