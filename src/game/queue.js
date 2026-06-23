import { getQueueCapacity } from './state.js'
import { createCar } from '../scene/car.js'

export function createQueueManager(state, road, gate, parkingManager, lot, scene) {
  const queue = []
  let processingCar = null

  function addCar() {
    const capacity = getQueueCapacity(state)
    if (queue.length >= capacity) {
      return false // overflow!
    }
    const car = createCar()
    const queuePos = road.queuePositions[queue.length]
    car.mesh.position.set(queuePos.x, 0, queuePos.z)
    car.mesh.rotation.y = Math.PI // face toward gate
    scene.add(car.mesh)
    queue.push(car)
    return true
  }

  function processNext() {
    if (processingCar || queue.length === 0 || state.gateBroken) return

    const car = queue.shift()
    processingCar = car

    // Reassign queue positions for remaining cars
    queue.forEach((c, i) => {
      const pos = road.queuePositions[i]
      c.setPath([{ x: pos.x, z: pos.z }], { speed: 4 })
    })

    // Try to assign a slot
    const slotIndex = parkingManager.assignSlot(car)
    if (slotIndex === null) {
      // No slots available — car leaves without penalty
      const exitPath = [
        { x: 0, z: 4 },
        { x: 0, z: 30 },
      ]
      car.setPath(exitPath, { speed: 6 })
      car.onArrive = () => {
        scene.remove(car.mesh)
        processingCar = null
      }
      return
    }

    const slotPos = lot.slotPositions[slotIndex]
    gate.liftBarrier()

    // Gate is at z=2 in world space; drive past it then into slot
    const entryPath = [
      { x: 0, z: 3 },   // approach gate
      { x: 0, z: 1 },   // past gate
      { x: 0, z: slotPos.z }, // drive down lane to row
      { x: slotPos.x, z: slotPos.z }, // pull into slot
    ]

    car.setPath(entryPath, { speed: 5 })
    car.onArrive = () => {
      gate.lowerBarrier()
      processingCar = null
    }
  }

  function startCarLeaving(slotIndex, fee, onFeeCollected) {
    const result = parkingManager.releaseSlot(slotIndex)
    if (!result) return null

    const { car } = result
    const slotPos = lot.slotPositions[slotIndex]

    const exitPath = [
      { x: slotPos.x, z: slotPos.z },
      { x: 0, z: slotPos.z },
      { x: 0, z: 1 },
      { x: 0, z: 3 },
      { x: 0, z: 30 },
    ]

    gate.liftBarrier()
    car.setPath(exitPath, { speed: 5 })
    car.onArrive = () => {
      scene.remove(car.mesh)
      gate.lowerBarrier()
      state.money += fee
      if (onFeeCollected) onFeeCollected(fee)
    }

    return { car, fee }
  }

  function update(delta) {
    // Update all queued car animations
    queue.forEach(c => c.update(delta))
    if (processingCar) processingCar.update(delta)

    // Try to process next car if gate is free
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
