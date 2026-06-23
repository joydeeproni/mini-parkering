import { GAME_HOURS_PER_REAL_SECOND } from './clock.js'

export function createParkingManager(state, lot, gate, scene) {
  // Each slot: { car, timerRemaining (game-minutes), overstayTime, ticketed, ticketFee }
  let slots = []

  function rebuildSlots() {
    const count = lot.slotPositions.length
    const newSlots = []
    for (let i = 0; i < count; i++) {
      newSlots.push(slots[i] || { car: null, timerRemaining: 0, overstayTime: 0, ticketed: false, ticketFee: 0 })
    }
    slots = newSlots
  }
  rebuildSlots()

  function assignSlot(car) {
    const emptyIndex = slots.findIndex(s => s.car === null)
    if (emptyIndex === -1) return null

    slots[emptyIndex] = {
      car,
      timerRemaining: 120, // 2 game-hours in game-minutes
      overstayTime: 0,
      ticketed: false,
      ticketFee: 0,
    }
    return emptyIndex
  }

  function releaseSlot(index) {
    const slot = slots[index]
    if (!slot || !slot.car) return null
    const car = slot.car
    const fee = slot.ticketed ? slot.ticketFee : getBaseFee()
    slots[index] = { car: null, timerRemaining: 0, overstayTime: 0, ticketed: false, ticketFee: 0 }
    return { car, fee }
  }

  function getBaseFee() {
    return 10 + state.difficulty * 2
  }

  function getTicketFee() {
    return 25 + state.difficulty * 5
  }

  function ticketCar(slotIndex) {
    const slot = slots[slotIndex]
    if (!slot || !slot.car || slot.ticketed) return false
    slot.ticketed = true
    slot.ticketFee = getTicketFee()
    return true
  }

  function extendParking(slotIndex) {
    const slot = slots[slotIndex]
    if (!slot || !slot.car) return false
    if (state.money < 15) return false
    state.money -= 15
    slot.timerRemaining += 60 // +1 game-hour
    slot.overstayTime = 0
    return true
  }

  const ESCAPE_THRESHOLD = 30 // game-minutes before unticketed overstayer escapes
  const TICKETED_LEAVE_DELAY = 10 // game-minutes after ticketed before leaving

  function update(delta) {
    const gameMinutesDelta = delta * GAME_HOURS_PER_REAL_SECOND * 60
    const carsToRemove = []

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (!slot.car) continue

      if (slot.timerRemaining > 0) {
        slot.timerRemaining -= gameMinutesDelta
        if (slot.timerRemaining <= 0) {
          slot.timerRemaining = 0
        }
      } else {
        // Overstaying
        slot.overstayTime += gameMinutesDelta

        // Auto-ticket by warden
        if (state.wardenActive && !slot.ticketed) {
          ticketCar(i)
        }

        if (!slot.ticketed && slot.overstayTime >= ESCAPE_THRESHOLD) {
          // Car escapes! Penalty
          const penalty = getTicketFee()
          state.money -= penalty
          carsToRemove.push({ index: i, escaped: true, fee: -penalty })
        } else if (slot.ticketed && slot.overstayTime >= TICKETED_LEAVE_DELAY) {
          // Ticketed car leaves
          carsToRemove.push({ index: i, escaped: false, fee: slot.ticketFee })
        }
      }
    }

    return carsToRemove
  }

  return {
    assignSlot,
    releaseSlot,
    ticketCar,
    extendParking,
    update,
    rebuildSlots,
    get slots() { return slots },
    getBaseFee,
    getTicketFee,
  }
}
