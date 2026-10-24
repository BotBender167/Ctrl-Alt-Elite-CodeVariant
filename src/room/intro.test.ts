import { describe, expect, it } from 'vitest'
import { DOOR_TRACK } from './doorTrack'
import { doorClip, doorOpen, INTRO, videoFrame } from './intro'

const insets = (clip: string): number[] => (clip.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

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

describe('the doorway track', () => {
  it('starts when the door first opens, in frame order, and only ever grows', () => {
    const widths = DOOR_TRACK.map((t) => t.rect[2] - t.rect[0])
    expect(DOOR_TRACK.map((t) => t.frame)).toEqual([...DOOR_TRACK.map((t) => t.frame)].sort((a, b) => a - b))
    expect(widths[0]).toBeLessThan(0.02)
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThanOrEqual((widths[i - 1] ?? 0) - 1e-9)
  })

  it('maps the first door frame to the point where the door starts to open', () => {
    const first = DOOR_TRACK[0]
    expect(videoFrame(INTRO.doorStart)).toBeCloseTo(first?.frame ?? 0, 0)
  })
})

describe('doorClip', () => {
  it('shows nothing while the door is shut', () => {
    expect(doorClip(0, 1470, 852)).toBe('inset(50% 50% 50% 50%)')
    expect(doorClip(INTRO.doorStart - 0.05, 1470, 852)).toBe('inset(50% 50% 50% 50%)')
  })

  it('opens as a thin slit in the middle of the screen', () => {
    const [top, right, bottom, left] = insets(doorClip(INTRO.doorStart + 0.002, 1470, 852))
    const width = 1470 - (right ?? 0) - (left ?? 0)
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThan(120)
    expect(Math.abs((left ?? 0) + width / 2 - 735)).toBeLessThan(15)
    expect(top).toBeGreaterThan(0)
    expect(bottom).toBeGreaterThan(0)
  })

  it('widens as you scroll', () => {
    const width = (p: number): number => {
      const [, right, , left] = insets(doorClip(p, 1470, 852))
      return 1470 - (right ?? 0) - (left ?? 0)
    }
    expect(width(INTRO.videoEnd)).toBeGreaterThan(width(INTRO.doorStart + 0.05))
    expect(width(INTRO.doorEnd)).toBeGreaterThan(width(INTRO.videoEnd))
  })

  it('ends covering the whole viewport', () => {
    expect(doorClip(INTRO.doorEnd, 1470, 852)).toBe('inset(0.0px 0.0px 0.0px 0.0px)')
    expect(doorClip(1, 1470, 852)).toBe('inset(0.0px 0.0px 0.0px 0.0px)')
  })

  it('keeps the doorway centred whatever the window shape', () => {
    for (const [w, h] of [[390, 844], [1470, 852], [2560, 900]] as const) {
      const [, right, , left] = insets(doorClip(INTRO.doorStart + 0.01, w, h))
      expect(Math.abs((left ?? 0) + (w - (right ?? 0) - (left ?? 0)) / 2 - w / 2)).toBeLessThan(w * 0.01 + 1)
    }
  })
})
