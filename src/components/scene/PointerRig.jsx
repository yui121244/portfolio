import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Shape, Vector2, Vector3 } from 'three'
import { cursorRefractionBus } from '../../lib/cursorRefractionBus'
import { pointerBus } from '../../lib/pointerBus'
import CursorGlassMaterial from './CursorGlassMaterial'

const OUTER_EXTRUSION = {
  depth: 0.39,
  bevelEnabled: true,
  bevelSize: 0.13,
  bevelThickness: 0.125,
  bevelSegments: 18,
  curveSegments: 32,
}

const CURSOR_RESTING_ROLL = -0.1
const CURSOR_DIRECTIONAL_ROLL = 0.5
const CURSOR_DIRECTIONAL_YAW = 0.58
const CURSOR_DEPTH = 2.2
const HERO_BACKGROUND = new Color('#E6F3FC')
const SECOND_SCREEN_BACKGROUND = new Color('#F3FAFF')

function createPointerShape() {
  const shape = new Shape()
  shape.moveTo(0.025, -0.015)
  shape.quadraticCurveTo(-0.02, -0.025, -0.04, -0.11)
  shape.lineTo(-0.35, -1.82)
  shape.quadraticCurveTo(-0.375, -1.94, -0.275, -1.995)
  shape.quadraticCurveTo(-0.17, -2.05, -0.085, -1.93)
  shape.lineTo(0.17, -1.61)
  shape.quadraticCurveTo(0.225, -1.535, 0.28, -1.64)
  shape.lineTo(0.55, -2.285)
  shape.quadraticCurveTo(0.605, -2.42, 0.735, -2.365)
  shape.lineTo(1.02, -2.23)
  shape.quadraticCurveTo(1.14, -2.17, 1.08, -2.045)
  shape.lineTo(0.66, -1.43)
  shape.quadraticCurveTo(0.61, -1.34, 0.73, -1.35)
  shape.lineTo(1.15, -1.31)
  shape.quadraticCurveTo(1.275, -1.295, 1.305, -1.18)
  shape.quadraticCurveTo(1.335, -1.075, 1.225, -1.0)
  shape.lineTo(0.125, -0.045)
  shape.quadraticCurveTo(0.075, -0.005, 0.025, -0.015)
  shape.closePath()
  return shape
}

export default function PointerRig({ backgroundProgressRef, standaloneBackdrop = false, visible }) {
  const rig = useRef(null)
  const cursor = useRef(null)
  const cursorMaterial = useRef(null)
  const viewport = useThree((state) => state.viewport)
  const pointerShape = useMemo(() => createPointerShape(), [])
  const cursorPlane = useMemo(() => new Vector3(0, 0, CURSOR_DEPTH), [])
  const smoothedPointer = useRef(new Vector2(0, 0))
  const previousTargetX = useRef(0)
  const directionalTilt = useRef(0)
  const liveBackdropColor = useRef(new Color('#E6F3FC'))

  useEffect(() => {
    // The cursor belongs only to the final pass. If it enters the refraction
    // capture it recursively refracts itself and creates long grey shards.
    rig.current?.traverse((object) => object.layers.set(2))
  }, [])

  useFrame(({ camera, clock }, delta) => {
    if (!cursor.current || !cursorMaterial.current) return
    const targetX = pointerBus.uv.x * 2 - 1
    const targetY = -(pointerBus.uv.y * 2 - 1)
    const pointerDeltaX = targetX - previousTargetX.current
    previousTargetX.current = targetX
    if (pointerBus.insideRef.current && Math.abs(pointerDeltaX) > 0.00001) {
      const horizontalImpulse = MathUtils.clamp(pointerDeltaX / Math.max(delta, 1 / 120) * 0.55, -1, 1)
      directionalTilt.current = MathUtils.lerp(directionalTilt.current, horizontalImpulse, 0.78)
    }
    directionalTilt.current = MathUtils.damp(directionalTilt.current, 0, 3.2, delta)
    smoothedPointer.current.x = MathUtils.damp(smoothedPointer.current.x, targetX, 14, delta)
    smoothedPointer.current.y = MathUtils.damp(smoothedPointer.current.y, targetY, 14, delta)
    // The pointer is rendered in front of the camera's z=0 target plane. Use
    // that exact depth for the NDC-to-world conversion; mapping it with the
    // default viewport makes the visual hotspot drift farther from the native
    // pointer as it approaches any screen edge.
    const cursorViewport = viewport.getCurrentViewport(camera, cursorPlane)
    const x = smoothedPointer.current.x * cursorViewport.width * 0.5
    const y = smoothedPointer.current.y * cursorViewport.height * 0.5
    const velocityY = targetY - smoothedPointer.current.y
    const horizontalDirection = directionalTilt.current
    cursor.current.position.x = x
    cursor.current.position.y = y
    cursor.current.rotation.z = MathUtils.damp(
      cursor.current.rotation.z,
      CURSOR_RESTING_ROLL - horizontalDirection * CURSOR_DIRECTIONAL_ROLL + velocityY * 1.5,
      7,
      delta,
    )
    cursor.current.rotation.y = MathUtils.damp(
      cursor.current.rotation.y,
      horizontalDirection * CURSOR_DIRECTIONAL_YAW,
      6,
      delta,
    )
    const targetOpacity = visible && pointerBus.insideRef.current ? 1 : 0
    cursorMaterial.current.uniforms.uOpacity.value = MathUtils.damp(
      cursorMaterial.current.uniforms.uOpacity.value,
      targetOpacity,
      5,
      delta,
    )
    if (standaloneBackdrop) {
      const backgroundProgress = MathUtils.clamp(backgroundProgressRef?.current ?? 0, 0, 1)
      liveBackdropColor.current.copy(HERO_BACKGROUND).lerp(SECOND_SCREEN_BACKGROUND, backgroundProgress)
      cursorMaterial.current.uniforms.uBackdropColor.value.copy(liveBackdropColor.current)
    } else {
      cursorMaterial.current.uniforms.uSceneTexture.value = cursorRefractionBus.texture
      cursorMaterial.current.uniforms.uResolution.value.copy(cursorRefractionBus.resolution)
    }
    cursorMaterial.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <group ref={rig}>
      <group ref={cursor} position={[0, 0, CURSOR_DEPTH]} scale={0.44}>
        <mesh rotation={[-0.0785, 0, 0]} renderOrder={100}>
          <extrudeGeometry args={[pointerShape, OUTER_EXTRUSION]} />
          <CursorGlassMaterial
            ref={cursorMaterial}
            baseColor="#97c2ff"
            rimColor="#118cff"
            deepColor="#0753bd"
            standaloneBackdrop={standaloneBackdrop}
            backdropColor="#E6F3FC"
          />
        </mesh>
      </group>
    </group>
  )
}
