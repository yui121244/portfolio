import { useGLTF } from '@react-three/drei'
import { forwardRef, useEffect, useMemo } from 'react'
import { Vector3 } from 'three'

export const HELLO_GLTF_URL = new URL('../../../assets/hero/hello.gltf', import.meta.url).href

export function useHelloGeometry() {
  const gltf = useGLTF(HELLO_GLTF_URL)
  return useMemo(() => {
    const path = gltf.scene.getObjectByName('Path')
    if (!path?.isMesh || !path.geometry) {
      throw new Error('assets/hero/hello.gltf must contain a mesh named “Path”.')
    }

    path.geometry.computeBoundingBox()
    const bounds = path.geometry.boundingBox
    const center = bounds.getCenter(new Vector3())
    return {
      geometry: path.geometry,
      center,
      localYBounds: [bounds.min.y, bounds.max.y],
    }
  }, [gltf])
}

const HelloGeometry = forwardRef(function HelloGeometry({ data, children, onReady, scale, visible = true }, ref) {
  useEffect(() => {
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(onReady)
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [onReady])

  return (
    <mesh
      ref={ref}
      geometry={data.geometry}
      position={[
        -data.center.x * scale,
        -data.center.y * scale - 0.15,
        0.24,
      ]}
      scale={scale}
      visible={visible}
      frustumCulled={false}
      onUpdate={(mesh) => mesh.layers.set(1)}
    >
      {children}
    </mesh>
  )
})

useGLTF.preload(HELLO_GLTF_URL)

export default HelloGeometry
