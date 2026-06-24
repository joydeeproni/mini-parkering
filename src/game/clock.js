let REAL_SECONDS_PER_2_GAME_HOURS = 3
let GAME_HOURS_PER_REAL_SECOND = 2 / REAL_SECONDS_PER_2_GAME_HOURS

export function createGameClock(state, getTuning) {
  return {
    update(deltaSec) {
      if (!state.isRunning || state.isPaused) return

      if (getTuning) {
        const t = getTuning()
        REAL_SECONDS_PER_2_GAME_HOURS = t.timing.realSecPer2GameHours
        GAME_HOURS_PER_REAL_SECOND = 2 / REAL_SECONDS_PER_2_GAME_HOURS
      }

      const gameHoursDelta = deltaSec * GAME_HOURS_PER_REAL_SECOND
      state.gameHour += gameHoursDelta

      if (state.gameHour >= 24) {
        state.gameHour -= 24
        state.dayCount++
        state.difficulty = state.dayCount
      }

      if (state.wardenActive) {
        state.wardenTimer -= gameHoursDelta * 60
        if (state.wardenTimer <= 0) {
          state.wardenActive = false
          state.wardenTimer = 0
        }
      }

      if (state.towActive) {
        state.towTimer -= gameHoursDelta * 60
        if (state.towTimer <= 0) {
          state.towActive = false
          state.towTimer = 0
        }
      }
    },

    getTimeString() {
      const h = Math.floor(state.gameHour)
      const m = Math.floor((state.gameHour - h) * 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    },

    getDayProgress() {
      return state.gameHour / 24
    },

    gameMinutesToReal(gameMinutes) {
      return gameMinutes / (GAME_HOURS_PER_REAL_SECOND * 60)
    }
  }
}

export { GAME_HOURS_PER_REAL_SECOND }
