import { describe, expect, it } from 'vitest'
import { DETAIL_H, overlappedBy, placement } from './detail'
import { NOTE_W, placeItems, STAGE_HEIGHT_UNITS } from './layout'

const slots = placeItems(Array.from({ length: 7 }, (_, i) => ({ id: i + 1, status: i < 4 ? ('abandoned' as const) : ('dormant' as const) })))
const spokes = slots.map((slot, i) => ({ id: i + 1, slot }))

describe('placement', () => {
  it('unfolds where the note is, kept inside the board', () => {
    const p = placement({ x: 5, y: 95, rot: 0 })
    expect(p.x).toBeGreaterThanOrEqual(19)
    expect(p.y).toBeLessThanOrEqual(64)
  })

  it('never runs under the controls at the bottom or off the top', () => {
    for (let y = 8; y <= 78; y += 5) {
      for (let x = 15; x <= 88; x += 9) {
        const p = placement({ x, y, rot: 0 })
        const half = ((DETAIL_H / STAGE_HEIGHT_UNITS) * 100) / 2
        expect(p.y + half, `at ${x},${y}`).toBeLessThanOrEqual(80.5)
        expect(p.y - half, `at ${x},${y}`).toBeGreaterThanOrEqual(2.5)
      }
    }
  })
})

describe('overlappedBy', () => {
  it('never blurs the note the card belongs to', () => {
    for (const s of spokes) expect(overlappedBy(s.slot, spokes, s.id).has(s.id)).toBe(false)
  })

  it('blurs a neighbour that sits under the card', () => {
    const a = { x: 40, y: 40, rot: 0 }
    const near = { id: 2, slot: { x: 40 + NOTE_W * 0.6, y: 40, rot: 0 } }
    expect(overlappedBy(a, [{ id: 1, slot: a }, near], 1).has(2)).toBe(true)
  })

  it('blurs nothing when the card has the cork to itself', () => {
    const lone = { x: 22, y: 43, rot: 0 }
    const far = { id: 2, slot: { x: 85, y: 62, rot: 0 } }
    expect(overlappedBy(lone, [{ id: 1, slot: lone }, far], 1).size).toBe(0)
  })
})
