import type { KeyboardEvent, PointerEvent } from 'react'
import { isHolding, pickUp, startPointerDrag } from './engine'

interface Options<T> {
  type: string
  payload: T
  label: string
  // What a screen reader hears for the card itself. Defaults to the label.
  ariaLabel?: string
}

// Both ways to move a card. `pointer` goes on the element you drag, `keyboard` on the element that takes
// focus (often the same one). Enter or Space picks the card up, the arrow keys choose a zone, Enter drops it.
export function useDraggable<T>({ type, payload, label, ariaLabel }: Options<T>) {
  const spec = { type, payload, label }
  return {
    pointer: {
      onPointerDown: (e: PointerEvent<HTMLElement>): void => {
        if (e.button !== 0 || isHolding()) return
        const node = e.currentTarget
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, select, [data-nodrag]')) return
        // On a touch screen only a handle may start a drag, so the page can still scroll.
        if (e.pointerType === 'touch' && node.querySelector('[data-handle]') && !target.closest('[data-handle]')) return
        startPointerDrag(node, e, spec)
      },
    },
    keyboard: {
      tabIndex: 0,
      role: 'button',
      'aria-roledescription': 'draggable card',
      'aria-label': `${ariaLabel ?? label}. Press Enter to pick it up, then choose a zone.`,
      onKeyDown: (e: KeyboardEvent<HTMLElement>): void => {
        if (isHolding() || e.target !== e.currentTarget) return
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        pickUp(e.currentTarget, spec)
      },
    },
  }
}
