import { create } from 'zustand'

// The Canvas Protocol engine. Every primary action in the app is "drop a card on a zone", and this file is
// the one place that knows how: pointer dragging, a keyboard route to the same result, and what to announce.

export interface ZoneReg {
  id: string
  el: HTMLElement
  accepts: readonly string[]
  label: string
  // Return false to refuse the drop (the card snaps back).
  onDrop: (payload: unknown, type: string) => boolean | void
}

export interface DragSpec {
  type: string
  payload: unknown
  // Short name used in announcements, e.g. the repository name.
  label: string
}

interface DndState {
  armed: string | null
  hot: string | null
  message: string
}

export const useDnd = create<DndState>()(() => ({ armed: null, hot: null, message: '' }))

const DRAG_THRESHOLD = 6
const FLY_MS = 220
const SNAP_MS = 240
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

const zones = new Map<string, ZoneReg>()

export function registerZone(zone: ZoneReg): () => void {
  zones.set(zone.id, zone)
  return () => {
    if (zones.get(zone.id) === zone) zones.delete(zone.id)
  }
}

let beat = false
export function announce(message: string): void {
  beat = !beat
  useDnd.setState({ message: beat ? message : `${message}​` })
}

const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function acceptingZones(type: string): ZoneReg[] {
  return [...zones.values()]
    .filter((z) => z.accepts.includes(type) && z.el.isConnected && z.el.getClientRects().length > 0)
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
}

function zoneAt(x: number, y: number, type: string): ZoneReg | undefined {
  for (const el of document.elementsFromPoint(x, y)) {
    const holder = el.closest<HTMLElement>('[data-zone]')
    const zone = holder ? zones.get(holder.dataset.zone ?? '') : undefined
    if (zone?.accepts.includes(type)) return zone
  }
  return undefined
}

function arm(type: string): void {
  useDnd.setState({ armed: type, hot: null })
}
function disarm(): void {
  useDnd.setState({ armed: null, hot: null })
}
function setHot(zone: ZoneReg | undefined): void {
  const id = zone?.id ?? null
  if (useDnd.getState().hot !== id) useDnd.setState({ hot: id })
}

// A drag must not also count as a click on whatever is under the pointer when it ends.
function swallowNextClick(): void {
  const stop = (e: Event): void => {
    e.stopPropagation()
    e.preventDefault()
  }
  window.addEventListener('click', stop, { capture: true, once: true })
  window.setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0)
}

function liftTarget(node: HTMLElement): HTMLElement {
  return node.closest<HTMLElement>('[data-drag-item]') ?? node
}

/* ---------------- pointer ---------------- */

let pointerBusy = false

export function startPointerDrag(node: HTMLElement, event: PointerEvent | React.PointerEvent, spec: DragSpec): void {
  if (held || pointerBusy) return
  const item = liftTarget(node)
  const rect = item.getBoundingClientRect()
  const startX = event.clientX
  const startY = event.clientY
  let ghost: HTMLElement | null = null
  pointerBusy = true
  // Links and images start the browser's own drag, which would cancel ours.
  const noNativeDrag = (e: Event): void => e.preventDefault()
  window.addEventListener('dragstart', noNativeDrag)

  const offset = (x: number, y: number): string => `calc(-50% + ${x - startX}px) calc(-50% + ${y - startY}px)`

  const move = (ev: PointerEvent): void => {
    if (!ghost) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return
      ghost = makeGhost(item, rect)
      item.dataset.lifted = 'true'
      arm(spec.type)
      announce(`Dragging ${spec.label}.`)
    }
    ghost.style.translate = offset(ev.clientX, ev.clientY)
    setHot(zoneAt(ev.clientX, ev.clientY, spec.type))
  }

  const finish = (ev: PointerEvent): void => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', finish)
    window.removeEventListener('dragstart', noNativeDrag)
    pointerBusy = false
    if (!ghost) return
    swallowNextClick()
    const flying = ghost
    const cleanup = (): void => {
      flying.remove()
      delete item.dataset.lifted
      disarm()
    }
    const zone = ev.type === 'pointerup' ? zoneAt(ev.clientX, ev.clientY, spec.type) : undefined
    if (zone && zone.onDrop(spec.payload, spec.type) !== false) {
      flyInto(flying, zone.el, rect, startX, startY, ev, cleanup)
      announce(`${spec.label} dropped on ${zone.label}.`)
    } else {
      snapBack(flying, cleanup)
      if (zone) announce(`${zone.label} did not accept ${spec.label}.`)
    }
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', finish)
  window.addEventListener('pointercancel', finish)
}

