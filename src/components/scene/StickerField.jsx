import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  Matrix4,
  MathUtils,
  Object3D,
  PlaneGeometry,
  Vector4,
} from 'three'
import { createStickerAtlas, STICKER_ASSET_COUNT } from '../../lib/createStickerAtlas'

const MAX_STICKERS = STICKER_ASSET_COUNT
const MIN_STICKER_SCALE = 1.16
const MAX_STICKER_SCALE = 2.12
const STICKER_SCALE_BIAS = 0.68
const HORIZONTAL_SPAWN_RANGE = 0.46
const INITIAL_SPAWN_STAGGER = 0.42

const vertexShader = /* glsl */ `
  attribute vec4 aUvRect;
  varying vec2 vAtlasUv;
  void main() {
    vAtlasUv = aUvRect.xy + uv * aUvRect.zw;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uOpacity;
  varying vec2 vAtlasUv;
  void main() {
    vec4 sticker = texture2D(uAtlas, vAtlasUv);
    if (sticker.a < 0.04) discard;
    gl_FragColor = vec4(sticker.rgb, sticker.a * uOpacity);
  }
`

function randomFactory(seed = 9147) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function signedHash(value) {
  const noise = Math.sin(value * 12.9898) * 43758.5453
  return (noise - Math.floor(noise)) * 2 - 1
}

function createParticles(textureCount) {
  const random = randomFactory()
  return Array.from({ length: MAX_STICKERS }, (_, index) => ({
    xUnit: -1 + ((index + random()) / MAX_STICKERS) * 2,
    y: 0,
    initialStagger: random(),
    spawnCycle: 0,
    z: -0.38 - random() * 0.16,
    speed: 0.26 + random() * 0.42,
    drift: 0.16 + random() * 0.28,
    phase: random() * Math.PI * 2,
    rotation: random() * Math.PI * 2,
    spin: (random() - 0.5) * 0.38,
    scale: MIN_STICKER_SCALE
      + Math.pow(random(), STICKER_SCALE_BIAS) * (MAX_STICKER_SCALE - MIN_STICKER_SCALE),
    textureIndex: index % textureCount,
  }))
}

export default function StickerField({
  active,
  revealProgressRef,
  startFilled = false,
  zOffset = 0,
  renderOrder = 0,
  scaleMultiplier = 1,
  mobileScaleMultiplier = 1,
}) {
  const meshRef = useRef(null)
  const initializedRef = useRef(false)
  const atlas = useMemo(() => createStickerAtlas(), [])
  const particles = useMemo(() => createParticles(atlas.count), [atlas.count])
  const object = useMemo(() => new Object3D(), [])
  const matrix = useMemo(() => new Matrix4(), [])
  const geometry = useMemo(() => {
    const nextGeometry = new PlaneGeometry(1, 1)
    const uvRects = new Float32Array(MAX_STICKERS * 4)
    nextGeometry.setAttribute('aUvRect', new InstancedBufferAttribute(uvRects, 4))
    return nextGeometry
  }, [])
  const uniforms = useMemo(() => ({
    uAtlas: { value: atlas.texture },
    uOpacity: { value: revealProgressRef ? 0 : 1 },
  }), [atlas.texture, revealProgressRef])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return undefined
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.count = MAX_STICKERS
    return () => {
      geometry.dispose()
      atlas.texture.dispose()
    }
  }, [atlas.texture, geometry])

  useFrame(({ clock, viewport }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    uniforms.uOpacity.value = MathUtils.damp(
      uniforms.uOpacity.value,
      active ? MathUtils.clamp(revealProgressRef?.current ?? 1, 0, 1) : 0,
      7,
      delta,
    )
    if (!active) return
    const uvAttribute = geometry.getAttribute('aUvRect')
    const time = clock.elapsedTime
    const viewportTop = viewport.height * 0.5
    const viewportBottom = -viewportTop

    if (!initializedRef.current) {
      for (let index = 0; index < MAX_STICKERS; index += 1) {
        const particle = particles[index]
        const outsideGap = particle.scale * 0.56 + 0.16
        particle.y = startFilled
          ? viewportTop - ((index + particle.initialStagger) / MAX_STICKERS) * viewport.height * 1.18
          : viewportTop
            + outsideGap
            + particle.initialStagger * viewport.height * INITIAL_SPAWN_STAGGER
      }
      initializedRef.current = true
    }

    for (let index = 0; index < MAX_STICKERS; index += 1) {
      const particle = particles[index]
      particle.y -= particle.speed * delta
      particle.rotation += particle.spin * delta
      if (particle.y < viewportBottom - particle.scale * 0.62) {
        particle.spawnCycle += 1
        particle.y = viewportTop + particle.scale * 0.56 + 0.16 + (index % 3) * 0.18
        particle.xUnit = signedHash(index * 7.31 + particle.spawnCycle * 3.17)
      }

      object.position.set(
        particle.xUnit * viewport.width * HORIZONTAL_SPAWN_RANGE
          + Math.sin(time * 0.55 + particle.phase) * particle.drift,
        particle.y,
        particle.z + zOffset,
      )
      object.rotation.set(0, 0, particle.rotation)
      object.scale.setScalar(
        particle.scale
          * scaleMultiplier
          * (viewport.width < 8 ? mobileScaleMultiplier : 1),
      )
      object.updateMatrix()
      matrix.copy(object.matrix)
      mesh.setMatrixAt(index, matrix)

      const uvRect = atlas.uvRects[particle.textureIndex] ?? new Vector4(0, 0, 1, 1)
      uvAttribute.setXYZW(index, uvRect.x, uvRect.y, uvRect.z, uvRect.w)
    }

    mesh.instanceMatrix.needsUpdate = true
    uvAttribute.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, MAX_STICKERS]}
      visible={active}
      frustumCulled={false}
      renderOrder={renderOrder}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
