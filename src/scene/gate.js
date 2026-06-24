import * as THREE from 'three'

function createSingleGate(scene, x, z, facingLeft) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  const boothSide = facingLeft ? 1.2 : -1.2
  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.5, 1.4),
    new THREE.MeshLambertMaterial({ color: 0xddd8c4 })
  )
  booth.position.set(boothSide, 1.25, 0)
  booth.castShadow = true
  group.add(booth)

  const boothRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.2, 1.8),
    new THREE.MeshLambertMaterial({ color: 0x666666 })
  )
  boothRoof.position.set(boothSide, 2.6, 0)
  group.add(boothRoof)

  const postX = facingLeft ? -0.5 : 0.5
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  )
  post.position.set(postX, 1, 0)
  group.add(post)

  const armPivot = new THREE.Group()
  armPivot.position.set(postX, 2, 0)
  group.add(armPivot)

  const armDir = facingLeft ? -1 : 1
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.15, 0.15),
    new THREE.MeshLambertMaterial({ color: 0xff4444 })
  )
  arm.position.set(armDir * 1.75, 0, 0)
  armPivot.add(arm)

  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.16, 0.16),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    )
    stripe.position.set(armDir * (0.6 + i * 1.0), 0, 0)
    armPivot.add(stripe)
  }

  let targetAngle = 0

  function liftBarrier() { targetAngle = -Math.PI / 2 }
  function lowerBarrier() { targetAngle = 0 }

  function update(delta) {
    const current = armPivot.rotation.z
    const diff = targetAngle - current
    if (Math.abs(diff) > 0.01) {
      armPivot.rotation.z += diff * Math.min(1, delta * 5)
    }
  }

  scene.add(group)
  return { group, liftBarrier, lowerBarrier, update }
}

export function createGates(scene) {
  const entry = createSingleGate(scene, 3, 2, false)
  const exit = createSingleGate(scene, -3, 2, true)

  // Label signs
  const labelMat = new THREE.MeshBasicMaterial({ color: 0x222222 })

  const entrySign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x22aa44 })
  )
  entrySign.position.set(3, 3.2, 2)
  scene.add(entrySign)

  const exitSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xdd3333 })
  )
  exitSign.position.set(-3, 3.2, 2)
  scene.add(exitSign)

  function update(delta) {
    entry.update(delta)
    exit.update(delta)
  }

  return { entry, exit, update }
}
