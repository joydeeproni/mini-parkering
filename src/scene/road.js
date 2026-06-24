import * as THREE from 'three'

export function createRoad(scene) {
  const group = new THREE.Group()

  // Crossy Road blue-grey road
  const roadWidth = 12
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth, 35),
    new THREE.MeshLambertMaterial({ color: 0x6b7b8d })
  )
  road.rotation.x = -Math.PI / 2
  road.position.set(0, 0.005, 19)
  road.receiveShadow = true
  group.add(road)

  // Center divider dashes — lighter grey
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x9aa8b4 })
  for (let i = 0; i < 12; i++) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 1),
      lineMat
    )
    dash.rotation.x = -Math.PI / 2
    dash.position.set(0, 0.01, 5 + i * 2.8)
    group.add(dash)
  }

  // Lane arrows — entry (right lane)
  const arrowGeo = new THREE.PlaneGeometry(0.8, 1.5)
  const entryArrow = new THREE.Mesh(arrowGeo, lineMat)
  entryArrow.rotation.x = -Math.PI / 2
  entryArrow.position.set(3, 0.01, 8)
  group.add(entryArrow)

  // Lane arrows — exit (left lane)
  const exitArrow = new THREE.Mesh(arrowGeo, lineMat)
  exitArrow.rotation.x = -Math.PI / 2
  exitArrow.rotation.z = Math.PI
  exitArrow.position.set(-3, 0.01, 8)
  group.add(exitArrow)

  // Sidewalks — light grey concrete
  const halfRoad = roadWidth / 2
  for (const xOff of [-halfRoad - 0.75, halfRoad + 0.75]) {
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.15, 35),
      new THREE.MeshLambertMaterial({ color: 0xc0c8cc })
    )
    sidewalk.position.set(xOff, 0.075, 19)
    group.add(sidewalk)
  }

  // Grass strips alongside sidewalks
  for (const xOff of [-halfRoad - 2.5, halfRoad + 2.5]) {
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 35),
      new THREE.MeshLambertMaterial({ color: 0x7ec850 })
    )
    grass.rotation.x = -Math.PI / 2
    grass.position.set(xOff, 0.003, 19)
    group.add(grass)
  }

  // Queue positions on the right lane
  const queuePositions = []
  for (let i = 0; i < 12; i++) {
    queuePositions.push({ x: 3, z: 6 + i * 3.5 })
  }

  scene.add(group)
  return { group, queuePositions }
}
