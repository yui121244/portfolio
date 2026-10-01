import { ENTRANCE_PHASE } from '../../lib/entranceTimeline'
import HeroBackground from '../scene/HeroBackground'
import GlobalCursor from './GlobalCursor'

export default function GlobalVisualStage({ phase, scrollProgressRef }) {
  const cursorVisible = phase === ENTRANCE_PHASE.SCENE_ENTER
    || phase === ENTRANCE_PHASE.TEXT_DECODE
    || phase === ENTRANCE_PHASE.READY

  return (
    <>
      <div className="global-visual-stage" data-phase={phase} aria-hidden="true">
        <div className="global-caustics">
          <HeroBackground backgroundMixRef={scrollProgressRef} />
        </div>
      </div>
      <GlobalCursor backgroundProgressRef={scrollProgressRef} visible={cursorVisible} />
    </>
  )
}
