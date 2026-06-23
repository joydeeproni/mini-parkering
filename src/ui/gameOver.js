import { saveHighscore } from '../game/state.js'

export function createGameOver(state, onRestart) {
  const overlay = document.getElementById('ui-overlay')
  let el = null

  function show() {
    saveHighscore(state)

    el = document.createElement('div')
    el.className = 'gameover-screen'
    el.innerHTML = `
      <h1>GAME OVER</h1>
      <div class="gameover-reason">Queue overflow!</div>
      <div class="gameover-score">Score: $${Math.max(0, state.money)}</div>
      <div class="gameover-high">Best: $${state.highscore}</div>
      <div class="gameover-stats">
        <div>Day ${state.dayCount}</div>
        <div>Difficulty ${state.difficulty}</div>
      </div>
      <button class="start-btn play">Play Again</button>
    `

    el.querySelector('.play').addEventListener('click', () => {
      hide()
      onRestart()
    })

    overlay.appendChild(el)
  }

  function hide() {
    if (el) { el.remove(); el = null }
  }

  return { show, hide }
}
