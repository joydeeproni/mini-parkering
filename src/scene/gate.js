import * as THREE from 'three'

export function createGate(scene) {
  const group = new THREE.Group()
  group.position.set(0, 0, 2)

  // Gate booth
  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.5, 1.5),
    new THREE.MeshLambertMaterial({ color: 0xddd8c4 })
  )
  booth.position.set(-1.2, 1.25, 0)
  booth.castShadow = true
  group.add(booth)

  const boothRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 2),
    new THREE.MeshLambertMaterial({ color: 0x666666 })
  )
  boothRoof.position.set(-1.2, 2.6, 0)
  group.add(boothRoof)

  // Barrier post
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  )
  post.position.set(0.5, 1, 0)
  group.add(post)

  // Barrier arm (pivots at post)
  const armPivot = new THREE.Group()
  armPivot.position.set(0.5, 2, 0)
  group.add(armPivot)

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.15, 0.15),
    new THREE.MeshLambertMaterial({ color: 0xff4444 })
  )
  arm.position.set(2, 0, 0)
  armPivot.add(arm)

  // Stripe on arm
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.16, 0.16),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    )
    stripe.position.set(1 + i * 1.2, 0, 0)
    armPivot.add(stripe)
  }

  let targetAngle = 0
  const barrierArm = armPivot

  function liftBarrier() { targetAngle = -Math.PI / 2 }
  function lowerBarrier() { targetAngle = 0 }

  function update(delta) {
    const current = barrierArm.rotation.z
    const diff = targetAngle - current
    if (Math.abs(diff) > 0.01) {
      barrierArm.rotation.z += diff * Math.min(1, delta * 5)
    }
  }

  scene.add(group)
  return { group, barrierArm, liftBarrier, lowerBarrier, update }
}
