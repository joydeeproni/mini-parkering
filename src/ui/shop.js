import { getUpgradeCost, buyUpgrade } from '../game/upgrades.js'
import { getBaseRows, getBaseCols, getQueueCapacity } from '../game/state.js'

const UPGRADES = [
  { key: 'gateReliability', name: 'Gate Reliability', desc: 'Breaks less often', icon: '🔧' },
  { key: 'queueCapacity', name: 'Queue Capacity', desc: '+2 queue slots', icon: '🚗' },
  { key: 'warden', name: 'Parking Warden', desc: 'Auto-ticket 5 game-min', icon: '👮' },
  { key: 'tow', name: 'Auto-Tow', desc: 'Instant tow 5 game-min', icon: '🚛' },
]

export function createShop(state, parkingManager, lot, building) {
  const overlay = document.getElementById('ui-overlay')
  let shopEl = null
  let isOpen = false

  function open() {
    if (shopEl) return
    isOpen = true
    state.isPaused = true

    shopEl = document.createElement('div')
    shopEl.className = 'shop-overlay'

    const title = document.createElement('h2')
    title.textContent = 'Upgrade Shop'
    shopEl.appendChild(title)

    const info = document.createElement('div')
    info.className = 'shop-info'
    info.textContent = `Level ${state.difficulty} | Lot: ${getBaseRows(state) * getBaseCols(state) * 2} slots | Queue: ${getQueueCapacity(state)} | Gate: ${state.upgrades.gateReliability + 1}/5`
    shopEl.appendChild(info)

    const grid = document.createElement('div')
    grid.className = 'shop-grid'

    for (const upgrade of UPGRADES) {
      const cost = getUpgradeCost(upgrade.key, state)
      const card = document.createElement('div')
      card.className = 'shop-card'

      if (cost === null) {
        card.classList.add('maxed')
        card.innerHTML = `
          <div class="shop-icon">${upgrade.icon}</div>
          <div class="shop-name">${upgrade.name}</div>
          <div class="shop-desc">MAX LEVEL</div>
        `
      } else {
        const canAfford = state.money >= cost
        if (!canAfford) card.classList.add('cant-afford')
        card.innerHTML = `
          <div class="shop-icon">${upgrade.icon}</div>
          <div class="shop-name">${upgrade.name}</div>
          <div class="shop-desc">${upgrade.desc}</div>
          <div class="shop-cost">$${cost}</div>
        `
        card.addEventListener('click', () => {
          if (buyUpgrade(upgrade.key, state)) {
            close()
            open()
          }
        })
      }

      grid.appendChild(card)
    }

    shopEl.appendChild(grid)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'shop-close'
    closeBtn.textContent = 'Close'
    closeBtn.addEventListener('click', close)
    shopEl.appendChild(closeBtn)

    overlay.appendChild(shopEl)
  }

  function close() {
    if (shopEl) {
      shopEl.remove()
      shopEl = null
    }
    isOpen = false
    state.isPaused = false
  }

  return { open, close, get isOpen() { return isOpen } }
}
