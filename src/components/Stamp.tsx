import { STATUS_LABEL } from '../config/rules'
import type { Status } from '../config/rules'

export function StatusChip({ status }: { status: Status }) {
  return <span className={`chip ${status}`}>{STATUS_LABEL[status]}</span>
}
