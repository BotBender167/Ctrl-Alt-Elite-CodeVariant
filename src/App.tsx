import { AnimatePresence } from 'motion/react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Page } from './components/Page'
import Archive from './pages/Archive'
import Camps from './pages/Camps'
import Home from './pages/Home'
import Project from './pages/Project'
import { World } from './world/World'

function NotFound() {
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
      <World mode={hero ? 'hero' : 'app'} />
      <Nav />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/u/:user" element={<Camps />} />
          <Route path="/u/:user/:repo" element={<Project />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
