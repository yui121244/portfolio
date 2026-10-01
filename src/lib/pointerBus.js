const CENTER_UV = Object.freeze({ x: 0.5, y: 0.5 })
const SERVER_SNAPSHOT = Object.freeze({ x: 0, y: 0, uvX: 0.5, uvY: 0.5, inside: false })

let snapshot = SERVER_SNAPSHOT
let notifyFrame = 0
const listeners = new Set()

export const pointerBus = {
  uv: {
    x: CENTER_UV.x,
    y: CENTER_UV.y,
    set(x, y) {
      this.x = x
      this.y = y
    },
  },
  insideRef: { current: false },
}

function notify() {
  notifyFrame = 0
  listeners.forEach((listener) => listener())
}

function scheduleNotify() {
  if (notifyFrame) return
  notifyFrame = window.requestAnimationFrame(notify)
}

function writePointer(next) {
  snapshot = Object.freeze(next)
  pointerBus.uv.set(next.uvX, next.uvY)
  pointerBus.insideRef.current = next.inside
  scheduleNotify()
}

function updateFromEvent(event) {
  const width = Math.max(window.innerWidth, 1)
  const height = Math.max(window.innerHeight, 1)
  writePointer({
    x: Math.round(event.clientX),
    y: Math.round(event.clientY),
    uvX: Math.min(1, Math.max(0, event.clientX / width)),
    uvY: Math.min(1, Math.max(0, event.clientY / height)),
    inside: true,
  })
}

function resetPointer() {
  writePointer({
    x: Math.round(window.innerWidth * 0.5),
    y: Math.round(window.innerHeight * 0.5),
    uvX: CENTER_UV.x,
    uvY: CENTER_UV.y,
    inside: false,
  })
}

function handleVisibility() {
  if (document.hidden) resetPointer()
}

export function installPointerBus() {
  resetPointer()
  window.addEventListener('pointermove', updateFromEvent, { passive: true })
  // CDP and a few embedded browsers still emit MouseEvent without a matching
  // PointerEvent. Keeping this fallback makes the shared bus deterministic in
  // both real input and automated visual regression runs.
  window.addEventListener('mousemove', updateFromEvent, { passive: true })
  document.documentElement.addEventListener('pointerleave', resetPointer)
  document.documentElement.addEventListener('mouseleave', resetPointer)
  window.addEventListener('blur', resetPointer)
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    window.removeEventListener('pointermove', updateFromEvent)
    window.removeEventListener('mousemove', updateFromEvent)
    document.documentElement.removeEventListener('pointerleave', resetPointer)
    document.documentElement.removeEventListener('mouseleave', resetPointer)
    window.removeEventListener('blur', resetPointer)
    document.removeEventListener('visibilitychange', handleVisibility)
    if (notifyFrame) window.cancelAnimationFrame(notifyFrame)
  }
}

export function subscribePointer(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPointerSnapshot() {
  return snapshot
}

export function getPointerServerSnapshot() {
  return SERVER_SNAPSHOT
}

export function formatCoordinate(value) {
  return String(Math.max(0, Math.round(value))).padStart(4, '0')
}
