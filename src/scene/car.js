import * as THREE from 'three'

const CAR_COLORS = [
  0xe86830, // crossy orange
  0xe8c830, // crossy yellow
  0xd83030, // crossy red
  0x58b858, // crossy green
  0x8858b8, // crossy purple
  0x3898d8, // crossy blue
  0xe85888, // crossy pink
  0x48c8a8, // crossy teal
]

export function createCar(colorIndex) {
  const color = CAR_COLORS[colorIndex ?? Math.floor(Math.random() * CAR_COLORS.length)]

  const group = new THREE.Group()
  const mat = new THREE.MeshLambertMaterial({ color })

  // Body — wide flat box
  const bodyGeo = new THREE.BoxGeometry(1.7, 0.55, 2.8)
  bodyGeo.translate(0, 0.28, 0)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.castShadow = true
  group.add(body)

  // Cabin / roof — white top
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.45, 1.3)
  const cabin = new THREE.Mesh(cabinGeo, new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }))
  cabin.position.set(0, 0.78, -0.15)
  cabin.castShadow = true
  group.add(cabin)

  // Windshield — black face on front of cabin
  const windshieldGeo = new THREE.BoxGeometry(1.3, 0.35, 0.06)
  const windshieldMat = new THREE.MeshLambertMaterial({ color: 0x111111 })
  const windshield = new THREE.Mesh(windshieldGeo, windshieldMat)
  windshield.position.set(0, 0.78, 0.52)
  group.add(windshield)

  // Rear window
  const rearWindow = new THREE.Mesh(windshieldGeo, windshieldMat)
  rearWindow.position.set(0, 0.78, -0.82)
  group.add(rearWindow)

  // Wheels — black boxes (voxel style)
  const wheelGeo = new THREE.BoxGeometry(0.2, 0.3, 0.35)
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 })
  for (const [wx, wz] of [[-0.85, 0.85], [0.85, 0.85], [-0.85, -0.85], [0.85, -0.85]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat)
    wheel.position.set(wx, 0.15, wz)
    group.add(wheel)
  }

  // Headlights — small yellow boxes
  const hlGeo = new THREE.BoxGeometry(0.22, 0.16, 0.06)
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xffee88 })
  for (const hx of [-0.55, 0.55]) {
    const hl = new THREE.Mesh(hlGeo, hlMat)
    hl.position.set(hx, 0.32, 1.42)
    group.add(hl)
  }

  // Taillights — small red boxes
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xdd2222 })
  for (const hx of [-0.55, 0.55]) {
    const tl = new THREE.Mesh(hlGeo, tlMat)
    tl.position.set(hx, 0.32, -1.42)
    group.add(tl)
  }

  // Animation state
  let waypoints = []
  let waypointIndex = 0
  let isAnimating = false
  let speed = 6
  let onArrive = null
  let parkReverse = false

  function setPath(points, opts = {}) {
    waypoints = points.map(p => new THREE.Vector3(p.x, p.y ?? 0, p.z))
    waypointIndex = 0
    isAnimating = true
    speed = opts.speed || 6
    parkReverse = opts.reverse || false
    if (waypoints.length > 0) {
      group.position.copy(waypoints[0])
    }
  }

  function update(delta) {
    if (!isAnimating || waypoints.length === 0) return

    const target = waypoints[waypointIndex]
    const current = group.position
    const dir = new THREE.Vector3().subVectors(target, current)
    const dist = dir.length()

    if (dist < 0.1) {
      waypointIndex++
      if (waypointIndex >= waypoints.length) {
        isAnimating = false
        if (onArrive) onArrive()
        return
      }
    } else {
      dir.normalize()
      const step = Math.min(speed * delta, dist)
      current.add(dir.multiplyScalar(step))

      const lookTarget = target.clone()
      lookTarget.y = current.y
      if (lookTarget.distanceTo(current) > 0.01) {
        const angle = Math.atan2(
          lookTarget.x - current.x,
          lookTarget.z - current.z
        )
        group.rotation.y = parkReverse ? angle + Math.PI : angle
      }
    }
  }

  return {
    mesh: group,
    setPath,
    update,
    get isAnimating() { return isAnimating },
    set onArrive(fn) { onArrive = fn },
    get onArrive() { return onArrive },
  }
}
