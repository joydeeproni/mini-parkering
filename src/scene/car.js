import * as THREE from 'three'

const CAR_COLORS = [
  0xd4726a, // muted coral
  0x6a9ebd, // soft steel blue
  0xe8c86a, // warm sand yellow
  0x7ab88a, // sage green
  0x9e84b0, // dusty lavender
  0xe0d5c4, // warm cream
  0x6db8a8, // soft teal
  0x8a9aa8, // blue-gray
]

const STRIPE_COLORS = [0xf0ece4, 0xe8d8a0, 0x606060, 0xd0926a]

export function createCar(colorIndex) {
  const color = CAR_COLORS[colorIndex ?? Math.floor(Math.random() * CAR_COLORS.length)]
  const stripe = STRIPE_COLORS[Math.floor(Math.random() * STRIPE_COLORS.length)]

  const group = new THREE.Group()

  // Body
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.8)
  bodyGeo.translate(0, 0.3, 0)
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color }))
  body.castShadow = true
  group.add(body)

  // Round the body edges visually with a slightly inset top
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.5, 1.4),
    new THREE.MeshLambertMaterial({ color: 0xc8dce8 })
  )
  cabin.position.set(0, 0.85, -0.2)
  cabin.castShadow = true
  group.add(cabin)

  // Stripe
  const stripeGeo = new THREE.BoxGeometry(1.62, 0.05, 0.3)
  const stripeMesh = new THREE.Mesh(stripeGeo, new THREE.MeshLambertMaterial({ color: stripe }))
  stripeMesh.position.set(0, 0.62, 0.5)
  group.add(stripeMesh)

  // Wheels (4 small dark cylinders)
  const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8)
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
  for (const [wx, wz] of [[-0.75, 0.9], [0.75, 0.9], [-0.75, -0.9], [0.75, -0.9]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(wx, 0.15, wz)
    group.add(wheel)
  }

  // Headlights
  const headlightGeo = new THREE.BoxGeometry(0.2, 0.15, 0.05)
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc })
  for (const hx of [-0.55, 0.55]) {
    const hl = new THREE.Mesh(headlightGeo, headlightMat)
    hl.position.set(hx, 0.35, 1.4)
    group.add(hl)
  }

  // Taillights
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 })
  for (const hx of [-0.55, 0.55]) {
    const tl = new THREE.Mesh(headlightGeo, taillightMat)
    tl.position.set(hx, 0.35, -1.4)
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

      // Face direction of travel
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
