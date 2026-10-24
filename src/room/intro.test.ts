import { describe, expect, it } from 'vitest'
import { doorClip, doorOpen, INTRO } from './intro'

describe('doorOpen', () => {
  it('is shut until the door starts to open and fully open when the room fills the screen', () => {
    expect(doorOpen(0)).toBe(0)
    expect(doorOpen(INTRO.doorStart)).toBe(0)
    expect(doorOpen(INTRO.doorEnd)).toBe(1)
    expect(doorOpen(1)).toBe(1)
  })

  it('only ever opens further as you scroll down', () => {
    let last = 0
    for (let p = INTRO.doorStart; p <= INTRO.doorEnd; p += 0.01) {
      const now = doorOpen(p)
      expect(now).toBeGreaterThanOrEqual(last)
      last = now
    }
  })
})

describe('doorClip', () => {
  it('starts as a narrow slit in the middle of the screen', () => {
    const [top, right, bottom, left] = (doorClip(0, 1470, 852).match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
    const slitWidth = 1470 - (right ?? 0) - (left ?? 0)
    expect(slitWidth).toBeGreaterThan(5)
    expect(slitWidth).toBeLessThan(80)
    expect((left ?? 0) + slitWidth / 2).toBeCloseTo(735, -1)
    expect(top).toBeGreaterThan(0)
    expect(bottom).toBeGreaterThan(0)
  })

  it('ends covering the whole viewport', () => {
    expect(doorClip(1, 1470, 852)).toBe('inset(0.0px 0.0px 0.0px 0.0px round 0.0px)')
  })

  it('keeps the slit on the door whatever the window shape', () => {
    for (const [w, h] of [[390, 844], [1470, 852], [2560, 900]] as const) {
      const [, right, , left] = (doorClip(0, w, h).match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
      const centre = (left ?? 0) + (w - (right ?? 0) - (left ?? 0)) / 2
      expect(centre).toBeCloseTo(w / 2, -1)
    }
  })
})
