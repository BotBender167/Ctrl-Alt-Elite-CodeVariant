import type { ReactNode } from 'react'
import { DropZone } from '../features/dnd/DropZone'

interface Props {
  id: string
  accepts: readonly string[]
  title: string
  sub: string
  icon: ReactNode
  onDrop: (payload: unknown, type: string) => boolean | void
  count?: number
}

// A labelled place to drop a card. The label says what the zone does, because nothing here is a button.
export function ActionZone({ id, accepts, title, sub, icon, onDrop, count }: Props) {
  return (
    <DropZone id={id} accepts={accepts} label={`${title} zone. ${sub}`} onDrop={onDrop} className="action-zone">
      <span className="zone-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 text-left">
        <span className="block font-semibold leading-tight">{title}</span>
        <span className="hidden text-[13px] leading-tight text-mist sm:block">{sub}</span>
      </span>
      {count !== undefined && count > 0 && <span className="zone-count">{count}</span>}
    </DropZone>
  )
}

// The row of zones along the bottom of a screen. Anything passed as `above` sits directly over the row, in the
// same column, so a bar above the zones can never run into them whatever size they are.
export function ZoneTray({ children, above }: { children: ReactNode; above?: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex flex-col items-center gap-4 px-3">
      {above}
      <div className="pointer-events-auto grid w-full max-w-3xl grid-flow-col auto-cols-fr gap-2 sm:gap-3">{children}</div>
    </div>
  )
}
