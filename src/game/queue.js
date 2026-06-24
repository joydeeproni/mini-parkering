import { getQueueCapacity } from './state.js'
import { createCar } from '../scene/car.js'

export function createQueueManager(state, road, gates, parkingManager, lot, scene) {
  const queue = []
  let processingCar = null
  const leavingCars = []

  function addCar() {
    const capacity = getQueueCapacity(state)
    if (queue.length >= capacity) {
      return false
    }
    const car = createCar()
    const queuePos = road.queuePositions[queue.length]
    car.mesh.position.set(queuePos.x, 0, queuePos.z)
    car.mesh.rotation.y = Math.PI
    scene.add(car.mesh)
    queue.push(car)
    return true
  }

  function processNext() {
    if (processingCar || queue.length === 0 || state.gateBroken) return

    const car = queue.shift()
    processingCar = car

    queue.forEach((c, i) => {
      const pos = road.queuePositions[i]
      c.setPath([{ x: pos.x, z: pos.z }], { speed: 4 })
    })

    const slotIndex = parkingManager.assignSlot(car)
    if (slotIndex === null) {
      const exitPath = [
        { x: 3, z: 4 },
        { x: 3, z: 35 },
      ]
      car.setPath(exitPath, { speed: 6 })
      car.onArrive = () => {
        scene.remove(car.mesh)
        processingCar = null
      }
      return
    }

    const slotPos = lot.slotPositions[slotIndex]
    gates.entry.liftBarrier()

    // Entry path: right lane → through entry gate → center lane → slot
    const entryPath = [
      { x: 3, z: 3 },
      { x: 3, z: 1 },
      { x: 0, z: 0 },
      { x: 0, z: slotPos.z },
      { x: slotPos.x, z: slotPos.z },
    ]

    car.setPath(entryPath, { speed: 5 })
    car.onArrive = () => {
      gates.entry.lowerBarrier()
      processingCar = null
    }
  }

  function startCarLeaving(slotIndex, fee, onFeeCollected) {
    const result = parkingManager.releaseSlot(slotIndex)
    if (!result) return null

    const { car } = result
    const slotPos = lot.slotPositions[slotIndex]

    gates.exit.liftBarrier()

    // Exit path: slot → center lane → through exit gate (left) → drive away
    const exitPath = [
      { x: slotPos.x, z: slotPos.z },
      { x: 0, z: slotPos.z },
      { x: 0, z: 0 },
      { x: -3, z: 1 },
      { x: -3, z: 3 },
      { x: -3, z: 35 },
    ]

    car.setPath(exitPath, { speed: 5 })
    leavingCars.push(car)
    car.onArrive = () => {
      scene.remove(car.mesh)
      gates.exit.lowerBarrier()
      const idx = leavingCars.indexOf(car)
      if (idx !== -1) leavingCars.splice(idx, 1)
      state.money += fee
      if (onFeeCollected) onFeeCollected(fee)
    }

    return { car, fee }
  }

  function update(delta) {
    queue.forEach(c => c.update(delta))
    if (processingCar) processingCar.update(delta)
    leavingCars.forEach(c => c.update(delta))

    if (!processingCar) processNext()
  }

  return {
    addCar,
    update,
    startCarLeaving,
    get queueLength() { return queue.length },
    get isProcessing() { return !!processingCar },
  }
}
