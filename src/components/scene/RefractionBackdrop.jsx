import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  backgroundCausticsFragmentShader,
  backgroundCausticsVertexShader,
} from '../../shaders/backgroundCaustics'

export default function RefractionBackdrop({ backgroundMixRef, layer = 3 }) {
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const size = useThree((state) => state.size)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uBackgroundMix: { value: 0 },
  }), [])

  useFrame(() => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = performance.now() * 0.001
    material.uniforms.uAspect.value = size.width / Math.max(size.height, 1)
    material.uniforms.uBackgroundMix.value = backgroundMixRef?.current ?? 0
  }, -3)

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -5]}
      scale={[2.2, 1.45, 1]}
      frustumCulled={false}
      onUpdate={(mesh) => mesh.layers.set(layer)}
    >
      <planeGeometry args={[22, 14]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={backgroundCausticsVertexShader}
        fragmentShader={backgroundCausticsFragmentShader}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
