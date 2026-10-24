import { describe, expect, it } from 'vitest'
import { planFrames } from './frames'
import type { Held } from './frames'

const LAST = 175

// Run scroll positions (fractional frames) through the planner, keeping track of what each video holds.
// While a video is loading a frame it still shows its old one, so what matters is how much of the picture it is:
// the video underneath shows (1 - t) of the picture, the one on top shows t, where t is how far between frames you are.
function worstSeek(positions: number[]): number {
  let held: [number, number] = [-1, -1]
  let worst = 0
  for (const f of positions) {
    const frame = Math.min(LAST, Math.floor(f))
    const next = Math.min(LAST, frame + 1)
    const t = frame === next ? 0 : f - frame
    const plan = planFrames(held as Held, frame, next)
    for (const [slot, to] of plan.seeks) {
      if (held[slot] !== -1) worst = Math.max(worst, slot === plan.under ? 1 - t : t)
      held = slot === 0 ? [to, held[1]] : [held[0], to]
    }
  }
  return worst
}

const range = (from: number, to: number, step: number): number[] => {
  const out: number[] = []
  const dir = to >= from ? 1 : -1
  for (let f = from; dir * (to - f) >= -1e-9; f += dir * step) out.push(+f.toFixed(4))
  return out
}

describe('planFrames', () => {
  it('loads both videos on the first frame', () => {
    const plan = planFrames([-1, -1], 10, 11)
    expect(plan.seeks).toEqual([[0, 10], [1, 11]])
    expect(plan.under).toBe(0)
    expect(plan.over).toBe(1)
  })

  it('does nothing while you stay between the same two frames', () => {
    expect(planFrames([10, 11], 10, 11).seeks).toEqual([])
  })

  it('swaps the videos when you cross a frame and only sends the hidden one ahead', () => {
    const plan = planFrames([10, 11], 11, 12)
    expect(plan.under).toBe(1)
    expect(plan.over).toBe(0)
    expect(plan.seeks).toEqual([[0, 12]])
  })

  it('never lets a video that is mostly visible seek, scrolling forward', () => {
    expect(worstSeek(range(0, 160, 0.05))).toBeLessThanOrEqual(0.06)
  })

  it('never lets a video that is mostly visible seek, scrolling back', () => {
    expect(worstSeek([...range(0, 160, 0.05), ...range(160, 0, 0.05)])).toBeLessThanOrEqual(0.06)
  })

  it('stays steady when the position wobbles back and forth across a frame, as a settling spring does', () => {
    const wobble = [20.97, 21.02, 20.98, 21.03, 21.01, 20.99, 21.04, 21.02, 21.0, 20.96, 21.05, 21.5, 21.97, 22.02, 21.99]
    expect(worstSeek([...range(0, 20.9, 0.05), ...wobble])).toBeLessThanOrEqual(0.06)
  })

  it('handles the last frame, where there is no next frame', () => {
    const plan = planFrames([174, 175], 175, 175)
    expect(plan.under).toBe(1)
    expect(plan.seeks).toEqual([])
  })

  it('always uses two different videos', () => {
    for (const held of [[-1, -1], [5, 6], [6, 5], [9, 3]] as Held[]) {
      for (const f of [4, 5, 6, 7]) {
        const plan = planFrames(held, f, f + 1)
        expect(plan.under).not.toBe(plan.over)
      }
    }
  })
})
