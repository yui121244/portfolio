import { Canvas } from '@react-three/fiber'
import PointerRig from '../scene/PointerRig'

export default function GlobalCursor({ backgroundProgressRef, visible }) {
  return (
    <div className="global-cursor" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 42, near: 0.1, far: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ camera, gl }) => {
          camera.layers.enable(2)
          gl.setClearColor('#E6F3FC', 0)
        }}
      >
        <PointerRig
          backgroundProgressRef={backgroundProgressRef}
          standaloneBackdrop
          visible={visible}
        />
      </Canvas>
    </div>
  )
}
