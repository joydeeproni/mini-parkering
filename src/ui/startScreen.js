export function createStartScreen(state, onPlay) {
  const overlay = document.getElementById('ui-overlay')
  let el = null

  function show() {
    el = document.createElement('div')
    el.className = 'start-screen'
    el.innerHTML = `
      <div class="start-top">
        <h1>Mini<br>Parkering</h1>
        <div class="start-subtitle">Issue tickets as much as possible</div>
      </div>
      <div class="start-bottom">
        <div class="start-best-label">Best you did is</div>
        <div class="start-best-score">$${state.highscore} in ${state.bestDays || 1} days</div>
        <button class="start-play">Play</button>
      </div>
    `

    el.querySelector('.start-play').addEventListener('click', () => {
      hide()
      onPlay()
    })

    overlay.appendChild(el)
  }

  function hide() {
    if (el) { el.remove(); el = null }
  }

  return { show, hide }
}
