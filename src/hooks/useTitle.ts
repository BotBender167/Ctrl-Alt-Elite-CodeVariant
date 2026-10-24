import { useEffect } from 'react'

const BASE = 'Unfinished Business'

export function useTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} - ${BASE}` : BASE
  }, [title])
}
