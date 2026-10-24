// The lamp is failing. Two layers flicker out of step with each other so the light never settles into a
// loop: a warm wash that also lights the notes, and a faint shadow that drops across the whole room.
// Purpose: atmosphere with a job. It keeps the board feeling alive while you read it.
export function RoomLight() {
  return (
    <>
      <div className="light-wash" aria-hidden="true" />
      <div className="light-dim" aria-hidden="true" />
    </>
  )
}
