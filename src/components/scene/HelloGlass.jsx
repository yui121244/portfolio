import { useFBO } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  Color,
  HalfFloatType,
  LinearFilter,
  Mesh,
  MathUtils,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
} from 'three'
import { pointerBus } from '../../lib/pointerBus'
import { cursorRefractionBus } from '../../lib/cursorRefractionBus'
import { ENTRANCE_PHASE, ENTRANCE_TIME } from '../../lib/entranceTimeline'
import {
  feedbackFragmentShader,
  feedbackVertexShader,
  ghostFragmentShader,
} from '../../shaders/helloFeedback'
import GlassMaterial from './GlassMaterial'
import HelloGeometry, { useHelloGeometry } from './HelloGeometry'

const DEFAULT_ANGLE = Math.atan2(9, 4)
const LIGHT_RADIUS = Math.hypot(4, 9)
const IDLE_FLOAT_AMPLITUDE = 0.14
const IDLE_FLOAT_SECONDARY = 0.04
const IDLE_FLOAT_DRIFT = 0.012
const IDLE_TILT_X = MathUtils.degToRad(0.34)
const IDLE_TILT_Z = MathUtils.degToRad(0.45)

function dampAngle(current, target, lambda, delta) {
  const shortest = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + shortest * (1 - Math.exp(-lambda * delta))
}

function smoothStep(progress) {
  const value = MathUtils.clamp(progress, 0, 1)
  return value * value * (3 - 2 * value)
}

function easeOutCubic(progress) {
  const value = 1 - MathUtils.clamp(progress, 0, 1)
  return 1 - value * value * value
}

function IdleFloatGroup({ active, children }) {
  const groupRef = useRef(null)

  useFrame(({ clock }, delta) => {
    const group = groupRef.current
    if (!group) return

    if (!active) {
      group.position.y = MathUtils.damp(group.position.y, 0, 8, delta)
      group.rotation.x = MathUtils.damp(group.rotation.x, 0, 8, delta)
      group.rotation.z = MathUtils.damp(group.rotation.z, 0, 8, delta)
      return
    }

    const elapsed = clock.elapsedTime
    const targetY = Math.sin(elapsed * 1.15 + 0.55) * IDLE_FLOAT_AMPLITUDE
      + Math.sin(elapsed * 0.56 + 2.1) * IDLE_FLOAT_SECONDARY
      + Math.sin(elapsed * 0.22 + 0.2) * IDLE_FLOAT_DRIFT
    const targetRotationX = Math.sin(elapsed * 0.48 + 1.35) * IDLE_TILT_X
    const targetRotationZ = Math.sin(elapsed * 0.35 - 0.7) * IDLE_TILT_Z

    group.position.y = MathUtils.damp(group.position.y, targetY, 2.8, delta)
    group.rotation.x = MathUtils.damp(group.rotation.x, targetRotationX, 2.3, delta)
    group.rotation.z = MathUtils.damp(group.rotation.z, targetRotationZ, 2.3, delta)
  }, -2)

  return <group ref={groupRef}>{children}</group>
}

function createFeedbackPass() {
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    uniforms: {
      uCurrentFrame: { value: null },
      uPreviousFrame: { value: null },
      uPointerUv: { value: new Vector2(0.5, 0.5) },
      uPreviousPointerUv: { value: new Vector2(0.5, 0.5) },
      uStrength: { value: 0 },
      uDecay: { value: 0.96 },
      uAspect: { value: 1 },
    },
    vertexShader: feedbackVertexShader,
    fragmentShader: feedbackFragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const quad = new Mesh(geometry, material)
  quad.frustumCulled = false
  scene.add(quad)
  return { scene, camera, geometry, material }
}

function createHelloCapturePass() {
  const scene = new Scene()
  const mesh = new Mesh()
  mesh.matrixAutoUpdate = false
  mesh.frustumCulled = false
  scene.add(mesh)
  return { scene, mesh }
}

