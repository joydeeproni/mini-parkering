import { GAME_HOURS_PER_REAL_SECOND } from './clock.js'

export function createParkingManager(state, lot, gates, scene, getTuning) {
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

  function getTuningValues() {
    return getTuning ? getTuning() : null
  }

  function getParkingDuration() {
    const t = getTuningValues()
    const base = t ? t.timing.baseParkingMinutes : 120
    const shrink = t ? t.timing.parkingShrinkPerLevel : 12
    return Math.max(60, base - (state.difficulty - 1) * shrink)
  }

  function assignSlot(car) {
    const emptyIndex = slots.findIndex(s => s.car === null)
    if (emptyIndex === -1) return null

    const duration = getParkingDuration()
    slots[emptyIndex] = {
      car,
      timerRemaining: duration,
      initialDuration: duration,
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
    const t = getTuningValues()
    const base = t ? t.economy.baseFee : 10
    const perDiff = t ? t.economy.feePerDifficulty : 2
    return base + state.difficulty * perDiff
  }

  function getTicketFee() {
    const t = getTuningValues()
    const base = t ? t.economy.ticketBase : 25
    const perDiff = t ? t.economy.ticketPerDifficulty : 5
    return base + state.difficulty * perDiff
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
    slot.timerRemaining += 60
    slot.overstayTime = 0
    return true
  }

  function update(delta) {
    const t = getTuningValues()
    const ESCAPE_THRESHOLD = t ? t.timing.escapeThreshold : 240
    const TICKETED_LEAVE_DELAY = t ? t.timing.ticketedLeaveDelay : 120

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
        slot.overstayTime += gameMinutesDelta

        if (state.wardenActive && !slot.ticketed) {
          ticketCar(i)
        }

        if (!slot.ticketed && slot.overstayTime >= ESCAPE_THRESHOLD) {
          const penalty = getTicketFee()
          state.money -= penalty
          carsToRemove.push({ index: i, escaped: true, fee: -penalty })
        } else if (slot.ticketed && slot.overstayTime >= TICKETED_LEAVE_DELAY) {
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
