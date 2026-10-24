import { doorOpen, doorSwing, INTRO } from '../room/intro'
import { useSettings } from '../store'

// The soundscape. Browsers only allow sound after a click or key press, so it starts when the visitor turns
// it on (and stays on for next time). While you walk up to the house the original ambience gets louder and
// brighter and a low drone rises; the door cracks and its hinge creaks exactly as fast as you swing it (stop
// scrolling and it falls silent); inside the room it settles into the hum of a
// dying lamp that stutters in time with the light. Everything is kept quiet on purpose.

type Scene = 'walk' | 'room'

const BASE = import.meta.env.BASE_URL
const MASTER_LEVEL = 0.55
const FLICKER_SECONDS = 5.3
// The lamp's flicker curve, copied from the CSS keyframes so the hum and the light stutter together.
const FLICKER: ReadonlyArray<readonly [number, number]> = [
  [0, 0.9], [0.04, 0.45], [0.06, 1], [0.09, 0.6], [0.12, 0.95], [0.31, 0.85], [0.33, 0.3], [0.35, 0.9],
  [0.37, 0.5], [0.41, 1], [0.68, 0.8], [0.7, 0.55], [0.72, 0.95], [1, 0.9],
]

interface Graph {
  ctx: AudioContext
  master: GainNode
  bedGain: GainNode
  bedFilter: BiquadFilterNode
  droneGain: GainNode
  windGain: GainNode
  windFilter: BiquadFilterNode
  humGain: GainNode
  flickerGain: GainNode
  noise: AudioBuffer
  creakGain: GainNode
  creakOsc: OscillatorNode
  creakLow: BiquadFilterNode
  creakHigh: BiquadFilterNode
  raspGain: GainNode
}

let graph: Graph | null = null
let starting: Promise<void> | null = null
let scene: Scene = 'room'
let progress = 1
let wasInRoom = false
let cracked = false
let lastSwing = 0
let lastStamp = 0
let stick = 1
let stickAt = 0
let creakIdle = 0

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function build(ctx: AudioContext, ambience: AudioBuffer): Graph {
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  const noise = noiseBuffer(ctx, 2)

  const bedGain = ctx.createGain()
  const bedFilter = ctx.createBiquadFilter()
  bedFilter.type = 'lowpass'
  const bed = ctx.createBufferSource()
  bed.buffer = ambience
  bed.loop = true
  bed.connect(bedFilter).connect(bedGain).connect(master)
  bed.start()

  const droneGain = ctx.createGain()
  for (const [type, freq] of [['sine', 49], ['triangle', 98.6]] as const) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    o.connect(droneGain)
    o.start()
  }
  droneGain.connect(master)

  const windGain = ctx.createGain()
  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.Q.value = 0.8
  const wind = ctx.createBufferSource()
  wind.buffer = noise
  wind.loop = true
  wind.connect(windFilter).connect(windGain).connect(master)
  wind.start()

  const humGain = ctx.createGain()
  const flickerGain = ctx.createGain()
  for (const freq of [60, 120, 180]) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = freq === 60 ? 1 : freq === 120 ? 0.5 : 0.18
    o.connect(g).connect(humGain)
    o.start()
  }
  humGain.connect(flickerGain).connect(master)

  // The hinge: a buzzing wooden pulse through two resonances, plus a dry rasp of friction. Both stay silent
  // until the door is moving.
  const creakGain = ctx.createGain()
  const creakOsc = ctx.createOscillator()
  creakOsc.type = 'sawtooth'
  creakOsc.frequency.value = 60
  const creakLow = ctx.createBiquadFilter()
  creakLow.type = 'bandpass'
  creakLow.Q.value = 9
  const creakHigh = ctx.createBiquadFilter()
  creakHigh.type = 'bandpass'
  creakHigh.Q.value = 5
  creakOsc.connect(creakLow).connect(creakGain)
  creakOsc.connect(creakHigh).connect(creakGain)
  creakGain.connect(master)
  creakOsc.start()
  const raspGain = ctx.createGain()
  const rasp = ctx.createBufferSource()
  rasp.buffer = noise
  rasp.loop = true
  const raspFilter = ctx.createBiquadFilter()
  raspFilter.type = 'bandpass'
  raspFilter.frequency.value = 1900
  raspFilter.Q.value = 1.4
  rasp.connect(raspFilter).connect(raspGain).connect(master)
  rasp.start()

  return { ctx, master, bedGain, bedFilter, droneGain, windGain, windFilter, humGain, flickerGain, noise, creakGain, creakOsc, creakLow, creakHigh, raspGain }
}

