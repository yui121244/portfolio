import { useCallback, useEffect, useState } from 'react'
import AboutSection from './components/about/AboutSection'
import ContactSection from './components/contact/ContactSection'
import ExperienceSection from './components/experience/ExperienceSection'
import GlobalChrome from './components/global/GlobalChrome'
import GlobalVisualStage from './components/global/GlobalVisualStage'
import Hero from './components/hero/Hero'
import LoadingSequence from './components/hero/LoadingSequence'
import ProjectsSection from './components/projects/ProjectsSection'
import ProjectDetailPage from './components/projects/ProjectDetailPage'
import { getProject } from './data/projects'
import { installPointerBus } from './lib/pointerBus'
import { useEntranceTimeline } from './lib/entranceTimeline'
import { useScrollNarrative } from './lib/scrollNarrative'
import { sitePath } from './lib/sitePaths'

function HomePage() {
  const [sceneReady, setSceneReady] = useState(false)
  const activateScene = useCallback(() => setSceneReady(true), [])
  const entrance = useEntranceTimeline(sceneReady)
  const {
    shellRef,
    backgroundProgressRef,
    contactMotionRef,
    heroExitProgressRef,
  } = useScrollNarrative()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return undefined

    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector(hash)
      if (!target) return
      const targetTop = target.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: targetTop, behavior: 'auto' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="site-shell" ref={shellRef} data-phase={entrance.phase}>
      <GlobalVisualStage phase={entrance.phase} scrollProgressRef={backgroundProgressRef} />
      <GlobalChrome phase={entrance.phase} />
      <main className="site-content">
        <Hero
          elapsedMs={entrance.elapsedMs}
          phase={entrance.phase}
          timelineRef={entrance.elapsedRef}
          heroExitProgressRef={heroExitProgressRef}
          onSceneReady={activateScene}
        />
        <AboutSection />
        <ProjectsSection />
        <ExperienceSection />
        <ContactSection motionRef={contactMotionRef} />
      </main>
      <LoadingSequence
        exiting={entrance.loaderExiting}
        progress={entrance.loadingProgress}
        visible={entrance.loaderVisible}
      />
    </div>
  )
}

function getProjectFromPath(pathname) {
  const match = sitePath(pathname).match(/^\/projects\/(\d+)\/?$/)
  return match ? getProject(match[1]) : null
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => installPointerBus(), [])
  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const project = getProjectFromPath(pathname)
  return project ? <ProjectDetailPage project={project} /> : <HomePage />
}
