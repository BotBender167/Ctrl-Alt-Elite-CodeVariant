import { NOTE_H, NOTE_W, STAGE_HEIGHT_UNITS } from './layout'
import type { Slot } from './layout'

// The details of the project you are pointing at: its own note unfolds into a larger card, in place. Whatever
// the card sits on is blurred, so only that project's details can be read.

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v))
// The cork ends at about 80% of the stage height; the controls sit below that, so the card stays above it.
const BOARD_TOP = 3
const BOARD_BOTTOM = 80
const pct = (cqw: number): number => (cqw / STAGE_HEIGHT_UNITS) * 100

// Card size in container-width units. The height is an estimate, used to find what the card covers.
export const DETAIL_W = 26
export const DETAIL_H = 19

export interface Placement {
  // centre of the card, in percent of the stage
  x: number
  y: number
}

export function placement(slot: Slot): Placement {
  return {
    x: clamp(slot.x, 19, 81),
    y: clamp(slot.y, BOARD_TOP + pct(DETAIL_H) / 2, BOARD_BOTTOM - pct(DETAIL_H) / 2),
  }
}

interface Box {
  l: number
  t: number
  r: number
  b: number
}

// A box in container-width units: the stage is 100 wide and STAGE_HEIGHT_UNITS tall.
function detailBox(p: Placement): Box {
  const cy = (p.y * STAGE_HEIGHT_UNITS) / 100
  return { l: p.x - DETAIL_W / 2, t: cy - DETAIL_H / 2, r: p.x + DETAIL_W / 2, b: cy + DETAIL_H / 2 }
}

function noteBox(slot: Slot): Box {
  const cy = (slot.y * STAGE_HEIGHT_UNITS) / 100
  return { l: slot.x - NOTE_W / 2, t: cy - NOTE_H / 2, r: slot.x + NOTE_W / 2, b: cy + NOTE_H / 2 }
}

const MARGIN = 0.4
const overlaps = (a: Box, b: Box): boolean => a.l < b.r - MARGIN && a.r > b.l + MARGIN && a.t < b.b - MARGIN && a.b > b.t + MARGIN

// Which notes does the card sit on top of? Those are the ones to blur.
export function overlappedBy(card: Slot, others: ReadonlyArray<{ id: number; slot: Slot }>, selfId: number): Set<number> {
  const box = detailBox(placement(card))
  return new Set(others.filter((o) => o.id !== selfId && overlaps(box, noteBox(o.slot))).map((o) => o.id))
}
