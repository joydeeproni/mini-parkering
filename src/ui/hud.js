export function createHUD(state, gameClock, queueManager) {
  const moneyEl = document.getElementById('hud-money')
  const dayEl = document.getElementById('hud-day')
  const queueEl = document.getElementById('hud-queue')
  const overlay = document.getElementById('ui-overlay')

  function update() {
    moneyEl.textContent = `$${state.money}`
    dayEl.textContent = `Day ${state.dayCount}`

    if (state.money < 0) {
      moneyEl.classList.add('negative')
    } else {
      moneyEl.classList.remove('negative')
    }

    const queueCount = queueManager ? queueManager.queueLength : 0
    queueEl.textContent = `${queueCount} car${queueCount !== 1 ? 's' : ''} waiting`
  }

  function showFeePopup(screenX, screenY, amount) {
    const el = document.createElement('div')
    el.className = amount >= 0 ? 'fee-popup' : 'fee-popup penalty'
    el.textContent = amount >= 0 ? `+$${amount}` : `-$${Math.abs(amount)}`
    el.style.left = `${screenX}px`
    el.style.top = `${screenY}px`
    overlay.appendChild(el)
    setTimeout(() => el.remove(), 1500)
  }

  return { update, showFeePopup }
}
