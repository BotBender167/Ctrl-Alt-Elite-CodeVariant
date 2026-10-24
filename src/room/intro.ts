// The scroll-driven opening. Scrolling walks you toward the house; nothing plays by itself.
// Progress runs 0 to 1 down the scroll runway: the video is scrubbed first, then the door opens onto the room.
export const INTRO = {
  // How tall the scroll runway is, in viewport heights. Longer means a slower, smoother walk.
  trackVh: 520,
  // The video is fully scrubbed by here.
  videoEnd: 0.72,
  // The door starts to open, and the room behind it fills the screen by doorEnd.
  doorStart: 0.72,
  doorEnd: 0.95,
  // The card and the profile circle become usable once the room is fully in view.
  readyAt: 0.96,
} as const

// Where the door sits in the last video frame, as fractions of the frame. The room is revealed through
// a slit this size, which widens until it is the whole screen.
export const DOOR = { x0: 0.489, x1: 0.511, y0: 0.4, y1: 0.745 } as const
export const VIDEO_ASPECT = 16 / 9

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

// How far the door has opened, 0 (shut) to 1 (the room fills the screen).
export function doorOpen(progress: number): number {
  return easeInOut(clamp01((progress - INTRO.doorStart) / (INTRO.doorEnd - INTRO.doorStart)))
}

// The door slit in viewport pixels. The video is drawn with object-fit: cover, so the frame can overflow.
function doorRect(vw: number, vh: number): { left: number; top: number; right: number; bottom: number } {
  const scale = Math.max(vw / VIDEO_ASPECT, vh)
  const w = scale * VIDEO_ASPECT
  const h = scale
  const ox = (vw - w) / 2
  const oy = (vh - h) / 2
  return { left: ox + DOOR.x0 * w, right: ox + DOOR.x1 * w, top: oy + DOOR.y0 * h, bottom: oy + DOOR.y1 * h }
}

// clip-path for the room layer: a thin lit slit where the door is, widening to the full viewport.
export function doorClip(open: number, vw: number, vh: number): string {
  const d = doorRect(vw, vh)
  const t = open
  const top = lerp(d.top, 0, t)
  const left = lerp(d.left, 0, t)
  const right = lerp(vw - d.right, 0, t)
  const bottom = lerp(vh - d.bottom, 0, t)
  const radius = lerp(2, 0, t)
  return `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px round ${radius.toFixed(1)}px)`
}
