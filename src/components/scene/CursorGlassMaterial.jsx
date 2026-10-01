import { forwardRef, useMemo } from 'react'
import { Color, DoubleSide, Vector2 } from 'three'
import { cursorGlassFragmentShader, cursorGlassVertexShader } from '../../shaders/cursorGlass'

const CursorGlassMaterial = forwardRef(function CursorGlassMaterial({
  baseColor,
  rimColor,
  deepColor,
  standaloneBackdrop = false,
  backdropColor = '#E6F3FC',
}, ref) {
  const uniforms = useMemo(() => ({
    uSceneTexture: { value: null },
    uResolution: { value: new Vector2(1, 1) },
    uBaseColor: { value: new Color(baseColor) },
    uRimColor: { value: new Color(rimColor) },
    uDeepColor: { value: new Color(deepColor) },
    uBackdropColor: { value: new Color(backdropColor) },
    uStandaloneBackdrop: { value: standaloneBackdrop ? 1 : 0 },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uRefraction: { value: 0.0042 },
    uDispersion: { value: 0.075 },
  }), [backdropColor, baseColor, deepColor, rimColor, standaloneBackdrop])

  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      vertexShader={cursorGlassVertexShader}
      fragmentShader={cursorGlassFragmentShader}
      transparent
      depthTest={false}
      depthWrite={false}
      side={DoubleSide}
      toneMapped={false}
    />
  )
})

export default CursorGlassMaterial
