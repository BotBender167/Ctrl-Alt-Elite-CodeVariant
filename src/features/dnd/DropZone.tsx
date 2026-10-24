import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { onGlobalKey, registerZone, useDnd } from './engine'

interface Props {
  id: string
  accepts: readonly string[]
  // Spoken name, e.g. "Examine zone. Opens the case file."
  label: string
  onDrop: (payload: unknown, type: string) => boolean | void
  className?: string
  // Skip the default dark zone styling (the caller draws the whole thing).
  bare?: boolean
  children: ReactNode
}

// A place to drop a card. It lights up while a card it accepts is held, and grows when the card is over it.
export function DropZone({ id, accepts, label, onDrop, className = '', bare = false, children }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const latest = useRef(onDrop)
  const armed = useDnd((s) => s.armed)
  const hot = useDnd((s) => s.hot)
  const ok = armed !== null && accepts.includes(armed)
  const key = accepts.join('|')

  useEffect(() => {
    latest.current = onDrop
  })

  useEffect(() => {
    const node = el.current
    if (!node) return
    return registerZone({ id, el: node, accepts: key.split('|'), label, onDrop: (p, t) => latest.current(p, t) })
  }, [id, key, label])

  return (
    <div
      ref={el}
      data-zone={id}
      data-ok={ok ? '' : undefined}
      data-dim={armed !== null && !ok ? '' : undefined}
      data-hot={hot === id ? '' : undefined}
      role="group"
      aria-label={label}
      className={bare ? className : `zone ${className}`}
    >
      {children}
    </div>
  )
}

// Screen-reader announcements for everything the engine does, plus the Escape and arrow-key handling.
export function DndLive() {
  const message = useDnd((s) => s.message)
  useEffect(() => {
    window.addEventListener('keydown', onGlobalKey, true)
    return () => window.removeEventListener('keydown', onGlobalKey, true)
  }, [])
  return (
    <div className="sr-only" aria-live="polite" role="status">
      {message}
    </div>
  )
}
