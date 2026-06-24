export function getUpgradeCost(type, state) {
  switch (type) {
    case 'gateReliability':
      if (state.upgrades.gateReliability >= 4) return null
      return 50 + state.upgrades.gateReliability * 30
    case 'queueCapacity':
      return 40 + state.upgrades.extraQueueSlots * 20
    case 'warden':
      return 60 + state.difficulty * 10
    case 'tow':
      return 50 + state.difficulty * 10
    default: return null
  }
}

export function buyUpgrade(type, state) {
  const cost = getUpgradeCost(type, state)
  if (cost === null || state.money < cost) return false
  state.money -= cost

  switch (type) {
    case 'gateReliability': state.upgrades.gateReliability++; break
    case 'queueCapacity': state.upgrades.extraQueueSlots++; break
    case 'warden':
      state.wardenActive = true
      state.wardenTimer = 5
      break
    case 'tow':
      state.towActive = true
      state.towTimer = 5
      break
  }
  return true
}
