import { DOOR_TRACK, VIDEO_FRAMES } from './doorTrack'

// The scroll-driven opening. Scrolling walks you toward the house; nothing plays by itself.
// Progress runs 0 to 1 down the scroll runway. The video (the walk, the door swinging open, the push into the
// doorway) is scrubbed first. Through all of that, the room is shown inside the doorway, as measured from the
// footage. The rest of the runway widens the doorway until the room fills the screen.

const VIDEO_END = 0.8
const FIRST_DOOR_FRAME = DOOR_TRACK[0]?.frame ?? VIDEO_FRAMES

export const INTRO = {
  // How tall the scroll runway is, in viewport heights. Longer means a slower, smoother walk.
  trackVh: 640,
  // The video is fully scrubbed by here.
  videoEnd: VIDEO_END,
  // The door begins to open on this frame, and the room fills the screen by doorEnd.
  doorStart: (FIRST_DOOR_FRAME / (VIDEO_FRAMES - 1)) * VIDEO_END,
  doorEnd: 0.95,
  // The card and the profile circle become usable once the room is fully in view.
  readyAt: 0.96,
} as const

export const VIDEO_ASPECT = 16 / 9

type Rect = readonly [number, number, number, number]
const FULL: Rect = [0, 0, 1, 1]

const BASE = import.meta.env.BASE_URL

// 1440p for large or high-density screens on a normal connection, Full HD otherwise.
export function introSource(): string {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  const pixels = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1)
  const big = pixels >= 2300 && !nav.connection?.saveData
  return `${BASE}${big ? 'intro-1440.mp4' : 'intro-1080.mp4'}`
}

export const INTRO_POSTER = `${BASE}intro-poster.jpg`

export const ROOM_SRC = `${BASE}room-2560.jpg`
export const ROOM_SRCSET = `${BASE}room-2560.jpg 2560w, ${BASE}room-3840.jpg 3840w`

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const lerpRect = (a: Rect, b: Rect, t: number): Rect => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]

// Which moment of the video this scroll position shows, as a (fractional) frame number.
export function videoFrame(progress: number): number {
  return clamp01(progress / INTRO.videoEnd) * (VIDEO_FRAMES - 1)
}

// The door swings from the first crack to wide open between these two frames of the footage.
const SWING_LAST_FRAME = 148

// How many frames past the one on screen your scroll position must travel before the picture changes. Without it, a
// slow or wobbling hand makes the picture flip between two frames; with it, the picture holds still until you mean it.
export const HOLD_FRAMES = 0.62

// Which frame to show: keep the current one while the scroll position is within HOLD_FRAMES of it, otherwise jump to
// the nearest. `settled` snaps to the nearest frame unconditionally (used once the scroll has stopped).
export function frameToShow(shown: number, position: number, settled = false): number {
  const last = VIDEO_FRAMES - 1
  const nearest = Math.min(last, Math.max(0, Math.round(position)))
  if (settled || shown < 0 || Math.abs(position - shown) > HOLD_FRAMES) return nearest
  return shown
}

// The scroll position that goes with a frame on screen, so the doorway and the room are drawn for the same moment
// as the picture. Past the end of the footage there is no frame to match, so the real position is used.
export function progressOfFrame(frame: number, progress: number): number {
  return progress >= INTRO.videoEnd ? progress : (frame / (VIDEO_FRAMES - 1)) * INTRO.videoEnd
}

// How far the door itself has swung, 0 (shut) to 1 (wide open). The creak follows how fast this changes.
export function doorSwing(progress: number): number {
  return clamp01((videoFrame(progress) - FIRST_DOOR_FRAME) / (SWING_LAST_FRAME - FIRST_DOOR_FRAME))
}

// How far the door has opened, 0 (shut) to 1 (the room fills the screen). Drives the light, the zoom and the sound.
export function doorOpen(progress: number): number {
  return easeInOut(clamp01((progress - INTRO.doorStart) / (INTRO.doorEnd - INTRO.doorStart)))
}

// The doorway on a (fractional) frame, or null while the door is still shut.
function doorwayAt(frame: number): Rect | null {
  const first = DOOR_TRACK[0]
  const last = DOOR_TRACK[DOOR_TRACK.length - 1]
  if (!first || !last || frame < first.frame) return null
  if (frame >= last.frame) return last.rect
  for (let i = 1; i < DOOR_TRACK.length; i++) {
    const a = DOOR_TRACK[i - 1]
    const b = DOOR_TRACK[i]
    if (a && b && frame <= b.frame) return lerpRect(a.rect, b.rect, (frame - a.frame) / Math.max(1, b.frame - a.frame))
  }
  return last.rect
}

// The video is drawn with object-fit: cover, so its frame can overflow the window.
function toPixels(rect: Rect, vw: number, vh: number): Rect {
  const scale = Math.max(vw / VIDEO_ASPECT, vh)
  const w = scale * VIDEO_ASPECT
  const h = scale
  const ox = (vw - w) / 2
  const oy = (vh - h) / 2
  return [ox + rect[0] * w, oy + rect[1] * h, ox + rect[2] * w, oy + rect[3] * h]
}

const HIDDEN = 'inset(50% 50% 50% 50%)'

// clip-path for the room layer: the room is visible only through the doorway, which follows the real door in
// the footage as it swings open, then widens to the whole screen.
export function doorClip(progress: number, vw: number, vh: number): string {
  const lastRect = DOOR_TRACK[DOOR_TRACK.length - 1]?.rect ?? FULL
  let rect: Rect
  if (progress <= INTRO.videoEnd) {
    const found = doorwayAt(videoFrame(progress))
    if (!found) return HIDDEN
    rect = toPixels(found, vw, vh)
  } else {
    const t = easeInOut(clamp01((progress - INTRO.videoEnd) / (INTRO.doorEnd - INTRO.videoEnd)))
    rect = lerpRect(toPixels(lastRect, vw, vh), [0, 0, vw, vh], t)
  }
  const top = Math.max(0, rect[1])
  const left = Math.max(0, rect[0])
  const right = Math.max(0, vw - rect[2])
  const bottom = Math.max(0, vh - rect[3])
  return `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px)`
}
