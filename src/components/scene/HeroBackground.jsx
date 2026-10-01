import { Canvas } from '@react-three/fiber'
import RefractionBackdrop from './RefractionBackdrop'

export default function HeroBackground({ backgroundMixRef }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 42, near: 0.1, far: 60 }}
      dpr={[1, 1.25]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#E6F3FC', 1)}
    >
      <RefractionBackdrop layer={0} backgroundMixRef={backgroundMixRef} />
    </Canvas>
  )
}
