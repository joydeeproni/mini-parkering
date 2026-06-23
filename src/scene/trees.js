import * as THREE from 'three'

export function createTree(x, z) {
  const group = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x6b4226 })
  )
  trunk.position.set(x, 0.6, z)
  trunk.castShadow = true
  group.add(trunk)

  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x2d5a27 })
  )
  foliage.position.set(x, 1.6, z)
  foliage.castShadow = true
  group.add(foliage)

  return group
}

export function createTrees(scene, state) {
  const group = new THREE.Group()

  // Trees along left side
  for (let i = 0; i < 6; i++) {
    group.add(createTree(-8 - Math.random() * 2, -i * 3 + 1))
  }
  // Trees along right side
  for (let i = 0; i < 6; i++) {
    group.add(createTree(8 + Math.random() * 2, -i * 3 + 1))
  }
  // Trees near entrance
  group.add(createTree(-5, 4))
  group.add(createTree(5, 4))

  scene.add(group)
  return { group }
}
