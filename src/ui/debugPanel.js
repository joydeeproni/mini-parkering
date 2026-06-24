import { DialStore, resolveDialValues } from 'dialkit/store'
import 'dialkit/styles.css'

const PANEL_ID = 'game-tuning'

const CONFIG = {
  spawning: {
    _collapsed: true,
    spawnMultiplier: [1.0, 0.1, 5.0, 0.1],
    difficultyRamp: [0.4, 0.0, 2.0, 0.05],
  },
  timing: {
    _collapsed: true,
    realSecPer2GameHours: [3, 0.5, 30, 0.5],
    baseParkingMinutes: [120, 30, 600, 10],
    parkingShrinkPerLevel: [12, 0, 30, 1],
    escapeThreshold: [240, 60, 600, 30],
    ticketedLeaveDelay: [120, 30, 600, 30],
  },
  economy: {
    _collapsed: true,
    startingMoney: [50, 0, 500, 10],
    baseFee: [10, 1, 100, 1],
    feePerDifficulty: [2, 0, 20, 1],
    ticketBase: [25, 5, 200, 5],
    ticketPerDifficulty: [5, 0, 30, 1],
  },
  gate: {
    _collapsed: true,
    breakChance: [0.002, 0, 0.05, 0.001],
    breakDifficultyScale: [0.3, 0, 2, 0.1],
  },
}

let panel = null
let unsubscribe = null

export function createDebugPanel() {
  DialStore.registerPanel(PANEL_ID, 'Game Tuning', CONFIG, null, {
    persist: true,
    retainOnUnmount: true,
  })

  buildUI()

  unsubscribe = DialStore.subscribe(PANEL_ID, () => {
    updateUIValues()
  })

  return {
    getValues() {
      const flat = DialStore.getValues(PANEL_ID)
      return resolveDialValues(CONFIG, flat)
    },
    destroy() {
      if (unsubscribe) unsubscribe()
      if (panel) panel.remove()
      DialStore.unregisterPanel(PANEL_ID)
    },
  }
}

function buildUI() {
  panel = document.createElement('div')
  panel.className = 'debug-panel'
  panel.innerHTML = `<div class="debug-header">
    <span>TUNING</span>
    <button class="debug-toggle">-</button>
  </div>
  <div class="debug-body"></div>`

  const toggle = panel.querySelector('.debug-toggle')
  const body = panel.querySelector('.debug-body')
  toggle.addEventListener('click', () => {
    body.style.display = body.style.display === 'none' ? 'block' : 'none'
    toggle.textContent = body.style.display === 'none' ? '+' : '-'
  })

  buildControls(body, CONFIG, '')

  const resetBtn = document.createElement('button')
  resetBtn.className = 'debug-reset'
  resetBtn.textContent = 'RESET ALL'
  resetBtn.addEventListener('click', () => {
    DialStore.resetValues(PANEL_ID)
  })
  body.appendChild(resetBtn)

  document.body.appendChild(panel)
}

function buildControls(container, config, prefix) {
  for (const [key, value] of Object.entries(config)) {
    if (key === '_collapsed') continue
    const path = prefix ? `${prefix}.${key}` : key

    if (Array.isArray(value) && typeof value[0] === 'number') {
      const row = document.createElement('div')
      row.className = 'debug-row'
      const label = formatLabel(key)
      const [def, min, max, step] = value
      row.innerHTML = `
        <label>${label}</label>
        <input type="range" min="${min}" max="${max}" step="${step}" data-path="${path}">
        <span class="debug-value" data-path-display="${path}">${def}</span>`
      const slider = row.querySelector('input')
      const display = row.querySelector('span')

      slider.value = DialStore.getValue(PANEL_ID, path) ?? def
      display.textContent = slider.value

      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value)
        DialStore.updateValue(PANEL_ID, path, v)
        display.textContent = v
      })
      container.appendChild(row)
    } else if (typeof value === 'object' && value !== null) {
      const folder = document.createElement('details')
      const collapsed = value._collapsed ?? false
      if (!collapsed) folder.open = true
      folder.innerHTML = `<summary class="debug-folder">${formatLabel(key)}</summary>`
      const inner = document.createElement('div')
      inner.className = 'debug-folder-body'
      buildControls(inner, value, path)
      folder.appendChild(inner)
      container.appendChild(folder)
    }
  }
}

function updateUIValues() {
  if (!panel) return
  const values = DialStore.getValues(PANEL_ID)
  panel.querySelectorAll('input[data-path]').forEach(slider => {
    const path = slider.dataset.path
    if (values[path] !== undefined) {
      slider.value = values[path]
      const display = panel.querySelector(`[data-path-display="${path}"]`)
      if (display) display.textContent = values[path]
    }
  })
}

function formatLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
}