function ramp(param: AudioParam, ctx: AudioContext, value: number, seconds = 0.18): void {
  param.setTargetAtTime(value, ctx.currentTime, seconds)
}

// Sets every layer from where you are in the story.
function apply(): void {
  if (!graph) return
  const { ctx } = graph
  if (scene === 'room') {
    ramp(graph.bedGain.gain, ctx, 0.04, 0.6)
    ramp(graph.bedFilter.frequency, ctx, 900, 0.6)
    ramp(graph.droneGain.gain, ctx, 0, 0.6)
    ramp(graph.windGain.gain, ctx, 0.008, 0.6)
    ramp(graph.humGain.gain, ctx, 0.05, 0.6)
    return
  }
  const t = clamp01(progress / INTRO.videoEnd)
  const open = doorOpen(progress)
  ramp(graph.bedGain.gain, ctx, (0.1 + 0.42 * Math.pow(t, 1.3)) * (1 - 0.6 * open))
  ramp(graph.bedFilter.frequency, ctx, 500 + 3300 * t)
  ramp(graph.droneGain.gain, ctx, (0.015 + 0.11 * t * t) * (1 - open))
  ramp(graph.windGain.gain, ctx, (0.012 + 0.05 * Math.sin(t * Math.PI)) * (1 - 0.5 * open))
  ramp(graph.windFilter.frequency, ctx, 300 + 900 * t)
  ramp(graph.humGain.gain, ctx, 0.05 * open)
}

function burst(seconds: number, from: number, to: number, level: number, q = 1): void {
  if (!graph) return
  const { ctx, master, noise } = graph
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + seconds)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(level, t + Math.min(0.02, seconds / 3))
  g.gain.exponentialRampToValueAtTime(0.0008, t + seconds)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + seconds + 0.05)
}

function thud(level: number, from = 130, to = 45, seconds = 0.2): void {
  if (!graph) return
  const { ctx, master } = graph
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(from, t)
  o.frequency.exponentialRampToValueAtTime(to, t + seconds)
  const g = ctx.createGain()
  g.gain.setValueAtTime(level, t)
  g.gain.exponentialRampToValueAtTime(0.0008, t + seconds)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + seconds + 0.05)
}

// The first give of old wood: a sharp crack, a dull knock, and a second smaller tick as the latch lets go.
function crack(): void {
  burst(0.09, 2800, 700, 0.14, 1.6)
  thud(0.14, 150, 55, 0.2)
  window.setTimeout(() => burst(0.04, 4200, 2600, 0.05, 2.4), 75)
}

function quietCreak(): void {
  if (!graph) return
  ramp(graph.creakGain.gain, graph.ctx, 0, 0.09)
  ramp(graph.raspGain.gain, graph.ctx, 0, 0.09)
}

// The hinge creaks exactly as fast as the door moves. Its pitch climbs as the door opens, and jitters a little
// as the wood sticks and lets go. A moment after you stop scrolling it goes quiet.
function creak(swing: number): void {
  if (!graph) return
  const now = performance.now()
  const dt = Math.max(16, now - lastStamp)
  const speed = Math.abs(swing - lastSwing) / (dt / 1000)
  lastSwing = swing
  lastStamp = now
  const moving = swing > 0.01 && swing < 0.995 && speed > 0.015
  if (swing > 0.03 && !cracked) {
    cracked = true
    crack()
  }
  if (swing < 0.008) cracked = false
  if (!moving) return
  if (now - stickAt > 90) {
    stick = 0.8 + Math.random() * 0.45
    stickAt = now
  }
  const level = Math.min(0.2, 0.05 + speed * 0.22)
  const { ctx } = graph
  ramp(graph.creakGain.gain, ctx, level, 0.05)
  ramp(graph.raspGain.gain, ctx, level * 0.55, 0.05)
  ramp(graph.creakOsc.frequency, ctx, (46 + 90 * swing) * stick, 0.04)
  ramp(graph.creakLow.frequency, ctx, (320 + 420 * swing) * stick, 0.05)
  ramp(graph.creakHigh.frequency, ctx, 880 + 720 * swing * stick, 0.05)
  window.clearTimeout(creakIdle)
  creakIdle = window.setTimeout(quietCreak, 110)
}

