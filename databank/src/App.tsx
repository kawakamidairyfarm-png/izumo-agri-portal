import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { trackView } from './lib/analytics'
import Layout from './components/Layout'
import Home from './pages/Home'
import Archive from './pages/Archive'
import Browse from './pages/Browse'
import EpisodePage from './pages/Episode'
import { PathsIndex, PathDetail } from './pages/Paths'
import { TopicsIndex, FlowDetail } from './pages/Topics'
import TopicPage from './pages/Topic'
import { ForStudents, ForConsumers } from './pages/Entrances'
import About from './pages/About'
import Expert from './pages/Expert'
import Questions from './pages/Questions'
import Terms from './pages/Terms'

/** ページが変わったら先頭に戻し、計測にも知らせる */
function OnRouteChange() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
    trackView()
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <OnRouteChange />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="archive" element={<Archive />} />
          <Route path="questions" element={<Questions />} />
          <Route path="terms" element={<Terms />} />
          <Route path="e/:id" element={<EpisodePage />} />
          <Route path="topics" element={<TopicsIndex />} />
          <Route path="t/:key" element={<TopicPage />} />
          <Route path="flow/:key" element={<FlowDetail />} />
          <Route path="paths" element={<PathsIndex />} />
          <Route path="paths/:key" element={<PathDetail />} />
          <Route path="for-students" element={<ForStudents />} />
          <Route path="for-consumers" element={<ForConsumers />} />
          <Route path="about" element={<About />} />
          <Route path="expert" element={<Expert />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  )
}