export default function HelloGlass({ active, heroExitProgressRef, onReady, phase, timelineRef }) {
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const ghostMaterialRef = useRef(null)
  const angleRef = useRef(DEFAULT_ANGLE)
  const targetAngleRef = useRef(DEFAULT_ANGLE)
  const drawingBufferSize = useRef(new Vector2(1, 1))
  const previousPointer = useRef(new Vector2(0.5, 0.5))
  const framePreviousPointer = useRef(new Vector2(0.5, 0.5))
  const pointerScreen = useRef(new Vector2(0.5, 0.5))
  const pointerWasInside = useRef(false)
  const savedClearColor = useRef(new Color())
  const feedbackIndex = useRef(0)
  const feedbackInitialized = useRef(false)
  const data = useHelloGeometry()
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const camera = useThree((state) => state.camera)
  const fbo = useFBO({ samples: 0, depthBuffer: true, stencilBuffer: false })
  const currentHelloFbo = useFBO({
    samples: 0,
    depthBuffer: true,
    stencilBuffer: false,
    // Preserve HDR specular values so the existing bloom/material is unchanged.
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  })
  const feedbackFboA = useFBO({
    samples: 0,
    depthBuffer: false,
    stencilBuffer: false,
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  })
  const feedbackFboB = useFBO({
    samples: 0,
    depthBuffer: false,
    stencilBuffer: false,
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  })
  const helloCapturePass = useMemo(() => createHelloCapturePass(), [])
  const feedbackPass = useMemo(() => createFeedbackPass(), [])
  const ghostUniforms = useMemo(() => ({
    uCurrentFrame: { value: null },
    uDisplacement: { value: null },
    uAspect: { value: 1 },
  }), [])
  const bounds = data.geometry.boundingBox
  // Fit the mobile canvas, not the desktop model scale. The height limit
  // leaves room for the existing float even in a short landscape banner.
  const scale = size.width <= 900
    ? Math.min(
      viewport.width * 0.88 / (bounds.max.x - bounds.min.x),
      viewport.height * 0.78 / (bounds.max.y - bounds.min.y),
    )
    : size.height <= 760
      ? 0.0123
      : 0.01184

  useEffect(() => {
    // Display the glass once through the displacement composite, not an
    // undeformed mesh plus a second ghost (which doubles its white highlights).
    camera.layers.disable(1)
    camera.layers.enable(2)
    camera.layers.enable(4)
    camera.layers.disable(3)
  }, [camera])

  useEffect(() => () => {
    feedbackPass.geometry.dispose()
    feedbackPass.material.dispose()
  }, [feedbackPass])

  useEffect(() => {
    feedbackInitialized.current = false
  }, [size.width, size.height])

  useFrame(({ gl, scene, camera: activeCamera, clock }, delta) => {
    const glass = meshRef.current
    const material = materialRef.current
    if (!glass || !material) return
    const elapsedMs = timelineRef.current
    const revealProgress = smoothStep(
      (elapsedMs - ENTRANCE_TIME.HELLO_REVEAL)
      / (ENTRANCE_TIME.SCENE_ENTER - ENTRANCE_TIME.HELLO_REVEAL),
    )
    const heroScaleProgress = easeOutCubic(
      (elapsedMs - ENTRANCE_TIME.SCENE_ENTER) / 100,
    )
    const entranceScale = elapsedMs < ENTRANCE_TIME.SCENE_ENTER
      ? MathUtils.lerp(0.6, 0.8, revealProgress)
      : MathUtils.lerp(0.8, 1, heroScaleProgress)
    const exitProgress = smoothStep(heroExitProgressRef?.current ?? 0)
    const liveScale = scale * entranceScale * MathUtils.lerp(1, 0.78, exitProgress)
    glass.visible = elapsedMs >= ENTRANCE_TIME.HELLO_REVEAL
    glass.scale.setScalar(liveScale)
    glass.position.set(
      -data.center.x * liveScale,
      -data.center.y * liveScale - 0.15,
      0.24,
    )
    material.uniforms.uEntranceProgress.value = revealProgress
    material.uniforms.uEntranceActive.value = elapsedMs < ENTRANCE_TIME.SCENE_ENTER ? 1 : 0
    // Keep the source mesh explicitly isolated for the hello-only capture.
    // Relying only on the declarative onUpdate callback can leave the first
    // offscreen frames on the default layer before React commits the layer.
    glass.layers.set(1)

    const renderTargetBeforePasses = gl.getRenderTarget()
    const cameraMaskBeforePasses = activeCamera.layers.mask
    const clearAlphaBeforePasses = gl.getClearAlpha()
    gl.getClearColor(savedClearColor.current)
    const wasVisible = glass.visible

    // PASS 1: capture the background and stickers without any glass or ghost.
    glass.visible = false
    activeCamera.layers.set(0)
    activeCamera.layers.enable(3)
    gl.setRenderTarget(fbo)
    gl.clear(true, true, true)
    gl.render(scene, activeCamera)
    glass.visible = wasVisible

    material.uniforms.uSceneTexture.value = fbo.texture
    gl.getDrawingBufferSize(drawingBufferSize.current)
    material.uniforms.uResolution.value.copy(drawingBufferSize.current)
    cursorRefractionBus.texture = fbo.texture
    cursorRefractionBus.resolution.copy(drawingBufferSize.current)
    material.uniforms.uTime.value = clock.elapsedTime

    const pointerUv = pointerScreen.current.set(
      pointerBus.uv.x,
      1 - pointerBus.uv.y,
    )
    const pointerInside = pointerBus.insideRef.current
    const moved = pointerInside
      && pointerWasInside.current
      && pointerUv.distanceToSquared(previousPointer.current) > 0
    if (moved) {
      framePreviousPointer.current.copy(previousPointer.current)
    } else {
      framePreviousPointer.current.copy(pointerUv)
    }
    pointerWasInside.current = pointerInside
    previousPointer.current.copy(pointerUv)

    // The interaction only warps captured glass. Do not separately offset
    // refraction: its original highlight/rim/tint must stay registered together.
    const movementStrength = active && moved ? 1.35 : 0

    const mappedX = (pointerBus.uv.x - 0.5) * 2
    const mappedY = (0.5 - pointerBus.uv.y) * 2
    if (pointerBus.insideRef.current && mappedX * mappedX + mappedY * mappedY > 1e-6) {
      targetAngleRef.current = Math.atan2(mappedY, mappedX)
    } else if (!pointerBus.insideRef.current) {
      targetAngleRef.current = DEFAULT_ANGLE
    }
    angleRef.current = dampAngle(angleRef.current, targetAngleRef.current, 5.5, delta)
    material.uniforms.uLightPosition.value.set(
      LIGHT_RADIUS * Math.cos(angleRef.current),
      LIGHT_RADIUS * Math.sin(angleRef.current) - 0.48,
      5.2,
    )
    material.uniforms.uDistortion.value = MathUtils.damp(
      material.uniforms.uDistortion.value,
      0.03,
      5,
      delta,
    )

    // PASS 2: render only the real glass mesh into an isolated scene. Reusing
    // the live geometry, material, and matrixWorld keeps this pass optically
    // identical without pulling stickers, cursor, or any other scene layer in.
    glass.updateWorldMatrix(true, false)
    helloCapturePass.mesh.geometry = glass.geometry
    helloCapturePass.mesh.material = glass.material
    helloCapturePass.mesh.visible = glass.visible
    helloCapturePass.mesh.matrix.copy(glass.matrixWorld)
    helloCapturePass.mesh.matrixWorldNeedsUpdate = true
    gl.setClearColor(0x000000, 0)
    gl.setRenderTarget(currentHelloFbo)
    gl.clear(true, true, true)
    gl.render(helloCapturePass.scene, activeCamera)

    if (!feedbackInitialized.current) {
      gl.setRenderTarget(feedbackFboA)
      gl.clear(true, false, false)
      gl.setRenderTarget(feedbackFboB)
      gl.clear(true, false, false)
      feedbackInitialized.current = true
    }

    // PASS 3: accumulate a local signed displacement field, then relax it toward
    // zero. Re-sampling live glass avoids frozen stickers and colored trails.
    const previousFeedback = feedbackIndex.current === 0 ? feedbackFboA : feedbackFboB
    const nextFeedback = feedbackIndex.current === 0 ? feedbackFboB : feedbackFboA
    const feedbackUniforms = feedbackPass.material.uniforms
    feedbackUniforms.uCurrentFrame.value = currentHelloFbo.texture
    feedbackUniforms.uPreviousFrame.value = previousFeedback.texture
    feedbackUniforms.uPointerUv.value.copy(pointerUv)
    feedbackUniforms.uPreviousPointerUv.value.copy(framePreviousPointer.current)
    feedbackUniforms.uStrength.value = movementStrength
    feedbackUniforms.uDecay.value = Math.exp(-delta * 6.5)
    feedbackUniforms.uAspect.value = size.width / Math.max(size.height, 1)

    gl.setRenderTarget(nextFeedback)
    gl.render(feedbackPass.scene, feedbackPass.camera)
    const liveGhostUniforms = ghostMaterialRef.current?.uniforms
    if (liveGhostUniforms) {
      liveGhostUniforms.uCurrentFrame.value = currentHelloFbo.texture
      liveGhostUniforms.uDisplacement.value = nextFeedback.texture
      liveGhostUniforms.uAspect.value = size.width / Math.max(size.height, 1)
    }
    feedbackIndex.current = feedbackIndex.current === 0 ? 1 : 0

    gl.setRenderTarget(renderTargetBeforePasses)
    activeCamera.layers.mask = cameraMaskBeforePasses
    gl.setClearColor(savedClearColor.current, clearAlphaBeforePasses)
  }, -1)

  return (
    <IdleFloatGroup active={phase === ENTRANCE_PHASE.READY}>
      <HelloGeometry
        ref={meshRef}
        data={data}
        onReady={onReady}
        scale={scale}
        visible={phase !== ENTRANCE_PHASE.LOADING}
      >
        <GlassMaterial ref={materialRef} localYBounds={data.localYBounds} />
      </HelloGeometry>
      <mesh
        visible={phase !== ENTRANCE_PHASE.LOADING}
        frustumCulled={false}
        renderOrder={20}
        onUpdate={(mesh) => mesh.layers.set(4)}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={ghostMaterialRef}
          uniforms={ghostUniforms}
          vertexShader={feedbackVertexShader}
          fragmentShader={ghostFragmentShader}
          transparent
          premultipliedAlpha
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </IdleFloatGroup>
  )
}
