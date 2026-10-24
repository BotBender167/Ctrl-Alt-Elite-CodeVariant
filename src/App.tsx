import { AnimatePresence } from 'motion/react'
import { lazy, Suspense } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Page } from './components/Page'
import { useTitle } from './hooks/useTitle'
import Camps from './pages/Camps'
import Home from './pages/Home'
import { World } from './world/World'

// The project and archive screens are heavier and are not needed for the first paint.
const Project = lazy(() => import('./pages/Project'))
const Archive = lazy(() => import('./pages/Archive'))

function NotFound() {
  useTitle('Lost in the woods')
  return (
    <Page className="relative z-10 mx-auto max-w-xl px-5 pt-40 text-center">
      <h1 className="text-[96px]">Lost in the woods</h1>
      <p className="mt-4 text-mist">That page does not exist.</p>
      <Link to="/" className="btn mt-6">
        Back to the start
      </Link>
    </Page>
  )
}

export default function App() {
  const location = useLocation()
  const hero = location.pathname === '/'

  return (
    <div className="relative min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-cream px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <World mode={hero ? 'hero' : 'app'} />
      <Nav />
      <AnimatePresence mode="wait">
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/u/:user" element={<Camps />} />
            <Route path="/u/:user/:repo" element={<Project />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  )
}
