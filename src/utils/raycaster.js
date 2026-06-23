import * as THREE from 'three'

export function createRaycaster(camera, renderer) {
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function getClickedObject(event, scene) {
    const rect = renderer.domElement.getBoundingClientRect()
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    const clientY = event.touches ? event.touches[0].clientY : event.clientY
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)

    return intersects.length > 0 ? intersects[0] : null
  }

  function projectToScreen(position) {
    const vec = position.clone().project(camera)
    const rect = renderer.domElement.getBoundingClientRect()
    return {
      x: (vec.x * 0.5 + 0.5) * rect.width,
      y: (-vec.y * 0.5 + 0.5) * rect.height,
    }
  }

  return { getClickedObject, projectToScreen }
}
