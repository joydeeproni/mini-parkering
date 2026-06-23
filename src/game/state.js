export function createGameState() {
  return {
    money: 50,
    gameHour: 7.0,
    dayCount: 1,
    difficulty: 1,
    difficultyTimer: 0,
    isRunning: false,
    isGameOver: false,
    isPaused: false,
    highscore: parseInt(localStorage.getItem('miniParkering_highscore') || '0'),
    upgrades: {
      gateReliability: 0,  // 0-4 (5 levels: 0=base)
      extraRows: 0,
      extraCols: 0,
      extraQueueSlots: 0,
    },
    wardenActive: false,
    wardenTimer: 0,
    towActive: false,
    towTimer: 0,
    gateBroken: false,
    gateBreakTimer: 0,
    cars: [],          // active parked cars
    queue: [],         // cars waiting at gate
    activeCar: null,   // car entering/leaving animation
  }
}

export function saveHighscore(state) {
  if (state.money > state.highscore) {
    state.highscore = state.money
    localStorage.setItem('miniParkering_highscore', String(state.money))
  }
}

export function getBaseRows(state) { return 4 + state.upgrades.extraRows }
export function getBaseCols(state) { return 3 + state.upgrades.extraCols }
export function getQueueCapacity(state) { return 5 + state.upgrades.extraQueueSlots * 2 }
