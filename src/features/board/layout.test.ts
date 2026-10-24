import { describe, expect, it } from 'vitest'
import { HUB, placeItems, SLOT_COUNT } from './layout'

describe('placeItems', () => {
  it('puts abandoned notes left of the hub and dormant notes right of it', () => {
    const [a, d] = placeItems([
      { id: 1, status: 'abandoned' },
      { id: 2, status: 'dormant' },
    ])
    expect(a?.x).toBeLessThan(HUB.x)
    expect(d?.x).toBeGreaterThan(HUB.x)
  })

  it('gives the newest note of a group the spot nearest the hub', () => {
    const [first, second] = placeItems([
      { id: 1, status: 'abandoned' },
      { id: 2, status: 'abandoned' },
    ])
    const dist = (s?: { x: number; y: number }) => Math.hypot((s?.x ?? 0) - HUB.x, ((s?.y ?? 0) - HUB.y) * 1.4)
    expect(dist(first)).toBeLessThan(dist(second))
  })

  it('never reuses a spot, even when one group overflows into the others', () => {
    const items = Array.from({ length: SLOT_COUNT }, (_, i) => ({ id: i + 1, status: 'abandoned' as const }))
    const slots = placeItems(items)
    expect(slots).toHaveLength(SLOT_COUNT)
    const spots = new Set(slots.map((s) => `${Math.round(s.x / 6)}:${Math.round(s.y / 6)}`))
    expect(spots.size).toBe(SLOT_COUNT)
  })

  it('is stable: the same project always lands in the same place', () => {
    const items = [{ id: 42, status: 'dormant' as const }]
    expect(placeItems(items)).toEqual(placeItems(items))
  })

  it('keeps everything off the lamp', () => {
    const slots = placeItems(Array.from({ length: SLOT_COUNT }, (_, i) => ({ id: i, status: 'dormant' as const })))
    for (const s of slots) expect(s.x > 34 && s.x < 58 && s.y > 50 && s.y < 76).toBe(false)
  })
})
