import * as THREE from 'three'

export function createWarden(scene, state, lot) {
  const group = new THREE.Group()
  group.visible = false

  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 1, 8),
    new THREE.MeshLambertMaterial({ color: 0x1a365d })
  )
  body.position.y = 0.5
  group.add(body)

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xfad5a5 })
  )
  head.position.y = 1.2
  group.add(head)

  // Hat
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.22, 0.15, 8),
    new THREE.MeshLambertMaterial({ color: 0x1e40af })
  )
  hat.position.y = 1.4
  group.add(hat)

  scene.add(group)

  let patrolIndex = 0
  const patrolTarget = new THREE.Vector3()

  function update(delta) {
    if (!state.wardenActive) {
      group.visible = false
      return
    }

    group.visible = true
    const positions = lot.slotPositions
    if (positions.length === 0) return

    const target = positions[patrolIndex % positions.length]
    patrolTarget.set(target.x, 0, target.z)

    const dir = patrolTarget.clone().sub(group.position)
    const dist = dir.length()

    if (dist < 0.5) {
      patrolIndex = (patrolIndex + 1) % positions.length
    } else {
      dir.normalize()
      group.position.add(dir.multiplyScalar(Math.min(3 * delta, dist)))
      group.rotation.y = Math.atan2(dir.x, dir.z)
    }
  }

  return { group, update }
}
