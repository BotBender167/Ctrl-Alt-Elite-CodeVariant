import { STATUS_LABEL } from '../config/rules'
import type { Status } from '../config/rules'

// A rubber stamp on paper. The word is always printed, so status never depends on colour alone.
export function Stamp({ status }: { status: Status }) {
  return <span className={`stamp ${status}`}>{STATUS_LABEL[status]}</span>
}
