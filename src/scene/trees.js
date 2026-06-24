import * as THREE from 'three'

export function createTree(x, z) {
  const group = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x8b7355 })
  )
  trunk.position.set(x, 0.6, z)
  trunk.castShadow = true
  group.add(trunk)

  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x6aaa7a })
  )
  foliage.position.set(x, 1.6, z)
  foliage.castShadow = true
  group.add(foliage)

  return group
}

export function createTrees(scene, state) {
  const group = new THREE.Group()

  for (let i = 0; i < 7; i++) {
    group.add(createTree(-14 - Math.random() * 3, -i * 4.5 + 3))
  }
  for (let i = 0; i < 7; i++) {
    group.add(createTree(14 + Math.random() * 3, -i * 4.5 + 3))
  }
  group.add(createTree(-7, 6))
  group.add(createTree(7, 6))
  group.add(createTree(-12, 10))
  group.add(createTree(12, 10))

  scene.add(group)
  return { group }
}
