export function createHUD(state, gameClock) {
  const moneyEl = document.getElementById('hud-money')
  const timeEl = document.getElementById('hud-time')
  const dayEl = document.getElementById('hud-day')
  const overlay = document.getElementById('ui-overlay')

  function update() {
    moneyEl.textContent = `$${state.money}`
    timeEl.textContent = gameClock.getTimeString()
    dayEl.textContent = `Day ${state.dayCount}`

    if (state.money < 0) moneyEl.style.color = '#ef4444'
    else moneyEl.style.color = '#4ade80'
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
