import { AnimatePresence } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Page } from './components/Page'
import { ToastHost } from './components/Toast'
import { DndLive } from './features/dnd/DropZone'
import { useTitle } from './hooks/useTitle'
import { armSoundOnGesture } from './lib/audio'
import Board from './pages/Board'
import Home from './pages/Home'
import { Room } from './room/Room'

const Archive = lazy(() => import('./pages/Archive'))

function NotFound() {
  useTitle('Lost in the woods')
  return (
    <Page className="relative z-10 mx-auto max-w-xl px-5 pt-40 text-center">
      <h1 className="text-5xl">Lost in the woods</h1>
      <p className="mt-4 text-mist">That page does not exist.</p>
      <Link to="/" className="btn mt-6">
        Back to the start
      </Link>
    </Page>
  )
}

// A project's case file opens on top of its board, so the board stays mounted while the project changes.
function routeKey(pathname: string): string {
  const parts = pathname.split('/')
  return parts[1] === 'u' ? `/u/${parts[2] ?? ''}` : pathname
}

export default function App() {
  const location = useLocation()
  const comingBack = Boolean((location.state as { skipIntro?: boolean } | null)?.skipIntro)
  const outside = location.pathname === '/' && !comingBack

  useEffect(() => armSoundOnGesture(), [])

  return (
    <div className="relative min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-cream px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Room mode={outside ? 'outside' : 'inside'} />
      <Nav />
      <DndLive />
      <ToastHost />
      <AnimatePresence mode="wait">
        <Suspense fallback={null}>
          <Routes location={location} key={routeKey(location.pathname)}>
            <Route path="/" element={<Home />} />
            <Route path="/u/:user/:repo?" element={<Board />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  )
}
