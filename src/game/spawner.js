import { GAME_HOURS_PER_REAL_SECOND } from './clock.js'

const SPAWN_RATES = [
  // [startHour, endHour, carsPerGameHour]
  [0, 5, 0],
  [5, 7, 2],
  [7, 9, 8],     // morning rush
  [9, 11, 4],
  [11, 13, 7],   // lunch rush
  [13, 17, 4],
  [17, 19, 8],   // evening rush
  [19, 21, 3],
  [21, 24, 1],
]

function getSpawnRate(gameHour, difficulty) {
  let base = 0
  for (const [start, end, rate] of SPAWN_RATES) {
    if (gameHour >= start && gameHour < end) {
      base = rate
      break
    }
  }
  return base * (1 + (difficulty - 1) * 0.25)
}

export function createSpawner(state, queueManager) {
  let spawnAccumulator = 0

  function update(delta) {
    if (!state.isRunning || state.isPaused) return

    const rate = getSpawnRate(state.gameHour, state.difficulty)
    if (rate === 0) return

    // Convert rate from cars/game-hour to cars/real-second
    const carsPerRealSecond = rate * GAME_HOURS_PER_REAL_SECOND

    spawnAccumulator += carsPerRealSecond * delta

    while (spawnAccumulator >= 1) {
      spawnAccumulator -= 1
      const success = queueManager.addCar()
      if (!success) {
        // Queue overflow — game over!
        state.isGameOver = true
        state.isRunning = false
        return
      }
    }
  }

  return { update }
}
