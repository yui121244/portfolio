import { useFBO, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Vector2, Vector3 } from 'three'
import { pointerBus } from '../../lib/pointerBus'
import GlassMaterial from './GlassMaterial'
import RefractionBackdrop from './RefractionBackdrop'
import StickerField from './StickerField'

const CONTACT_GLTF_URL = new URL('../../../assets/contact/contact.gltf', import.meta.url).href
const CONTACT_BACKGROUND = Object.freeze({ current: 0 })
const IDLE_FLOAT_AMPLITUDE = 0.14
const IDLE_FLOAT_SECONDARY = 0.04
const IDLE_FLOAT_DRIFT = 0.012
const IDLE_TILT_X = MathUtils.degToRad(0.34)
const IDLE_TILT_Z = MathUtils.degToRad(0.45)

function smoothStep(value) {
  const progress = MathUtils.clamp(value, 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function useContactGeometry() {
  const gltf = useGLTF(CONTACT_GLTF_URL)
  return useMemo(() => {
    let mesh = null
    gltf.scene.traverse((object) => {
      if (!mesh && object.isMesh && object.geometry) mesh = object
    })
    if (!mesh?.isMesh || !mesh.geometry) {
      throw new Error('assets/contact/contact.gltf must contain at least one mesh.')
    }

    mesh.geometry.computeBoundingBox()
    const bounds = mesh.geometry.boundingBox
    return {
      center: bounds.getCenter(new Vector3()),
      geometry: mesh.geometry,
      localYBounds: [bounds.min.y, bounds.max.y],
      size: bounds.getSize(new Vector3()),
    }
  }, [gltf])
}

function ContactGlass({ motionRef }) {
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const revealRef = useRef(0)
  const idleYRef = useRef(0)
  const idleRotationXRef = useRef(0)
  const idleRotationZRef = useRef(0)
  const drawingBufferSize = useRef(new Vector2(1, 1))
  const savedClearColor = useRef(new Color())
  const data = useContactGeometry()
  const viewport = useThree((state) => state.viewport)
  const camera = useThree((state) => state.camera)
  const backgroundFbo = useFBO({ samples: 0, depthBuffer: true, stencilBuffer: false })

  const baseScale = Math.min(
    0.011,
    viewport.width / (data.size.x * (viewport.width < 8 ? 1.04 : 1.55)),
    viewport.height / (data.size.y * 1.36),
  )

  useEffect(() => {
    camera.layers.enable(1)
    camera.layers.disable(3)
  }, [camera])

  useFrame(({ clock, gl, scene, camera: activeCamera }, delta) => {
    const mesh = meshRef.current
    const material = materialRef.current
    if (!mesh || !material) return

    const entryTarget = smoothStep(((motionRef?.current.entry ?? 0) - 0.04) / 0.78)
    revealRef.current = MathUtils.damp(revealRef.current, entryTarget, 7, delta)
    const reveal = revealRef.current
    const exit = smoothStep(((motionRef?.current.progress ?? 0) - 0.62) / 0.38)
    const elapsed = clock.elapsedTime
    const idleTarget = Math.sin(elapsed * 1.15 + 0.55) * IDLE_FLOAT_AMPLITUDE
      + Math.sin(elapsed * 0.56 + 2.1) * IDLE_FLOAT_SECONDARY
      + Math.sin(elapsed * 0.22 + 0.2) * IDLE_FLOAT_DRIFT
    const rotationXTarget = Math.sin(elapsed * 0.48 + 1.35) * IDLE_TILT_X
    const rotationZTarget = Math.sin(elapsed * 0.35 - 0.7) * IDLE_TILT_Z
    idleYRef.current = MathUtils.damp(idleYRef.current, idleTarget, 2.8, delta)
    idleRotationXRef.current = MathUtils.damp(idleRotationXRef.current, rotationXTarget, 2.3, delta)
    idleRotationZRef.current = MathUtils.damp(idleRotationZRef.current, rotationZTarget, 2.3, delta)
    const liveScale = baseScale * MathUtils.lerp(0.92, 1, reveal)

    mesh.visible = reveal > 0.002
    mesh.scale.setScalar(liveScale)
    mesh.position.set(
      -data.center.x * liveScale,
      -data.center.y * liveScale - 0.15
        + (1 - reveal) * viewport.height * 0.15
        - exit * viewport.height * 0.045
        + idleYRef.current,
      -data.center.z * liveScale + 0.24,
    )
    mesh.rotation.x = idleRotationXRef.current
    mesh.rotation.z = idleRotationZRef.current
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uEntranceProgress.value = 1
    material.uniforms.uEntranceActive.value = 0
    material.uniforms.uPointerUv.value.set(pointerBus.uv.x, 1 - pointerBus.uv.y)
    material.uniforms.uLightPosition.value.set(
      4 + (pointerBus.uv.x - 0.5) * 2.4,
      8.5 + (0.5 - pointerBus.uv.y) * 1.8,
      5.5,
    )

    const renderTargetBeforePass = gl.getRenderTarget()
    const cameraMaskBeforePass = activeCamera.layers.mask
    const clearAlphaBeforePass = gl.getClearAlpha()
    gl.getClearColor(savedClearColor.current)
    const wasVisible = mesh.visible

    mesh.visible = false
    activeCamera.layers.set(0)
    activeCamera.layers.enable(3)
    gl.setRenderTarget(backgroundFbo)
    gl.clear(true, true, true)
    gl.render(scene, activeCamera)
    mesh.visible = wasVisible

    material.uniforms.uSceneTexture.value = backgroundFbo.texture
    gl.getDrawingBufferSize(drawingBufferSize.current)
    material.uniforms.uResolution.value.copy(drawingBufferSize.current)

    gl.setRenderTarget(renderTargetBeforePass)
    activeCamera.layers.mask = cameraMaskBeforePass
    gl.setClearColor(savedClearColor.current, clearAlphaBeforePass)
  }, -1)

  return (
    <mesh
      ref={meshRef}
      geometry={data.geometry}
      frustumCulled={false}
      renderOrder={30}
      onUpdate={(mesh) => mesh.layers.set(1)}
    >
      <GlassMaterial ref={materialRef} localYBounds={data.localYBounds} transparent />
    </mesh>
  )
}

function Scene({ motionRef }) {
  return (
    <Suspense fallback={null}>
      <RefractionBackdrop backgroundMixRef={CONTACT_BACKGROUND} layer={3} />
      <StickerField
        active
        startFilled
        zOffset={4.5}
        renderOrder={20}
        scaleMultiplier={0.66}
        mobileScaleMultiplier={0.58}
      />
      <ContactGlass motionRef={motionRef} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.1} luminanceThreshold={1.02} radius={0.28} />
      </EffectComposer>
    </Suspense>
  )
}

export default function ContactScene({ motionRef }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 42, near: 0.1, far: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#E6F3FC', 0)}
    >
      <Scene motionRef={motionRef} />
    </Canvas>
  )
}

useGLTF.preload(CONTACT_GLTF_URL)
