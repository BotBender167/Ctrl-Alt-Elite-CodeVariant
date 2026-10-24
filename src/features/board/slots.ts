// Where notes can be pinned on the cork, as percentages of the stage. The lamp sits at the lower middle,
// so the two slots behind it are left out. Each slot gets a small, repeatable wobble so the board looks hand-pinned.

export interface Slot {
  x: number
  y: number
  rot: number
}

// Note size in container-width units (cqw), shared by the notes and the strings that attach to them.
export const NOTE_W = 13.5
export const NOTE_H = 10.6
// The stage is 1470 by 852, so one percent of its height is this many width units.
export const STAGE_HEIGHT_UNITS = (852 / 1470) * 100

const BASE: ReadonlyArray<{ x: number; y: number }> = [
  { x: 22, y: 25 },
  { x: 40.5, y: 25 },
  { x: 59, y: 25 },
  { x: 77.5, y: 25 },
  { x: 22, y: 47 },
  { x: 40.5, y: 47 },
  { x: 59, y: 47 },
  { x: 77.5, y: 47 },
  { x: 21, y: 69.5 },
  { x: 62, y: 69.5 },
  { x: 80, y: 69.5 },
]

export const SLOT_COUNT = BASE.length

export function slotFor(index: number, seed: number): Slot {
  const b = BASE[index] ?? BASE[0] ?? { x: 50, y: 50 }
  const h = Math.abs(Math.imul(seed + 1, 2654435761)) % 1000
  return {
    x: b.x + ((h % 21) - 10) / 12,
    y: b.y + (((h >> 3) % 21) - 10) / 14,
    rot: (((h >> 5) % 61) - 30) / 10,
  }
}

// The pin sits at the top centre of a note, in the same units as the string layer (viewBox 0 0 100 STAGE_HEIGHT_UNITS).
export function pinPoint(slot: Slot): { x: number; y: number } {
  return { x: slot.x, y: (slot.y * STAGE_HEIGHT_UNITS) / 100 - NOTE_H / 2 + 0.7 }
}
