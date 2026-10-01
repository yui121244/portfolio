import { useEffect, useRef } from 'react'

export default function ProjectViewCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return undefined

    const setVisible = (visible) => {
      cursor.dataset.visible = String(visible)
      if (visible) document.documentElement.dataset.cursorMode = 'project-view'
      else delete document.documentElement.dataset.cursorMode
    }

    const handlePointerMove = (event) => {
      const isProjectLink = event.target instanceof Element
        && Boolean(event.target.closest('[data-project-hover-target]'))
      cursor.style.setProperty('--project-cursor-x', `${event.clientX}px`)
      cursor.style.setProperty('--project-cursor-y', `${event.clientY}px`)
      setVisible(isProjectLink)
    }

    const handlePointerLeave = () => setVisible(false)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave)
      delete document.documentElement.dataset.cursorMode
    }
  }, [])

  return (
    <div className="project-view-cursor" data-visible="false" ref={cursorRef} aria-hidden="true">
      <span>VIEW</span>
    </div>
  )
}
