import { saveHighscore } from '../game/state.js'

export function createGameOver(state, onRestart) {
  const overlay = document.getElementById('ui-overlay')
  let el = null

  function show() {
    saveHighscore(state)

    el = document.createElement('div')
    el.className = 'gameover-screen'
    el.innerHTML = `
      <div class="gameover-top">
        <h1>Overload</h1>
        <div class="gameover-reason">Your parking lot is<br>overloaded, but you made</div>
      </div>
      <div class="gameover-bottom">
        <div class="gameover-score">$${Math.max(0, state.money)} in ${state.dayCount} days</div>
        <div class="gameover-stats">
          <div>Best $${state.highscore}</div>
          <div>Day ${state.dayCount}</div>
        </div>
        <button class="gameover-play">Play again</button>
      </div>
    `

    el.querySelector('.gameover-play').addEventListener('click', () => {
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
