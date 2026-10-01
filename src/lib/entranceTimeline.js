import { useEffect, useRef, useState } from 'react'

export const ENTRANCE_PHASE = Object.freeze({
  LOADING: 'LOADING',
  HELLO_REVEAL: 'HELLO_REVEAL',
  SCENE_ENTER: 'SCENE_ENTER',
  TEXT_DECODE: 'TEXT_DECODE',
  READY: 'READY',
})

// Entrance time starts when the completed loader hands focus to hello.
export const ENTRANCE_TIME = Object.freeze({
  HELLO_REVEAL: 0,
  SCENE_ENTER: 350,
  TEXT_DECODE: 400,
  READY: 1400,
})

export const LOADER_TIME = Object.freeze({
  FAST_END: 240,
  MID_END: 590,
  SLOW_END: 900,
  COMPLETE: 140,
  HOLD: 110,
  EXIT: 110,
})

const FRAME_COMMIT_INTERVAL = 32

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1)
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - clamp01(value), 3)
}

function easeInOutCubic(value) {
  const progress = clamp01(value)
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

export function getStagedLoadingProgress(elapsedMs) {
  if (elapsedMs < LOADER_TIME.FAST_END) {
    return 0.35 * easeOutCubic(elapsedMs / LOADER_TIME.FAST_END)
  }
  if (elapsedMs < LOADER_TIME.MID_END) {
    const progress = (elapsedMs - LOADER_TIME.FAST_END)
      / (LOADER_TIME.MID_END - LOADER_TIME.FAST_END)
    return 0.35 + 0.35 * easeInOutCubic(progress)
  }
  const progress = (elapsedMs - LOADER_TIME.MID_END)
    / (LOADER_TIME.SLOW_END - LOADER_TIME.MID_END)
  return 0.7 + 0.2 * easeOutCubic(progress)
}

export function getEntrancePhase(elapsedMs) {
  if (elapsedMs < ENTRANCE_TIME.HELLO_REVEAL) return ENTRANCE_PHASE.LOADING
  if (elapsedMs < ENTRANCE_TIME.SCENE_ENTER) return ENTRANCE_PHASE.HELLO_REVEAL
  if (elapsedMs < ENTRANCE_TIME.TEXT_DECODE) return ENTRANCE_PHASE.SCENE_ENTER
  if (elapsedMs < ENTRANCE_TIME.READY) return ENTRANCE_PHASE.TEXT_DECODE
  return ENTRANCE_PHASE.READY
}

export function useEntranceTimeline(sceneReady) {
  const sceneReadyRef = useRef(sceneReady)
  const elapsedRef = useRef(-1)
  const [snapshot, setSnapshot] = useState({
    elapsedMs: 0,
    phase: ENTRANCE_PHASE.LOADING,
    loadingProgress: 0,
    loaderVisible: true,
    loaderExiting: false,
  })
  sceneReadyRef.current = sceneReady

  useEffect(() => {
    let animationFrame = 0
    let startTime = null
    let completionStart = null
    let entranceStart = null
    let lastCommit = -FRAME_COMMIT_INTERVAL
    let lastPhase = ENTRANCE_PHASE.LOADING

    const advance = (now) => {
      if (startTime === null) startTime = now
      const loadingElapsed = now - startTime
      let elapsedMs = 0
      let phase = ENTRANCE_PHASE.LOADING
      let loadingProgress = getStagedLoadingProgress(loadingElapsed)
      let loaderVisible = true
      let loaderExiting = false

      if (
        entranceStart === null
        && completionStart === null
        && sceneReadyRef.current
        && loadingElapsed >= LOADER_TIME.SLOW_END
      ) {
        completionStart = now
      }

      if (completionStart !== null && entranceStart === null) {
        const completionElapsed = now - completionStart
        loadingProgress = 0.9 + 0.1 * easeOutCubic(completionElapsed / LOADER_TIME.COMPLETE)
        if (completionElapsed >= LOADER_TIME.COMPLETE + LOADER_TIME.HOLD) {
          entranceStart = now
        }
      }

      if (entranceStart !== null) {
        elapsedMs = Math.min(now - entranceStart, ENTRANCE_TIME.READY)
        elapsedRef.current = elapsedMs
        phase = getEntrancePhase(elapsedMs)
        loadingProgress = 1
        loaderVisible = elapsedMs < LOADER_TIME.EXIT
        loaderExiting = true
      } else {
        elapsedRef.current = -1
      }

      const phaseChanged = phase !== lastPhase
      const commitDue = now - lastCommit >= FRAME_COMMIT_INTERVAL
      if (phaseChanged || commitDue || elapsedMs === ENTRANCE_TIME.READY) {
        lastCommit = now
        lastPhase = phase
        setSnapshot({ elapsedMs, phase, loadingProgress, loaderVisible, loaderExiting })
      }

      if (phase !== ENTRANCE_PHASE.READY) {
        animationFrame = window.requestAnimationFrame(advance)
      }
    }

    animationFrame = window.requestAnimationFrame(advance)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  return { ...snapshot, elapsedRef }
}
