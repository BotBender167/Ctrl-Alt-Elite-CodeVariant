// Two videos show the scroll walk: one sits on the frame you are at, the other on the next frame and fades in
// as you move toward it. This decides which video does what, and which one (if any) must be sent to a new frame.
//
// The rule that keeps a paused scroll steady: the video the visitor is looking at is never the one that seeks.
// When you cross from one frame to the next, the video that was fading in simply becomes the one underneath,
// and only the other one (now hidden) is sent ahead.

export type Slot = 0 | 1
export type Held = readonly [number, number]

export interface FramePlan {
  // the video on the frame you are at, and the one on the next frame (on top, fading in)
  under: Slot
  over: Slot
  // frames to load, as [video, frame]; empty when both already hold what they need
  seeks: ReadonlyArray<readonly [Slot, number]>
}

const other = (slot: Slot): Slot => (slot === 0 ? 1 : 0)

export function planFrames(held: Held, frame: number, next: number): FramePlan {
  let under: Slot
  if (held[0] === frame) under = 0
  else if (held[1] === frame) under = 1
  else if (held[0] === next) under = 1 // video 0 already has the next frame, so it will be the top one
  else under = 0
  const over = other(under)
  const seeks: Array<readonly [Slot, number]> = []
  if (held[under] !== frame) seeks.push([under, frame])
  if (next !== frame && held[over] !== next) seeks.push([over, next])
  return { under, over, seeks }
}
