import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cause, Road, Status } from './config/rules'

export interface ArchiveEntry {
  key: string
  owner: string
  repo: string
  savedAt: string
  status: Status
  cause: Cause
  road: Road
  lifeDays: number | null
  burstShare: number | null
  daysSilent: number
  totalCommits: number | null
}

interface ArchiveState {
  entries: Record<string, ArchiveEntry>
  save: (entry: ArchiveEntry) => void
  remove: (key: string) => void
}

export const useArchive = create<ArchiveState>()(
  persist(
    (set) => ({
      entries: {},
      save: (entry) => set((s) => ({ entries: { ...s.entries, [entry.key]: entry } })),
      remove: (key) =>
        set((s) => ({
          entries: Object.fromEntries(Object.entries(s.entries).filter(([k]) => k !== key)),
        })),
    }),
    { name: 'ub:v1:archive' },
  ),
)

interface SettingsState {
  token: string | null
  lastUser: string | null
  setToken: (token: string | null) => void
  setLastUser: (user: string) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      token: null,
      lastUser: null,
      setToken: (token) => set({ token }),
      setLastUser: (lastUser) => set({ lastUser }),
    }),
    { name: 'ub:v1:settings' },
  ),
)

interface RateState {
  remaining: number | null
  limit: number | null
  resetAt: number | null
  set: (v: { remaining: number; limit: number; resetAt: number | null }) => void
}

export const useRate = create<RateState>()((set) => ({
  remaining: null,
  limit: null,
  resetAt: null,
  set: (v) => set(v),
}))
