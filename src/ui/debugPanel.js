import { DialStore, resolveDialValues } from 'dialkit/store'

const PANEL_ID = 'game-tuning'

const CONFIG = {
  spawning: {
    _collapsed: true,
    spawnMultiplier: [1.0, 0.1, 5.0, 0.1],
    difficultyRamp: [0.4, 0.0, 2.0, 0.05],
  },
  timing: {
    _collapsed: true,
    realSecPer2GameHours: [3, 0.5, 30, 0.5],
    baseParkingMinutes: [120, 30, 600, 10],
    parkingShrinkPerLevel: [12, 0, 30, 1],
    escapeThreshold: [240, 60, 600, 30],
    ticketedLeaveDelay: [120, 30, 600, 30],
  },
  economy: {
    _collapsed: true,
    startingMoney: [50, 0, 500, 10],
    baseFee: [10, 1, 100, 1],
    feePerDifficulty: [2, 0, 20, 1],
    ticketBase: [25, 5, 200, 5],
    ticketPerDifficulty: [5, 0, 30, 1],
  },
  gate: {
    _collapsed: true,
    breakChance: [0.002, 0, 0.05, 0.001],
    breakDifficultyScale: [0.3, 0, 2, 0.1],
  },
}

export function createDebugPanel() {
  DialStore.registerPanel(PANEL_ID, 'Game Tuning', CONFIG, null, {
    persist: true,
    retainOnUnmount: true,
  })

  return {
    getValues() {
      const flat = DialStore.getValues(PANEL_ID)
      return resolveDialValues(CONFIG, flat)
    },
    destroy() {
      DialStore.unregisterPanel(PANEL_ID)
    },
  }
}
