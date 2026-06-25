import { getUpgradeCost, buyUpgrade } from '../game/upgrades.js'

const UPGRADES = [
  { key: 'gateReliability', icon: 'fa-solid fa-wrench', name: 'Gate' },
  { key: 'queueCapacity', icon: 'fa-solid fa-car-side', name: 'Queue' },
  { key: 'warden', icon: 'fa-solid fa-shield-halved', name: 'Warden' },
  { key: 'tow', icon: 'fa-solid fa-truck-pickup', name: 'Tow' },
]

export function createUpgradeBar(state) {
  const bar = document.getElementById('upgrade-bar')
  bar.classList.add('hidden')
  let buttons = []

  function build() {
    bar.innerHTML = ''
    buttons = []

    for (const upgrade of UPGRADES) {
      const btn = document.createElement('button')
      btn.className = 'upgrade-btn'

      const icon = document.createElement('i')
      icon.className = upgrade.icon
      btn.appendChild(icon)

      const costLabel = document.createElement('span')
      costLabel.className = 'upgrade-cost'
      btn.appendChild(costLabel)

      btn.addEventListener('click', () => {
        const cost = getUpgradeCost(upgrade.key, state)
        if (cost !== null && state.money >= cost) {
          buyUpgrade(upgrade.key, state)
          refresh()
        }
      })

      bar.appendChild(btn)
      buttons.push({ btn, costLabel, key: upgrade.key })
    }
    refresh()
  }

  function refresh() {
    for (const { btn, costLabel, key } of buttons) {
      const cost = getUpgradeCost(key, state)
      const level = state.upgrades[key] ?? 0

      btn.classList.remove('cant-afford', 'maxed')

      const oldLevel = btn.querySelector('.upgrade-level')
      if (oldLevel) oldLevel.remove()

      if (level > 0) {
        const lvl = document.createElement('span')
        lvl.className = 'upgrade-level'
        lvl.textContent = level
        btn.appendChild(lvl)
      }

      if (cost === null) {
        btn.classList.add('maxed')
        costLabel.textContent = 'Max'
      } else {
        costLabel.textContent = `$${cost}`
        if (state.money < cost) {
          btn.classList.add('cant-afford')
        }
      }
    }
  }

  function show() {
    bar.classList.remove('hidden')
    build()
  }

  function hide() {
    bar.classList.add('hidden')
  }

  function update() {
    if (bar.classList.contains('hidden')) return
    refresh()
  }

  return { show, hide, update }
}
