// The scroll-driven opening. Scrolling walks you toward the house; nothing plays by itself.
export const INTRO = {
  // How tall the scroll runway is, in viewport heights. Longer means a slower, smoother walk.
  trackVh: 460,
  // The video is fully scrubbed by this point (0 to 1 of the runway); the rest is the crossfade into the room.
  videoEnd: 0.84,
  fadeFrom: 0.86,
  // The card and the profile circle become usable once the room is fully in view.
  readyAt: 0.95,
} as const

const BASE = import.meta.env.BASE_URL

// 4K for large or high-density screens on a normal connection, Full HD otherwise.
export function introSource(): string {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  const pixels = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1)
  const big = pixels >= 2400 && !nav.connection?.saveData
  return `${BASE}${big ? 'intro-2160.mp4' : 'intro-1080.mp4'}`
}

export const INTRO_POSTER = `${BASE}intro-poster.jpg`
