import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ContactScene from '../scene/ContactScene'
import { ScrollScene, ScrollSceneViewport } from '../motion/ScrollScene'

const CONTACT_METHODS = Object.freeze([
  { id: 'email', label: '1004926891@qq.com', value: '1004926891@qq.com' },
  { id: 'phone', label: '152 1896 8442', value: '152 1896 8442' },
])

function ContactMethodIcon({ type }) {
  if (type === 'email') {
    return (
      <svg aria-hidden="true" className="contact-action__icon" viewBox="0 0 20 20">
        <rect x="2.5" y="4" width="15" height="12" rx="0.5" />
        <path d="m3.25 5 6.75 5.25L16.75 5" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="contact-action__icon" viewBox="0 0 20 20">
      <path d="M6.15 2.75 8.2 6.7 6.55 8.2c.82 1.9 2.36 3.45 4.25 4.28l1.52-1.68 3.93 2.08-.7 3.45c-.12.58-.63.99-1.22.97C7.98 17.07 2.93 12.02 2.7 5.67c-.02-.59.39-1.1.97-1.22l2.48-.5Z" />
    </svg>
  )
}

function fallbackCopy(value) {
  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  return copied
}

function ContactActions() {
  const [copyStatus, setCopyStatus] = useState('')
  const resetTimerRef = useRef(0)

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), [])

  const handleCopy = async (method) => {
    let copied = false
    try {
      await navigator.clipboard.writeText(method.value)
      copied = true
    } catch {
      copied = fallbackCopy(method.value)
    }

    window.clearTimeout(resetTimerRef.current)
    setCopyStatus(copied ? `${method.id === 'email' ? '邮箱' : '手机号'}复制成功` : '复制失败，请重试')
    resetTimerRef.current = window.setTimeout(() => setCopyStatus(''), 1800)
  }

  return (
    <div className="contact-actions" data-contact-actions>
      <div className="contact-actions__buttons">
        {CONTACT_METHODS.map((method) => (
          <button
            aria-label={`复制${method.id === 'email' ? '邮箱' : '手机号'} ${method.label}`}
            className={`contact-action contact-action--${method.id}`}
            key={method.id}
            onClick={() => handleCopy(method)}
            type="button"
          >
            <ContactMethodIcon type={method.id} />
            <span>{method.label}</span>
          </button>
        ))}
      </div>
      {copyStatus
        ? createPortal(
          <div aria-live="polite" className="contact-toast" role="status">
            <span aria-hidden="true" className="contact-toast__icon">✓</span>
            <span>{copyStatus}</span>
          </div>,
          document.body,
        )
        : null}
    </div>
  )
}

export default function ContactSection({ motionRef }) {
  return (
    <ScrollScene
      className="contact-scroll-scene"
      heightVh={190}
      id="contact"
      progressMode="sticky"
      aria-label="联系方式"
    >
      <ScrollSceneViewport className="contact-sticky">
        <div className="contact-visual" data-contact-visual aria-hidden="true">
          <ContactScene motionRef={motionRef} />
        </div>

        <div className="contact-copy">
          <h2 className="contact-heading" data-contact-heading>
            <span className="contact-heading__line contact-heading__line--split">
              <span>Let's</span>
              <span>create</span>
            </span>
            <span className="contact-heading__line">interesting</span>
            <span className="contact-heading__line contact-heading__line--final">designs together</span>
          </h2>
          <ContactActions />
        </div>
      </ScrollSceneViewport>
    </ScrollScene>
  )
}
