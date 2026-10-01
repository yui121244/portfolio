import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { ENTRANCE_PHASE } from '../../lib/entranceTimeline'
import CameraRig from './CameraRig'
import HelloGlass from './HelloGlass'
import RefractionBackdrop from './RefractionBackdrop'
import StickerField from './StickerField'

function Scene({ heroExitProgressRef, onReady, phase, timelineRef }) {
  const active = phase === ENTRANCE_PHASE.SCENE_ENTER
    || phase === ENTRANCE_PHASE.TEXT_DECODE
    || phase === ENTRANCE_PHASE.READY
  return (
    <Suspense fallback={null}>
      <CameraRig />
      <RefractionBackdrop />
      <StickerField active={active} />
      <HelloGlass
        active={active}
        heroExitProgressRef={heroExitProgressRef}
        phase={phase}
        timelineRef={timelineRef}
        onReady={onReady}
      />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.1} luminanceThreshold={1.02} radius={0.28} />
      </EffectComposer>
    </Suspense>
  )
}

export default function HeroScene({ heroExitProgressRef, onReady, phase, timelineRef }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 42, near: 0.1, far: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#E6F3FC', 0)}
    >
      <Scene
        heroExitProgressRef={heroExitProgressRef}
        phase={phase}
        timelineRef={timelineRef}
        onReady={onReady}
      />
    </Canvas>
  )
}
