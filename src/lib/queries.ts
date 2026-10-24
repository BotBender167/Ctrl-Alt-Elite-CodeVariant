import { useQuery } from '@tanstack/react-query'
import { listRepos, loadProject, searchSimilar } from './github'
import type { ProjectData } from './types'

export function useRepos(user: string) {
  return useQuery({ queryKey: ['repos', user.toLowerCase()], queryFn: () => listRepos(user) })
}

export function useProject(owner: string, repo: string) {
  return useQuery({ queryKey: ['project', owner.toLowerCase(), repo.toLowerCase()], queryFn: () => loadProject(owner, repo) })
}

export function useWorld(project: ProjectData | undefined, keywords: string[], enabled: boolean) {
  const sinceIso = project ? (project.stats?.lastDate ?? project.meta.pushed_at ?? project.meta.created_at) : ''
  return useQuery({
    queryKey: ['world', project?.meta.full_name.toLowerCase() ?? '', keywords.join('|')],
    queryFn: () => searchSimilar(keywords, sinceIso, project?.meta.full_name ?? ''),
    enabled: enabled && Boolean(project) && keywords.length > 0,
  })
}
