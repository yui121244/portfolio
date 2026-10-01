const DAMPING_TIME_CONSTANT_MS = 150
const LAYER_CONFIG = new WeakMap()

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1)
}

function smoothStep(value) {
  const progress = clamp01(value)
  return progress * progress * (3 - 2 * progress)
}

function parseStops(layer, datasetKey, fallback) {
  try {
    const parsed = JSON.parse(layer.dataset[datasetKey] || '')
    return Array.isArray(parsed) && parsed.length ? parsed : fallback
  } catch {
    return fallback
  }
}

function getLayerConfig(layer) {
  const cached = LAYER_CONFIG.get(layer)
  if (cached) return cached

  const config = {
    blur: parseStops(layer, 'scrollSceneBlurStops', [[0, 0], [1, 0]]),
    opacity: parseStops(layer, 'scrollSceneOpacityStops', [[0, 1], [1, 1]]),
    scale: parseStops(layer, 'scrollSceneScaleStops', [[0, 1], [1, 1]]),
    y: parseStops(layer, 'scrollSceneYStops', [[0, 0], [1, 0]]),
  }
  LAYER_CONFIG.set(layer, config)
  return config
}

function interpolateStops(stops, progress) {
  if (progress <= stops[0][0]) return stops[0][1]

  for (let index = 1; index < stops.length; index += 1) {
    const current = stops[index]
    const previous = stops[index - 1]
    if (progress <= current[0]) {
      const distance = Math.max(current[0] - previous[0], 0.0001)
      const localProgress = smoothStep((progress - previous[0]) / distance)
      return previous[1] + (current[1] - previous[1]) * localProgress
    }
  }

  return stops[stops.length - 1][1]
}

function progressBetween(progress, start, end) {
  return smoothStep((progress - start) / Math.max(end - start, 0.0001))
}

function setLayerMotion(element, { blur = 0, opacity = 1, scale = 1, y = 0 }) {
  if (!element) return
  element.style.setProperty('--scroll-scene-y', typeof y === 'string' ? y : `${y.toFixed(2)}px`)
  element.style.setProperty('--scroll-scene-opacity', opacity.toFixed(4))
  element.style.setProperty('--scroll-scene-scale', scale.toFixed(5))
  element.style.setProperty('--scroll-scene-blur', `${blur.toFixed(2)}px`)
}

function renderExperienceScene(scene, progress, entryProgress) {
  const firstSlide = progressBetween(progress, 0.24, 0.42)
  const secondSlide = progressBetween(progress, 0.6, 0.78)
  const experienceTrack = scene.querySelector('.experience-track')
  const experienceViewport = scene.querySelector('.experience-content')

  scene.style.setProperty('--experience-track-x', `${((firstSlide + secondSlide) * -33.333333).toFixed(5)}%`)
  if (experienceTrack && experienceViewport) {
    const trackXInPixels = (firstSlide + secondSlide) * -experienceViewport.clientWidth
    experienceTrack.style.transform = `translate3d(${trackXInPixels.toFixed(2)}px, 0, 0)`
  }

  const headingEnter = progressBetween(entryProgress, 0.06, 0.58)
  const timelineEnter = progressBetween(entryProgress, 0.18, 0.72)
  const sceneExit = progressBetween(progress, 0.86, 1)
  setLayerMotion(scene.querySelector('[data-experience-heading]'), {
    blur: (1 - headingEnter) * 7,
    opacity: headingEnter * (1 - sceneExit * 0.38),
    y: (1 - headingEnter) * 80 - sceneExit * 82,
  })
  setLayerMotion(scene.querySelector('[data-experience-timeline]'), {
    blur: (1 - timelineEnter) * 5,
    opacity: timelineEnter * (1 - sceneExit * 0.28),
    y: (1 - timelineEnter) * 108 - sceneExit * 58,
  })

  scene.querySelectorAll('[data-experience-state]').forEach((state, stateIndex) => {
    state.querySelectorAll('[data-experience-card]').forEach((card, pairIndex) => {
      const stagger = pairIndex * 0.045
      const entrance = stateIndex === 0
        ? progressBetween(entryProgress, 0.18 + stagger, 0.86 + stagger)
        : 1
      const text = card.querySelector('[data-experience-text]')
      const visual = card.querySelector('[data-experience-visual]')

      card.style.setProperty('--experience-card-entry-y', `${((1 - entrance) * 150).toFixed(2)}px`)
      card.style.setProperty('--experience-card-entry-opacity', entrance.toFixed(4))
      card.style.setProperty('--experience-card-entry-scale', (0.975 + entrance * 0.025).toFixed(5))
      card.style.setProperty('--experience-card-entry-blur', `${((1 - entrance) * 3).toFixed(2)}px`)

      if (text) {
        text.style.setProperty('--experience-text-y', '0px')
        text.style.setProperty('--experience-text-opacity', '1')
        text.style.setProperty('--experience-text-blur', '0px')
      }
      if (visual) {
        visual.style.setProperty('--experience-visual-y', '0px')
        visual.style.setProperty('--experience-visual-opacity', '1')
        visual.style.setProperty('--experience-visual-scale', '1')
      }
    })
  })
}

