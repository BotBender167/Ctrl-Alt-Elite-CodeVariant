import { PushPin } from '@phosphor-icons/react'
import { useState } from 'react'
import { DropZone } from '../dnd/DropZone'
import { CARD } from '../dnd/types'
import { HUB } from './layout'

function Avatar({ user }: { user: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="hub-initial">{user.slice(0, 2).toUpperCase()}</span>
  return (
    <img
      className="h-full w-full rounded-full object-cover"
      src={`https://github.com/${encodeURIComponent(user)}.png?size=240`}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

interface Props {
  user: string
  // Without onDrop the hub is simply your profile. With it, the hub is the place to drop your ID card.
  onDrop?: (payload: unknown) => boolean | void
  filled: boolean
  count?: number
}

// You, in the middle of the board. Every project hangs off this circle by a string.
export function Hub({ user, onDrop, filled, count }: Props) {
  const place = { left: `${HUB.x}%`, top: `${HUB.y}%` }
  if (!filled && onDrop) {
    return (
      <div className="hub-pos" style={place}>
        <DropZone
          id="hub"
          accepts={[CARD.id]}
          label="Your profile. Drop your ID card here to scan your projects."
          onDrop={onDrop}
          bare
          className="hub"
        >
          <span className="hub-ask">
            Drop your
            <br />
            ID card here
          </span>
        </DropZone>
      </div>
    )
  }
  return (
    <div className="hub-pos" style={place}>
      <div className="hub on" role="img" aria-label={`Your profile, @${user}`}>
        <Avatar user={user} />
        <PushPin weight="fill" className="hub-pin" aria-hidden="true" />
        <span className="hub-plate">
          @{user}
          {count !== undefined && `, ${count} projects`}
        </span>
      </div>
    </div>
  )
}
