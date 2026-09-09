import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import EpisodePage from './pages/Episode'
import { PathsIndex, PathDetail } from './pages/Paths'
import { ForStudents, ForConsumers } from './pages/Entrances'
import About from './pages/About'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="e/:id" element={<EpisodePage />} />
          <Route path="paths" element={<PathsIndex />} />
          <Route path="paths/:key" element={<PathDetail />} />
          <Route path="for-students" element={<ForStudents />} />
          <Route path="for-consumers" element={<ForConsumers />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  )
}
