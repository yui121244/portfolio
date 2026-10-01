import { forwardRef, useMemo } from 'react'
import { DoubleSide, Vector2, Vector3 } from 'three'
import { glassFragmentShader, glassVertexShader } from '../../shaders/glass'

const GlassMaterial = forwardRef(function GlassMaterial({ localYBounds, transparent = false }, ref) {
  const uniforms = useMemo(() => ({
    uSceneTexture: { value: null },
    uResolution: { value: new Vector2(1, 1) },
    uLightPosition: { value: new Vector3(4, 9, 5.5) },
    uTime: { value: 0 },
    uEntranceProgress: { value: 1 },
    uEntranceActive: { value: 0 },
    uThicknessScale: { value: 0.68 },
    uLocalYBounds: { value: new Vector2(localYBounds[0], localYBounds[1]) },
    uRefraction: { value: 0.0165 },
    uDispersion: { value: 0.17 },
    uOpticalThickness: { value: 1.02 },
    uDistortion: { value: 0.035 },
    uPointerUv: { value: new Vector2(0.5, 0.5) },
    uPointerVelocity: { value: new Vector2(0, 0) },
    uDragStrength: { value: 0 },
    uAspect: { value: 1 },
    uTintLow: { value: new Vector3(0.784314, 0.72549, 1.0) },
    uTintHigh: { value: new Vector3(0.22, 0.43, 0.91) },
  }), [localYBounds])

  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      vertexShader={glassVertexShader}
      fragmentShader={glassFragmentShader}
      side={DoubleSide}
      transparent={transparent}
      depthWrite
      depthTest
      toneMapped={false}
    />
  )
})

export default GlassMaterial
