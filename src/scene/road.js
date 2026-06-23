import * as THREE from 'three'

export function createRoad(scene) {
  const group = new THREE.Group()

  // Main road (runs along z-axis, south of gate)
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 30),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  )
  road.rotation.x = -Math.PI / 2
  road.position.set(0, 0.005, 17)
  road.receiveShadow = true
  group.add(road)

  // Road markings
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xcccccc })
  for (let i = 0; i < 10; i++) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 1),
      lineMat
    )
    dash.rotation.x = -Math.PI / 2
    dash.position.set(0, 0.01, 4 + i * 2.5)
    group.add(dash)
  }

  // Sidewalks
  for (const xOff of [-3.5, 3.5]) {
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.15, 30),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    )
    sidewalk.position.set(xOff, 0.075, 17)
    group.add(sidewalk)
  }

  // Queue positions (where cars wait in line on the road)
  const queuePositions = []
  for (let i = 0; i < 10; i++) {
    queuePositions.push({ x: 0, z: 5 + i * 2.8 })
  }

  scene.add(group)
  return { group, queuePositions }
}
