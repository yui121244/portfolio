import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { createScrollSceneController } from './scrollSceneSystem'
import { registerPageScroller } from './scrollCommands'

const TRANSITION_START = 0.32
const TRANSITION_END = 0.78
const HERO_EXIT_START = 0.04
const HERO_EXIT_END = 0.9

function smoothStep(value) {
  const progress = Math.min(Math.max(value, 0), 1)
  return progress * progress * (3 - 2 * progress)
}

export function useScrollNarrative() {
  const shellRef = useRef(null)
  const backgroundProgressRef = useRef(0)
  const contactMotionRef = useRef({ entry: 0, progress: 0 })
  const heroExitProgressRef = useRef(0)

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true })
    const scrollScenes = createScrollSceneController()

    const update = ({ scroll = window.scrollY } = {}, immediateScene = false) => {
      const viewportHeight = Math.max(window.innerHeight, 1)
      const heroProgress = scroll / viewportHeight
      const transitionProgress = smoothStep(
        (heroProgress - TRANSITION_START) / (TRANSITION_END - TRANSITION_START),
      )
      const heroExitProgress = smoothStep(
        (heroProgress - HERO_EXIT_START) / (HERO_EXIT_END - HERO_EXIT_START),
      )
      const contact = document.getElementById('contact')
      const contactBounds = contact?.getBoundingClientRect()
      const contactEntry = contactBounds
        ? smoothStep((viewportHeight * 1.2 - contactBounds.top) / (viewportHeight * 0.8))
        : 0
      const contactProgress = contactBounds
        ? Math.min(Math.max(-contactBounds.top / Math.max(contactBounds.height - viewportHeight, 1), 0), 1)
        : 0
      const backgroundProgress = transitionProgress * (1 - contactEntry)
      contactMotionRef.current.entry = contactEntry
      contactMotionRef.current.progress = contactProgress
      backgroundProgressRef.current = backgroundProgress
      heroExitProgressRef.current = heroExitProgress
      shellRef.current?.style.setProperty('--scroll-background-progress', backgroundProgress.toFixed(4))
      shellRef.current?.style.setProperty('--contact-entry-progress', contactEntry.toFixed(4))
      shellRef.current?.style.setProperty('--hero-exit-progress', heroExitProgress.toFixed(4))
      scrollScenes.update(viewportHeight, immediateScene)
    }

    const handleResize = () => update({ scroll: window.scrollY }, true)
    const unregisterPageScroller = registerPageScroller((top, options = {}) => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      lenis.scrollTo(top, {
        duration: reducedMotion ? 0 : 0.82,
        force: true,
        immediate: reducedMotion,
        easing: (progress) => 1 - Math.pow(1 - progress, 4),
        onComplete: () => {
          scrollScenes.update(window.innerHeight, true)
          options.onComplete?.()
        },
      })
    })

    lenis.on('scroll', update)
    window.addEventListener('resize', handleResize, { passive: true })
    update({}, true)

    return () => {
      lenis.off('scroll', update)
      window.removeEventListener('resize', handleResize)
      unregisterPageScroller()
      scrollScenes.destroy()
      lenis.destroy()
    }
  }, [])

  return { shellRef, backgroundProgressRef, contactMotionRef, heroExitProgressRef }
}