// Air rushing in as the room opens up.
function swell(): void {
  burst(1.6, 220, 1600, 0.09, 0.7)
}

function scheduleFlicker(): void {
  if (!graph) return
  const { ctx, flickerGain } = graph
  const points = 160
  const curve = new Float32Array(points)
  for (let i = 0; i < points; i++) {
    const x = i / (points - 1)
    let k = 1
    while (k < FLICKER.length - 1 && (FLICKER[k]?.[0] ?? 1) < x) k++
    const [x0, y0] = FLICKER[k - 1] ?? [0, 1]
    const [x1, y1] = FLICKER[k] ?? [1, 1]
    const u = x1 === x0 ? 0 : (x - x0) / (x1 - x0)
    curve[i] = 0.25 + 0.75 * (y0 + (y1 - y0) * u)
  }
  const now = ctx.currentTime
  flickerGain.gain.cancelScheduledValues(now)
  flickerGain.gain.setValueCurveAtTime(curve, now, FLICKER_SECONDS)
  // a tiny electrical crackle at each deep dip
  for (const at of [0.04, 0.33, 0.37]) window.setTimeout(() => burst(0.04, 3200, 2000, 0.02, 3), at * FLICKER_SECONDS * 1000)
}

async function start(): Promise<void> {
  if (graph) {
    await graph.ctx.resume()
    ramp(graph.master.gain, graph.ctx, MASTER_LEVEL, 0.4)
    return
  }
  const ctx = new AudioContext()
  const res = await fetch(`${BASE}ambience.wav`)
  const ambience = await ctx.decodeAudioData(await res.arrayBuffer())
  graph = build(ctx, ambience)
  await ctx.resume()
  apply()
  scheduleFlicker()
  window.setInterval(scheduleFlicker, FLICKER_SECONDS * 1000)
  ramp(graph.master.gain, ctx, MASTER_LEVEL, 0.6)
}

export function enableSound(): Promise<void> {
  starting ??= start().finally(() => {
    starting = null
  })
  return starting
}

export function disableSound(): void {
  if (!graph) return
  ramp(graph.master.gain, graph.ctx, 0, 0.1)
  const { ctx } = graph
  window.setTimeout(() => {
    if (!useSettings.getState().sound) void ctx.suspend()
  }, 400)
}

// Browsers keep the audio asleep until the first click or key press, so a saved "sound on" waits for one.
export function armSoundOnGesture(): () => void {
  if (!useSettings.getState().sound) return () => undefined
  const wake = (): void => {
    if (useSettings.getState().sound) void enableSound()
    off()
  }
  const events = ['pointerdown', 'keydown', 'touchend'] as const
  const off = (): void => events.forEach((e) => window.removeEventListener(e, wake))
  events.forEach((e) => window.addEventListener(e, wake, { once: true }))
  return off
}

export function setScene(next: Scene, p: number): void {
  scene = next
  progress = p
  if (scene === 'walk') {
    if (graph && useSettings.getState().sound) creak(doorSwing(p))
    const inRoom = p >= INTRO.doorEnd - 0.08
    if (inRoom && !wasInRoom && graph && useSettings.getState().sound) swell()
    if (p < INTRO.doorEnd - 0.12) wasInRoom = false
    else if (inRoom) wasInRoom = true
  } else {
    wasInRoom = true
    quietCreak()
  }
  apply()
}

function live(): boolean {
  return graph !== null && graph.ctx.state === 'running' && useSettings.getState().sound
}

// Small sounds for the cards.
export const sfx = {
  pickup: (): void => {
    if (live()) burst(0.1, 2600, 1700, 0.05, 1.2)
  },
  drop: (): void => {
    if (live()) {
      thud(0.16)
      burst(0.04, 2200, 1500, 0.03, 2)
    }
  },
  tear: (): void => {
    if (live()) {
      burst(0.5, 600, 3000, 0.12, 1.1)
      thud(0.06, 90, 50, 0.15)
    }
  },
  stamp: (): void => {
    if (live()) {
      thud(0.24, 95, 40, 0.26)
      burst(0.06, 1800, 900, 0.06, 2)
    }
  },
  refuse: (): void => {
    if (live()) thud(0.05, 230, 170, 0.1)
  },
}
