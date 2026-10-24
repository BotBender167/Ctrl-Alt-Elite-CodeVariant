import type { Status } from '../../config/rules'

// Where notes pin on the cork, as percentages of the stage. Your profile sits in the middle (the hub) and
// every project hangs off it by a string. Quiet projects that need a verdict go to the left, dormant ones
// to the right, finished and alive ones at the edges. Inside each group the newest sits nearest the hub.

export interface Slot {
  x: number
  y: number
  rot: number
}

export const HUB = { x: 50, y: 33 } as const

// Note size in container-width units (cqw), shared by the notes and the strings that attach to them.
export const NOTE_W = 12.6
export const NOTE_H = 9
// The stage is 1470 by 852, so one percent of its height is this many width units.
export const STAGE_HEIGHT_UNITS = (852 / 1470) * 100

type Pool = 'left' | 'right' | 'outer'
interface Spot {
  x: number
  y: number
  pool: Pool
}

// Each pool is listed nearest-to-the-hub first. The lamp sits low and centre, so nothing is placed behind it.
const SPOTS: ReadonlyArray<Spot> = [
  { x: 34, y: 41, pool: 'left' },
  { x: 35, y: 12, pool: 'left' },
  { x: 22, y: 43, pool: 'left' },
  { x: 22, y: 19, pool: 'left' },
  { x: 65, y: 12, pool: 'right' },
  { x: 68, y: 41, pool: 'right' },
  { x: 78, y: 20, pool: 'right' },
  { x: 80, y: 46, pool: 'outer' },
  { x: 68, y: 62, pool: 'outer' },
  { x: 86, y: 62, pool: 'outer' },
]

export const SLOT_COUNT = SPOTS.length

const POOL_OF: Record<Status, Pool> = { abandoned: 'left', dormant: 'right', finished: 'outer', alive: 'outer' }

const distance = (s: Spot): number => Math.hypot(s.x - HUB.x, (s.y - HUB.y) * 1.4)

// A small, repeatable wobble so the board looks hand-pinned, yet the same project always lands in the same place.
function wobble(spot: Spot, seed: number): Slot {
  const h = Math.abs(Math.imul(seed + 1, 2654435761)) % 1000
  return {
    x: spot.x + ((h % 21) - 10) / 12,
    y: spot.y + (((h >> 3) % 21) - 10) / 14,
    rot: (((h >> 5) % 61) - 30) / 10,
  }
}

export interface Placeable {
  id: number
  status: Status
}

// Items arrive in the order they should sit (newest first). Each takes the nearest free spot in its own
// group; when a group is full, it takes the nearest free spot anywhere, so no project is ever dropped.
export function placeItems(items: ReadonlyArray<Placeable>): Slot[] {
  const taken = new Set<number>()
  const nearestFree = (pool: Pool | null): number => {
    let best = -1
    SPOTS.forEach((s, i) => {
      if (taken.has(i) || (pool !== null && s.pool !== pool)) return
      if (best === -1 || distance(s) < distance(SPOTS[best] as Spot)) best = i
    })
    return best
  }
  return items.slice(0, SLOT_COUNT).map((item) => {
    let i = nearestFree(POOL_OF[item.status])
    if (i === -1) i = nearestFree(null)
    taken.add(i)
    return wobble(SPOTS[i] as Spot, item.id)
  })
}

// The pin sits at the top centre of a note, in the same units as the string layer (viewBox 0 0 100 STAGE_HEIGHT_UNITS).
export function pinPoint(slot: Slot): { x: number; y: number } {
  return { x: slot.x, y: (slot.y * STAGE_HEIGHT_UNITS) / 100 - NOTE_H / 2 + 0.7 }
}

export function hubPoint(): { x: number; y: number } {
  return { x: HUB.x, y: (HUB.y * STAGE_HEIGHT_UNITS) / 100 }
}
