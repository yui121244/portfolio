import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function DocumentPreviewModal({ children, onClose, title }) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div
      className="document-preview-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="document-preview-title"
        aria-modal="true"
        className="document-preview-dialog"
        data-lenis-prevent
        data-lenis-prevent-wheel
        onTouchMove={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="document-preview-dialog__header">
          <h2 id="document-preview-title">{title}</h2>
          <button aria-label={`关闭${title}`} onClick={onClose} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 5 19 19M19 5 5 19" />
            </svg>
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  )
}
