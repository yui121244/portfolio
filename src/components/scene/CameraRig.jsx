import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, Vector3 } from 'three'
import { pointerBus } from '../../lib/pointerBus'

export default function CameraRig() {
  const lookAt = useRef(new Vector3(0, -0.08, 0))

  useFrame(({ camera }, delta) => {
    const targetX = pointerBus.insideRef.current ? (pointerBus.uv.x - 0.5) * 0.28 : 0
    const targetY = pointerBus.insideRef.current ? (0.5 - pointerBus.uv.y) * 0.18 : 0
    camera.position.x = MathUtils.damp(camera.position.x, targetX, 4.2, delta)
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 4.2, delta)
    lookAt.current.x = camera.position.x * 0.16
    lookAt.current.y = -0.08 + camera.position.y * 0.12
    camera.lookAt(lookAt.current)
  }, -2)

  return null
}
