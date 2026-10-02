import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { ENTRANCE_PHASE } from '../../lib/entranceTimeline'
import { scrollToPagePosition } from '../../lib/scrollCommands'
import { useMobileLayout } from '../../lib/useMobileLayout'
import {
  formatCoordinate,
  getPointerServerSnapshot,
  getPointerSnapshot,
  subscribePointer,
} from '../../lib/pointerBus'

function CoordinateTelemetry() {
  const pointer = useSyncExternalStore(
    subscribePointer,
    getPointerSnapshot,
    getPointerServerSnapshot,
  )
  return <output>{formatCoordinate(pointer.x)} X {formatCoordinate(pointer.y)} Y</output>
}

function ClockTelemetry() {
  const outputRef = useRef(null)
  const temperature = useMemo(() => '31°C', [])

  useEffect(() => {
    const update = () => {
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date())
      if (outputRef.current) outputRef.current.textContent = `GMT+8 CN ${time} ${temperature}`
    }
    update()
    const interval = window.setInterval(update, 15_000)
    return () => window.clearInterval(interval)
  }, [temperature])

  return <output ref={outputRef}>GMT+8 CN 16:23 31°C</output>
}

function GlobalGrid() {
  return (
    <div className="measurement-grid" aria-hidden="true">
      {[0, 4, 8, 12].map((index) => (
        <span className="measurement-grid__vertical" style={{ '--line': index }} key={index} />
      ))}
      <span className="measurement-grid__horizontal measurement-grid__horizontal--one" />
      <span className="measurement-grid__horizontal measurement-grid__horizontal--two" />
      {[0, 4, 8, 12].flatMap((column) => [1, 2].map((row) => (
        <i className="measurement-grid__cross" style={{ '--column': column, '--row': row }} key={`${column}-${row}`} />
      )))}
    </div>
  )
}

function handleSectionLink(event) {
  const hash = event.currentTarget.getAttribute('href')
  if (!hash?.startsWith('#')) return

  const target = document.querySelector(hash)
  if (!target) return

  event.preventDefault()
  // Match native anchor positioning for compact sections under the fixed header.
  const scrollMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
  const targetTop = target.getBoundingClientRect().top + window.scrollY - scrollMargin
  scrollToPagePosition(targetTop, {
    onComplete: () => window.history.replaceState(null, '', hash),
  })
}

export default function GlobalChrome({
  homeHref = '#top',
  phase,
  sectionHrefPrefix = '',
}) {
  const headerRef = useRef(null)
  const navigationRef = useRef(null)
  const isMobile = useMobileLayout()
  const active = phase === ENTRANCE_PHASE.SCENE_ENTER
    || phase === ENTRANCE_PHASE.TEXT_DECODE
    || phase === ENTRANCE_PHASE.READY

  useEffect(() => {
    if (!isMobile) return
    const header = headerRef.current
    const navigation = navigationRef.current
    if (!header || !navigation) return

    // Ignore elastic overscroll outside the page so edge bounce cannot flip
    // the menu direction. Keep transient tracking outside React render state.
    const readScrollY = () => Math.max(0, Math.min(
      window.scrollY,
      document.documentElement.scrollHeight - window.innerHeight,
    ))
    let lastScrollY = readScrollY()
    let direction = 0
    let directionDistance = 0
    let hidden = false
    const setHidden = (nextHidden) => {
      if (hidden === nextHidden) return
      hidden = nextHidden
      header.dataset.scrolling = String(nextHidden)
      navigation.dataset.scrolling = String(nextHidden)
      navigation.inert = nextHidden
    }
    const handleScroll = () => {
      const scrollY = readScrollY()
      const delta = scrollY - lastScrollY
      lastScrollY = scrollY
      if (scrollY === 0) {
        direction = 0
        directionDistance = 0
        setHidden(false)
        return
      }
      if (delta === 0) return

      const nextDirection = Math.sign(delta)
      directionDistance = nextDirection === direction
        ? directionDistance + Math.abs(delta)
        : Math.abs(delta)
      direction = nextDirection

      // Finger up (page offset increases): collapse and stay collapsed at rest.
      // Finger down: reveal. A small travel threshold filters scroll jitter.
      if (directionDistance >= 6) {
        setHidden(direction > 0)
        directionDistance = 0
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      delete header.dataset.scrolling
      delete navigation.dataset.scrolling
      navigation.inert = false
    }
  }, [isMobile])

  return (
    <div className="global-chrome" data-scene-active={active}>
      <GlobalGrid />
      <header ref={headerRef} className="site-header">
        <a className="site-mark" href={homeHref} onClick={handleSectionLink} aria-label="Pengyang Design, home">PENGYANG.DESIGN</a>
        <nav ref={navigationRef} className="site-nav" aria-label="Primary navigation">
          <a href={`${sectionHrefPrefix}#about`} onClick={handleSectionLink}>关于我</a>
          <a href={`${sectionHrefPrefix}#projects`} onClick={handleSectionLink}>项目经历</a>
          <a href={`${sectionHrefPrefix}#work`} onClick={handleSectionLink}>工作经历</a>
          <a href={`${sectionHrefPrefix}#contact`} onClick={handleSectionLink}>联系方式</a>
        </nav>
      </header>
      <div className="telemetry telemetry--environment mono">
        <ClockTelemetry />
      </div>
      <div className="telemetry telemetry--pointer mono">
        <CoordinateTelemetry />
      </div>
      <div className="telemetry telemetry--world" aria-label="Worldwide">
        <svg viewBox="0 0 56 28" role="img" aria-hidden="true"><ellipse cx="28" cy="14" rx="26" ry="12" /><ellipse cx="28" cy="14" rx="11" ry="12" /><path d="M3 14h50M6 8h44M6 20h44" /></svg>
      </div>
    </div>
  )
}
