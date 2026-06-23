import * as THREE from 'three'

export function createCarTimers(parkingManager, lot, raycasterUtil) {
  const overlay = document.getElementById('ui-overlay')
  const container = document.createElement('div')
  container.className = 'car-timers-container'
  overlay.appendChild(container)

  let timerEls = []

  function update() {
    // Remove old timers
    timerEls.forEach(el => el.remove())
    timerEls = []

    const slots = parkingManager.slots
    const positions = lot.slotPositions

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (!slot.car) continue

      const pos = positions[i]
      if (!pos) continue

      const screen = raycasterUtil.projectToScreen(
        new THREE.Vector3(pos.x, 2.2, pos.z)
      )

      const el = document.createElement('div')

      if (slot.timerRemaining > 0) {
        const mins = Math.ceil(slot.timerRemaining)
        const h = Math.floor(mins / 60)
        const m = mins % 60
        el.className = 'car-timer'
        el.textContent = h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`
      } else {
        const mins = Math.ceil(slot.overstayTime)
        el.className = 'car-timer overtime'
        el.textContent = `+${mins}m`
        if (slot.ticketed) {
          el.classList.add('ticketed')
          el.textContent = `🎫 +${mins}m`
        }
      }

      el.style.left = `${screen.x}px`
      el.style.top = `${screen.y}px`
      container.appendChild(el)
      timerEls.push(el)
    }
  }

  return { update }
}
