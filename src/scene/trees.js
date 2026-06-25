import * as THREE from 'three'

export function createTree(x, z) {
  const group = new THREE.Group()

  // Trunk — brown box (voxel style)
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 1.2, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x8b6844 })
  )
  trunk.position.set(x, 0.6, z)
  trunk.castShadow = true
  group.add(trunk)

  // Foliage — stacked green boxes (Crossy Road style)
  const greens = [0x6ec040, 0x58a838, 0x78d048]
  const foliageMat = new THREE.MeshLambertMaterial({ color: greens[Math.floor(Math.random() * greens.length)] })

  // Bottom layer — wider
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.6, 1.6),
    foliageMat
  )
  bottom.position.set(x, 1.5, z)
  bottom.castShadow = true
  group.add(bottom)

  // Top layer — smaller
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.5, 1.1),
    foliageMat
  )
  top.position.set(x, 2.05, z)
  top.castShadow = true
  group.add(top)

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
