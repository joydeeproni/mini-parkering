import { GAME_HOURS_PER_REAL_SECOND } from './clock.js'

const SPAWN_RATES = [
  // [startHour, endHour, carsPerGameHour]
  [0, 5, 0],
  [5, 7, 0.5],
  [7, 9, 1.5],   // morning rush (gentle)
  [9, 11, 1],
  [11, 13, 1.5], // lunch rush
  [13, 17, 1],
  [17, 19, 1.5], // evening rush
  [19, 21, 0.5],
  [21, 24, 0.3],
]

function getSpawnRate(gameHour, difficulty, tuning) {
  let base = 0
  for (const [start, end, rate] of SPAWN_RATES) {
    if (gameHour >= start && gameHour < end) {
      base = rate
      break
    }
  }
  const ramp = tuning ? tuning.spawning.difficultyRamp : 0.4
  const mult = tuning ? tuning.spawning.spawnMultiplier : 1.0
  return base * (1 + (difficulty - 1) * ramp) * mult
}

export function createSpawner(state, queueManager, getTuning) {
  let spawnAccumulator = 0

  function update(delta) {
    if (!state.isRunning || state.isPaused) return

    const tuning = getTuning ? getTuning() : null
    const rate = getSpawnRate(state.gameHour, state.difficulty, tuning)
    if (rate === 0) return

    const carsPerRealSecond = rate * GAME_HOURS_PER_REAL_SECOND

    spawnAccumulator += carsPerRealSecond * delta

    while (spawnAccumulator >= 1) {
      spawnAccumulator -= 1
      const success = queueManager.addCar()
      if (!success) {
        state.isGameOver = true
        state.isRunning = false
        return
      }
    }
  }

  return { update }
}
