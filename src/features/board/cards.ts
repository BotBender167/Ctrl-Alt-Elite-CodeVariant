import { CheckCircle, Ghost, Lightning, Moon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { Status } from '../../config/rules'
import type { Repo } from '../../lib/types'
import type { RepoCard } from '../dnd/types'

export const STATUS_ICON: Record<Status, Icon> = { abandoned: Ghost, dormant: Moon, alive: Lightning, finished: CheckCircle }

export function cardOf(repo: Repo): RepoCard {
  return { key: `${repo.owner.login}/${repo.name}`.toLowerCase(), owner: repo.owner.login, name: repo.name }
}
