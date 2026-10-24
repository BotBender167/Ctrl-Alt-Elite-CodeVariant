// All tunable rules live here so a new constraint is a config change, not a rewrite.

export const RULES = {
  aliveDays: 45,
  dormantDays: 180,
  burstDays: 10,
  burstShare: 0.55,
  hackathonLifeDays: 14,
  scopeCreepSizeKb: 3000,
  scopeCreepLifeDays: 60,
  longLifeDays: 120,
  crowdedAt: 5,
  progressCommits: 60,
  salvageModulesFull: 5,
  recencyHorizonDays: 730,
  blockedWords: /\b(wip|todo|fix|fixes|bug|broken|blocked|stuck|fail|failing|hack|temp)\b/i,
  wipReadme: /(work in progress|\bWIP\b|\bTODO\b|under construction|coming soon)/i,
} as const

export type Status = 'alive' | 'dormant' | 'abandoned' | 'finished'

export const STATUS_LABEL: Record<Status, string> = {
  alive: 'Alive',
  dormant: 'Dormant',
  abandoned: 'Abandoned',
  finished: 'Finished',
}

export const STATUS_HELP: Record<Status, string> = {
  alive: 'Pushed to recently',
  dormant: 'Gone quiet, not gone for good',
  abandoned: 'Silent for a long time with loose ends',
  finished: 'Quiet, but looks complete',
}

export const ROADS = ['restart', 'continue', 'change', 'repurpose', 'archive'] as const
export type Road = (typeof ROADS)[number]

export const ROAD_LABEL: Record<Road, string> = {
  restart: 'Restart',
  continue: 'Continue',
  change: 'Change',
  repurpose: 'Repurpose',
  archive: 'Archive',
}

export const ROAD_HELP: Record<Road, string> = {
  restart: 'Start fresh with the same idea',
  continue: 'Pick up where you left off',
  change: 'Keep the code, change the idea',
  repurpose: 'Lift the best parts into something new',
  archive: 'Let it rest, with honour',
}

export const CAUSES = [
  'hackathon_ended',
  'scope_creep',
  'someone_shipped_it_first',
  'blocked',
  'life_got_busy',
  'lost_interest',
] as const
export type Cause = (typeof CAUSES)[number]

export const CAUSE_LABEL: Record<Cause, string> = {
  hackathon_ended: 'Hackathon ended',
  scope_creep: 'Scope creep',
  someone_shipped_it_first: 'Someone shipped it first',
  blocked: 'Blocked by a hard part',
  life_got_busy: 'Life got busy',
  lost_interest: 'Lost interest',
}

export const IGNORED_DIRS = new Set([
  'node_modules', '.github', '.vscode', '.idea', 'dist', 'build', '.git', 'docs', 'doc',
  'test', 'tests', '__tests__', '__pycache__', 'venv', '.venv', 'env', 'assets', 'public', 'images', 'img',
])

export const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'you', 'are', 'using', 'use', 'used', 'app', 'project',
  'simple', 'based', 'built', 'make', 'made', 'into', 'will', 'can', 'has', 'have', 'its', 'our', 'new', 'not', 'but',
  'all', 'any', 'how', 'what', 'when', 'repo', 'repository', 'code', 'readme', 'github', 'install', 'usage', 'license',
  'getting', 'started', 'features', 'feature', 'about', 'introduction', 'overview', 'contributing', 'run', 'running',
  'react', 'node', 'npm', 'yarn', 'vite', 'html', 'css', 'javascript', 'typescript', 'python', 'first', 'file', 'files',
  'demo', 'test', 'tests', 'basic', 'small', 'tool', 'tools', 'web', 'website', 'application', 'system', 'platform',
])
