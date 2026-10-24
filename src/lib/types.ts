import { z } from 'zod'

export const RepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  fork: z.boolean(),
  created_at: z.string(),
  pushed_at: z.string().nullable(),
  size: z.number(),
  stargazers_count: z.number(),
  open_issues_count: z.number(),
  language: z.string().nullable(),
  archived: z.boolean(),
  default_branch: z.string(),
  topics: z.array(z.string()).optional().default([]),
  homepage: z.string().nullable().optional(),
  owner: z.object({ login: z.string() }),
})
export type Repo = z.infer<typeof RepoSchema>

export const CommitItemSchema = z.object({
  commit: z.object({
    message: z.string(),
    committer: z.object({ date: z.string() }).nullable().optional(),
    author: z.object({ date: z.string() }).nullable().optional(),
  }),
})
export type CommitItem = z.infer<typeof CommitItemSchema>

export const TreeSchema = z.object({
  tree: z.array(z.object({ path: z.string(), type: z.string() })),
})

export const SearchSchema = z.object({
  total_count: z.number(),
  items: z.array(RepoSchema),
})

export interface CommitStats {
  total: number
  firstDate: string
  lastDate: string
  lastMessage: string
  burstCount: number
  burstShare: number
}

export interface TreeEntry {
  path: string
  type: string
}

export interface ProjectData {
  meta: Repo
  stats: CommitStats | null
  readme: string
  tree: TreeEntry[]
  hasRelease: boolean
}