function renderProjectsScene(scene, progress, entryProgress, viewportHeight) {
  const viewport = scene.querySelector('.projects-sticky')
  const track = scene.querySelector('[data-projects-track]')
  if (viewport && track) {
    const travelProgress = progressBetween(progress, 0.015, 0.96)
    const availableTravel = Math.max(track.scrollHeight - viewport.clientHeight + 214, 0)
    track.style.transform = `translate3d(0, ${(-availableTravel * travelProgress).toFixed(2)}px, 0)`
  }

  const headingEnter = progressBetween(entryProgress, 0.05, 0.62)
  const headingExit = progressBetween(progress, 0.3, 0.5)
  setLayerMotion(scene.querySelector('[data-projects-heading]'), {
    blur: (1 - headingEnter) * 7,
    opacity: headingEnter * (1 - headingExit),
    y: (1 - headingEnter) * 80 - headingExit * 70,
  })

  const revealStarts = [0, 0.13, 0.17, 0.49, 0.53]
  scene.querySelectorAll('[data-project-card]').forEach((card, index) => {
    let lifeProgress
    if (index === 0) {
      const entryReveal = progressBetween(entryProgress, 0.08, 0.82)
      lifeProgress = Math.min(entryReveal * 0.75 + progressBetween(progress, 0, 0.24) * 0.25, 1)
    } else {
      lifeProgress = progressBetween(progress, revealStarts[index], revealStarts[index] + 0.29)
    }

    const y = interpolateStops([
      [0, viewportHeight * 0.16],
      [0.25, viewportHeight * 0.1],
      [0.55, viewportHeight * 0.03],
      [0.75, 0],
      [1, viewportHeight * -0.05],
    ], lifeProgress)
    const opacity = interpolateStops([[0, 0], [0.25, 0.35], [0.55, 0.85], [0.75, 1], [1, 1]], lifeProgress)
    const scale = interpolateStops([[0, 0.975], [0.55, 0.995], [0.75, 1], [1, 1]], lifeProgress)
    const metadataReveal = progressBetween(lifeProgress, 0.4, 0.82)

    card.style.setProperty('--project-card-opacity', opacity.toFixed(4))
    card.style.setProperty('--project-card-y', `${y.toFixed(2)}px`)
    card.style.setProperty('--project-card-scale', scale.toFixed(5))
    card.style.setProperty('--project-meta-opacity', metadataReveal.toFixed(4))
    card.style.setProperty('--project-meta-y', `${((1 - metadataReveal) * 30).toFixed(2)}px`)
    card.style.setProperty('--project-image-y', `${(-7 + lifeProgress * 14).toFixed(3)}%`)
  })
}

function renderContactScene(scene, progress, entryProgress, viewportHeight) {
  const visualEnter = progressBetween(entryProgress, 0.02, 0.72)
  const headingEnter = progressBetween(entryProgress, 0.08, 0.76)
  const actionsEnter = progressBetween(entryProgress, 0.24, 0.88)
  const exit = progressBetween(progress, 0.68, 1)

  const visual = scene.querySelector('[data-contact-visual]')
  if (visual) {
    visual.style.setProperty('--contact-visual-opacity', visualEnter.toFixed(4))
    visual.style.setProperty('--contact-visual-y', `${((1 - visualEnter) * viewportHeight * 0.025 - exit * viewportHeight * 0.035).toFixed(2)}px`)
  }

  const heading = scene.querySelector('[data-contact-heading]')
  if (heading) {
    heading.style.setProperty('--contact-heading-opacity', headingEnter.toFixed(4))
    heading.style.setProperty('--contact-heading-y', `${((1 - headingEnter) * 144).toFixed(2)}px`)
    heading.style.setProperty('--contact-heading-blur', `${((1 - headingEnter) * 7).toFixed(2)}px`)
  }

  const actions = scene.querySelector('[data-contact-actions]')
  if (actions) {
    actions.style.setProperty('--contact-actions-opacity', actionsEnter.toFixed(4))
    actions.style.setProperty('--contact-actions-y', `${((1 - actionsEnter) * 176).toFixed(2)}px`)
    actions.style.setProperty('--contact-actions-blur', `${((1 - actionsEnter) * 5).toFixed(2)}px`)
  }
}

