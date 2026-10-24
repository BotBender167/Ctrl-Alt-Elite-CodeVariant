import { create } from 'zustand'
import { announce } from '../features/dnd/engine'

export const TOAST_MS = 6000

interface ToastState {
  id: number
  message: string | null
  undo: (() => void) | null
  show: (message: string, undo?: () => void) => void
  clear: () => void
}

export const useToast = create<ToastState>()((set) => ({
  id: 0,
  message: null,
  undo: null,
  show: (message, undo) => set((s) => ({ id: s.id + 1, message, undo: undo ?? null })),
  clear: () => set({ message: null, undo: null }),
}))

// A short confirmation after something you dropped. Undo is a safety net, not the way to act, so it is the
// only button here: the action itself always happens by dragging.
export function toast(message: string, undo?: () => void): void {
  useToast.getState().show(message, undo)
  announce(message)
}

