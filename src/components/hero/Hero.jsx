import { lazy, Suspense } from 'react'
import { ENTRANCE_PHASE } from '../../lib/entranceTimeline'
import HeroInterface from './HeroInterface'

const HeroScene = lazy(() => import('../scene/HeroScene'))

export default function Hero({ elapsedMs, heroExitProgressRef, onSceneReady, phase, timelineRef }) {
  const sceneActive = phase === ENTRANCE_PHASE.SCENE_ENTER
    || phase === ENTRANCE_PHASE.TEXT_DECODE
    || phase === ENTRANCE_PHASE.READY
  return (
    <section
      className="hero"
      id="top"
      data-phase={phase}
      data-entrance-ms={Math.round(elapsedMs)}
      data-scene-active={sceneActive}
    >
      <div className="hero__webgl" aria-hidden="true">
        <Suspense fallback={null}>
          <HeroScene
            heroExitProgressRef={heroExitProgressRef}
            phase={phase}
            timelineRef={timelineRef}
            onReady={onSceneReady}
          />
        </Suspense>
      </div>
      <HeroInterface phase={phase} elapsedMs={elapsedMs} />
      <p className="webgl-fallback">This portfolio introduction uses WebGL. The headline and navigation remain available above.</p>
    </section>
  )
}