function renderScene(scene, progress, entryProgress, viewportHeight) {
  scene.style.setProperty('--scroll-scene-progress', progress.toFixed(4))
  scene.style.setProperty('--scroll-scene-entry-progress', entryProgress.toFixed(4))

  scene.querySelectorAll('[data-scroll-scene-layer]').forEach((layer) => {
    const config = getLayerConfig(layer)
    layer.style.setProperty('--scroll-scene-y', `${interpolateStops(config.y, progress).toFixed(3)}vh`)
    layer.style.setProperty('--scroll-scene-opacity', interpolateStops(config.opacity, progress).toFixed(4))
    layer.style.setProperty('--scroll-scene-scale', interpolateStops(config.scale, progress).toFixed(5))
    layer.style.setProperty('--scroll-scene-blur', `${interpolateStops(config.blur, progress).toFixed(2)}px`)
  })

  if (scene.classList.contains('experience-scroll-scene')) {
    renderExperienceScene(scene, progress, entryProgress)
  }

  if (scene.classList.contains('projects-scroll-scene')) {
    renderProjectsScene(scene, progress, entryProgress, viewportHeight)
  }

  if (scene.classList.contains('contact-scroll-scene')) {
    renderContactScene(scene, progress, entryProgress, viewportHeight)
  }
}

export function createScrollSceneController() {
  const sceneStates = new Map()
  let animationFrame = 0
  let lastFrameTime = 0

  const animate = (time) => {
    const deltaTime = lastFrameTime ? Math.min(time - lastFrameTime, 64) : 16.67
    const damping = 1 - Math.exp(-deltaTime / DAMPING_TIME_CONSTANT_MS)
    let unsettled = false
    lastFrameTime = time

    sceneStates.forEach((state, scene) => {
      const difference = state.target - state.visual
      const entryDifference = state.entryTarget - state.entryVisual
      if (Math.abs(difference) > 0.0001) {
        state.visual += difference * damping
        unsettled = true
      } else {
        state.visual = state.target
      }
      if (Math.abs(entryDifference) > 0.0001) {
        state.entryVisual += entryDifference * damping
        unsettled = true
      } else {
        state.entryVisual = state.entryTarget
      }
      renderScene(scene, state.visual, state.entryVisual, state.viewportHeight)
    })

    animationFrame = unsettled ? window.requestAnimationFrame(animate) : 0
    if (!unsettled) lastFrameTime = 0
  }

  const requestRender = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(animate)
  }

  const update = (viewportHeight, immediate = false) => {
    const safeViewportHeight = Math.max(viewportHeight, 1)
    const currentScenes = new Set(document.querySelectorAll('[data-scroll-scene]'))

    currentScenes.forEach((scene) => {
      const bounds = scene.getBoundingClientRect()
      const isStickyProgress = scene.dataset.scrollSceneProgressMode === 'sticky'
      const target = isStickyProgress
        ? clamp01(-bounds.top / Math.max(bounds.height - safeViewportHeight, 1))
        : clamp01((safeViewportHeight - bounds.top) / Math.max(bounds.height, 1))
      const entryTarget = clamp01((safeViewportHeight - bounds.top) / safeViewportHeight)
      let state = sceneStates.get(scene)
      if (!state) {
        state = { entryTarget, entryVisual: entryTarget, target, visual: target, viewportHeight: safeViewportHeight }
        sceneStates.set(scene, state)
      }
      state.target = target
      state.entryTarget = entryTarget
      state.viewportHeight = safeViewportHeight
      scene.style.setProperty('--scroll-scene-target-progress', target.toFixed(4))
      if (immediate) {
        state.visual = target
        state.entryVisual = entryTarget
        renderScene(scene, target, entryTarget, safeViewportHeight)
      }
    })

    sceneStates.forEach((_, scene) => {
      if (!currentScenes.has(scene)) sceneStates.delete(scene)
    })

    if (!immediate) requestRender()
  }

  const destroy = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
    sceneStates.clear()
  }

  return { destroy, update }
}
