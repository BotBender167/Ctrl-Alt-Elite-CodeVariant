// The kinds of card that can be dragged. A zone lists the kinds it accepts.
export const CARD = {
  id: 'idcard',
  repo: 'repo',
  similar: 'similar',
  road: 'road',
  entry: 'entry',
} as const

// A project card on the board or in the mobile list.
export interface RepoCard {
  key: string
  owner: string
  name: string
}
