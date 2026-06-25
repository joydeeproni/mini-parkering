const LEVEL_CONFIGS = [
  { rows: 3, cols: 2, queueCap: 5 },   // Level 1
  { rows: 3, cols: 3, queueCap: 6 },   // Level 2
  { rows: 4, cols: 3, queueCap: 7 },   // Level 3
  { rows: 4, cols: 4, queueCap: 8 },   // Level 4
  { rows: 5, cols: 4, queueCap: 10 },  // Level 5+
]

function getLevelConfig(difficulty) {
  const index = Math.min(difficulty - 1, LEVEL_CONFIGS.length - 1)
  return LEVEL_CONFIGS[Math.max(0, index)]
}

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
    bestDays: parseInt(localStorage.getItem('miniParkering_bestDays') || '1'),
    upgrades: {
      gateReliability: 0,
      extraQueueSlots: 0,
    },
    wardenActive: false,
    wardenTimer: 0,
    towActive: false,
    towTimer: 0,
    gateBroken: false,
    gateBreakTimer: 0,
    cars: [],
    queue: [],
    activeCar: null,
  }
}

export function saveHighscore(state) {
  if (state.money > state.highscore) {
    state.highscore = state.money
    state.bestDays = state.dayCount
    localStorage.setItem('miniParkering_highscore', String(state.money))
    localStorage.setItem('miniParkering_bestDays', String(state.dayCount))
  }
}

export function getBaseRows(state) { return getLevelConfig(state.difficulty).rows }
export function getBaseCols(state) { return getLevelConfig(state.difficulty).cols }
export function getQueueCapacity(state) {
  return getLevelConfig(state.difficulty).queueCap + state.upgrades.extraQueueSlots * 2
}
