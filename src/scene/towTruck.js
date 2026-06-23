import * as THREE from 'three'

export function createTowTruck(scene) {
  const truckGroup = new THREE.Group()
  truckGroup.visible = false

  // Truck body (larger than car)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 3.5),
    new THREE.MeshLambertMaterial({ color: 0xf59e0b })
  )
  body.position.y = 0.4
  truckGroup.add(body)

  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 1.2),
    new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
  )
  cabin.position.set(0, 1, 0.8)
  truckGroup.add(cabin)

  // Flatbed
  const flatbed = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.1, 2),
    new THREE.MeshLambertMaterial({ color: 0x666666 })
  )
  flatbed.position.set(0, 0.85, -0.7)
  truckGroup.add(flatbed)

  scene.add(truckGroup)

  let activeTow = null

  function towCar(carMesh, slotPos, gatePos, onDone) {
    truckGroup.visible = true
    truckGroup.position.set(slotPos.x, 0, slotPos.z + 3)

    activeTow = {
      phase: 'approach', // approach → hookup → drag → done
      carMesh,
      slotPos: new THREE.Vector3(slotPos.x, 0, slotPos.z),
      gatePos: new THREE.Vector3(
        gatePos && gatePos.x != null ? gatePos.x : 0,
        0,
        gatePos && gatePos.z != null ? gatePos.z : 30
      ),
      onDone,
    }
  }

  function update(delta) {
    if (!activeTow) return

    const speed = 5
    const t = activeTow

    if (t.phase === 'approach') {
      const dir = t.slotPos.clone().sub(truckGroup.position)
      if (dir.length() < 0.5) {
        t.phase = 'hookup'
        t.carMesh.position.set(truckGroup.position.x, 0.9, truckGroup.position.z - 1.5)
      } else {
        dir.normalize()
        truckGroup.position.add(dir.multiplyScalar(speed * delta))
        truckGroup.rotation.y = Math.atan2(dir.x, dir.z)
      }
    } else if (t.phase === 'hookup') {
      // Brief pause for hookup, then drag
      t.phase = 'drag'
    } else if (t.phase === 'drag') {
      const dir = t.gatePos.clone().sub(truckGroup.position)
      if (dir.length() < 1) {
        t.phase = 'done'
        truckGroup.visible = false
        scene.remove(t.carMesh)
        if (t.onDone) t.onDone()
        activeTow = null
      } else {
        dir.normalize()
        truckGroup.position.add(dir.multiplyScalar(speed * delta))
        t.carMesh.position.set(truckGroup.position.x, 0.9, truckGroup.position.z - 1.5)
        truckGroup.rotation.y = Math.atan2(dir.x, dir.z)
      }
    }
  }

  return {
    truckGroup,
    towCar,
    update,
    get isBusy() { return !!activeTow },
  }
}
