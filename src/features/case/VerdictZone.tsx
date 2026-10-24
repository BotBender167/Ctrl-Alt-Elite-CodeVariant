import { Stamp } from '@phosphor-icons/react'
import { ROAD_LABEL, ROADS } from '../../config/rules'
import type { Road } from '../../config/rules'
import { fmtDate } from '../../lib/format'
import type { ArchiveEntry } from '../../store'
import { DropZone } from '../dnd/DropZone'
import { CARD } from '../dnd/types'

interface Props {
  saved: ArchiveEntry | undefined
  justSaved: boolean
  onSave: (road: Road) => void
}

const isRoad = (v: unknown): v is Road => typeof v === 'string' && (ROADS as readonly string[]).includes(v)

// The verdict stamp. Dropping a road here is what saves your verdict, so there is no Save button to press:
// the road you choose and the act of committing to it are the same gesture.
export function VerdictZone({ saved, justSaved, onSave }: Props) {
  return (
    <DropZone
      id="verdict"
      accepts={[CARD.road]}
      label="Verdict stamp. Drop the road you choose here to save your verdict."
      className="on-paper flex w-full items-center gap-3 px-4 py-3"
      onDrop={(payload) => {
        if (!isRoad(payload)) return false
        onSave(payload)
      }}
    >
      <Stamp size={30} weight="duotone" className="flex-none text-string" aria-hidden="true" />
      <span className="min-w-0 flex-1" aria-live="polite">
        {saved ? (
          <>
            <span className="block font-display text-lg leading-tight">
              {justSaved ? 'Saved. ' : ''}Verdict: {ROAD_LABEL[saved.road]}
            </span>
            <span className="block text-sm text-ink-soft">Saved on {fmtDate(saved.savedAt)}. Drop another road here to change it.</span>
          </>
        ) : (
          <>
            <span className="block font-display text-lg leading-tight">Your verdict</span>
            <span className="block text-sm text-ink-soft">Drag the road you choose onto this stamp to save it.</span>
          </>
        )}
      </span>
    </DropZone>
  )
}