function makeGhost(item: HTMLElement, rect: DOMRect): HTMLElement {
  const ghost = item.cloneNode(true) as HTMLElement
  ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
  ghost.removeAttribute('id')
  ghost.setAttribute('aria-hidden', 'true')
  ghost.setAttribute('inert', '')
  ghost.classList.add('dnd-ghost')
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top + rect.height / 2}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    translate: '-50% -50%',
  })
  document.body.append(ghost)
  return ghost
}

function flyInto(
  ghost: HTMLElement,
  target: HTMLElement,
  from: DOMRect,
  startX: number,
  startY: number,
  ev: PointerEvent,
  done: () => void,
): void {
  const zr = target.getBoundingClientRect()
  const to = `calc(-50% + ${zr.left + zr.width / 2 - (from.left + from.width / 2)}px) calc(-50% + ${zr.top + zr.height / 2 - (from.top + from.height / 2)}px)`
  const here = `calc(-50% + ${ev.clientX - startX}px) calc(-50% + ${ev.clientY - startY}px)`
  const anim = ghost.animate(
    [
      { translate: here, opacity: 1, scale: 1 },
      { translate: to, opacity: 0, scale: 0.35 },
    ],
    { duration: reduced() ? 1 : FLY_MS, easing: EASE, fill: 'forwards' },
  )
  anim.onfinish = done
}

function snapBack(ghost: HTMLElement, done: () => void): void {
  const anim = ghost.animate([{ translate: ghost.style.translate }, { translate: '-50% -50%' }], {
    duration: reduced() ? 1 : SNAP_MS,
    easing: EASE,
  })
  anim.onfinish = done
}

/* ---------------- keyboard ---------------- */

interface Held {
  node: HTMLElement
  spec: DragSpec
  zones: ZoneReg[]
  index: number
}
let held: Held | null = null

export function pickUp(node: HTMLElement, spec: DragSpec): void {
  const targets = acceptingZones(spec.type)
  if (targets.length === 0) return
  held = { node: liftTarget(node), spec, zones: targets, index: -1 }
  held.node.dataset.lifted = 'true'
  arm(spec.type)
  announce(
    `Picked up ${spec.label}. Use the arrow keys to choose a zone: ${targets.map((z) => z.label).join(', ')}. Press Enter to drop, Escape to cancel.`,
  )
}

function release(): Held | null {
  const h = held
  if (h) delete h.node.dataset.lifted
  held = null
  disarm()
  return h
}

export function onGlobalKey(e: KeyboardEvent): void {
  if (!held) return
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    release()
    announce('Cancelled.')
    return
  }
  const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)
  const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)
  if (back || forward) {
    e.preventDefault()
    const n = held.zones.length
    held.index = (held.index + (back ? -1 : 1) + n) % n
    const zone = held.zones[held.index]
    setHot(zone)
    if (zone) announce(zone.label)
    return
  }
  if ((e.key === 'Enter' || e.key === ' ') && held.index >= 0) {
    e.preventDefault()
    e.stopPropagation()
    const h = release()
    const zone = h?.zones[h.index]
    if (!h || !zone) return
    if (zone.onDrop(h.spec.payload, h.spec.type) === false) announce(`${zone.label} did not accept ${h.spec.label}.`)
    else announce(`${h.spec.label} dropped on ${zone.label}.`)
    if (h.node.isConnected) h.node.focus({ preventScroll: true })
  }
}

export function isHolding(): boolean {
  return held !== null
}
