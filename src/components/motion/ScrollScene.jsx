function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

const STATIC_STOPS = Object.freeze([[0, 0], [1, 0]])
const VISIBLE_STOPS = Object.freeze([[0, 1], [1, 1]])
const SCALE_STOPS = Object.freeze([[0, 1], [1, 1]])

function serializeStops(stops) {
  return JSON.stringify(stops)
}

function firstValue(stops, fallback) {
  return stops?.[0]?.[1] ?? fallback
}

export function ScrollScene({
  as: Component = 'section',
  children,
  className,
  heightVh = 160,
  progressMode = 'enter',
  style,
  ...props
}) {
  return (
    <Component
      className={joinClassNames('scroll-scene', className)}
      data-scroll-scene
      data-scroll-scene-progress-mode={progressMode}
      style={{ '--scroll-scene-height': `${heightVh}svh`, ...style }}
      {...props}
    >
      {children}
    </Component>
  )
}

export function ScrollSceneViewport({
  as: Component = 'div',
  children,
  className,
  ...props
}) {
  return (
    <Component className={joinClassNames('scroll-scene__sticky', className)} {...props}>
      {children}
    </Component>
  )
}

export function ScrollSceneLayer({
  as: Component = 'div',
  blurStops = STATIC_STOPS,
  children,
  className,
  opacityStops = VISIBLE_STOPS,
  scaleStops = SCALE_STOPS,
  style,
  yStops = STATIC_STOPS,
  ...props
}) {
  return (
    <Component
      className={joinClassNames('scroll-scene-layer', className)}
      data-scroll-scene-blur-stops={serializeStops(blurStops)}
      data-scroll-scene-layer
      data-scroll-scene-opacity-stops={serializeStops(opacityStops)}
      data-scroll-scene-scale-stops={serializeStops(scaleStops)}
      data-scroll-scene-y-stops={serializeStops(yStops)}
      style={{
        '--scroll-scene-blur': `${firstValue(blurStops, 0)}px`,
        '--scroll-scene-opacity': firstValue(opacityStops, 1),
        '--scroll-scene-scale': firstValue(scaleStops, 1),
        '--scroll-scene-y': `${firstValue(yStops, 0)}vh`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  )
}
