import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { EASE_OUT } from '../lib/motion'
import { TOAST_MS, useToast } from '../lib/toast'

export function ToastHost() {
  const { id, message, undo, clear } = useToast()
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(clear, TOAST_MS)
    return () => window.clearTimeout(t)
  }, [id, message, clear])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-52 z-[60] flex justify-center px-3">
      <AnimatePresence>
        {message && (
          <motion.div
            key={id}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-cream px-5 py-2.5 text-[15px] text-ink shadow-[0_10px_30px_rgb(0_0_0/0.5)]"
            initial={{ opacity: 0, transform: 'translateY(12px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <span>{message}</span>
            {undo && (
              <button
                type="button"
                className="font-semibold text-string underline-offset-4 hover:underline"
                onClick={() => {
                  undo()
                  clear()
                }}
              >
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
