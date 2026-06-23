export function createStartScreen(state, onPlay) {
  const overlay = document.getElementById('ui-overlay')
  let el = null

  function show() {
    el = document.createElement('div')
    el.className = 'start-screen'
    el.innerHTML = `
      <div class="start-title">
        <div class="title-badge">P</div>
        <h1>MINI<br>PARKERING</h1>
      </div>
      <div class="start-buttons">
        <button class="start-btn play">Play</button>
        <button class="start-btn highscore">Highscore: $${state.highscore}</button>
        <button class="start-btn options">Options</button>
      </div>
    `

    el.querySelector('.play').addEventListener('click', () => {
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
