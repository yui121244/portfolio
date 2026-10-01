import { useMemo } from 'react'
import { ENTRANCE_PHASE, ENTRANCE_TIME } from '../../lib/entranceTimeline'

const DECODE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#+=^!/*'

function scrambledGlyph(seed, tick) {
  const noise = Math.sin(seed * 91.731 + tick * 47.117) * 43758.5453
  const index = Math.floor((noise - Math.floor(noise)) * DECODE_GLYPHS.length)
  return DECODE_GLYPHS[index]
}

function DecodeLine({ children, elapsedMs, lineIndex, ready }) {
  const source = String(children).toUpperCase()
  const plan = useMemo(() => {
    const characters = source.split('')
    const firstResolve = lineIndex === 0 ? 610 : 690
    const lastResolve = lineIndex === 0 ? 1015 : 1415
    const resolveStep = (lastResolve - firstResolve) / Math.max(characters.length - 1, 1)
    const lineStart = ENTRANCE_TIME.TEXT_DECODE + lineIndex * 65

    return characters.map((character, index) => ({
      character,
      resolveAt: firstResolve + resolveStep * index + Math.random() * Math.min(26, resolveStep * 0.32),
      scrambleAt: lineStart + index * 6 + Math.random() * 52,
      seed: Math.random() * 10000 + index * 131 + lineIndex * 977,
    }))
  }, [lineIndex, source])
  const complete = ready || plan.every(({ character, resolveAt }) => character === ' ' || elapsedMs >= resolveAt)

  return (
    <span className="hero-title__line" data-complete={complete} aria-hidden="true">
      {plan.map(({ character, resolveAt, scrambleAt, seed }, index) => {
        if (character === ' ') {
          return <span className="decode-char decode-char--space" key={`${index}-space`}>&nbsp;</span>
        }
        const resolved = ready || elapsedMs >= resolveAt
        const started = elapsedMs >= scrambleAt
        const tick = Math.floor((elapsedMs - scrambleAt) / 38)
        const display = resolved ? character : started ? scrambledGlyph(seed, tick) : '\u00a0'
        return (
          <span className="decode-char" data-resolved={resolved} key={`${index}-${character}`}>
            <span className="decode-char__measure">{character}</span>
            <span className="decode-char__glyph">{display}</span>
          </span>
        )
      })}
    </span>
  )
}

export default function HeroInterface({ elapsedMs, phase }) {
  const sceneActive = phase === ENTRANCE_PHASE.SCENE_ENTER
    || phase === ENTRANCE_PHASE.TEXT_DECODE
    || phase === ENTRANCE_PHASE.READY
  const decodeActive = phase === ENTRANCE_PHASE.TEXT_DECODE || phase === ENTRANCE_PHASE.READY
  const ready = phase === ENTRANCE_PHASE.READY
  return (
    <div className="hero-interface" data-scene-active={sceneActive} data-decode-active={decodeActive}>
      <div className="hero-meta hero-meta--discipline">
        UI &amp; UX<br />DESIGN
      </div>
      <p className="hero-meta hero-meta--intro mono">
        Stay curious.<br />Create with joy.
      </p>
      <h1 className="hero-title" aria-label="Design Portfolio">
        <DecodeLine elapsedMs={elapsedMs} lineIndex={0} ready={ready}>Design</DecodeLine>
        <DecodeLine elapsedMs={elapsedMs} lineIndex={1} ready={ready}>Portfolio</DecodeLine>
      </h1>
    </div>
  )
}
