import * as THREE from 'three'

export function createCarTimers(parkingManager, lot, raycasterUtil) {
  const overlay = document.getElementById('ui-overlay')
  const container = document.createElement('div')
  container.className = 'car-timers-container'
  overlay.appendChild(container)

  let timerEls = []

  function update() {
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

      const bar = document.createElement('div')
      bar.className = 'car-timer-bar'

      const fill = document.createElement('div')
      fill.className = 'car-timer-fill'

      if (slot.timerRemaining > 0 && slot.initialDuration > 0) {
        const frac = slot.timerRemaining / slot.initialDuration
        fill.style.width = `${Math.max(0, Math.min(100, frac * 100))}%`

        if (frac > 0.5) {
          fill.classList.add('ok')
          slot.car.setGlow(0x6bbd6b, 0.25)
        } else if (frac > 0.25) {
          fill.classList.add('warn')
          slot.car.setGlow(0xe8a840, 0.35)
        } else {
          fill.classList.add('danger')
          slot.car.setGlow(0xe05050, 0.45)
        }

        if (frac <= 0.15) bar.classList.add('needs-action')
      } else if (slot.timerRemaining <= 0) {
        fill.style.width = '100%'
        fill.classList.add('overtime')
        bar.classList.add('needs-action')
        slot.car.setGlow(0xe05050, 0.5)
      }

      bar.appendChild(fill)
      bar.style.left = `${screen.x}px`
      bar.style.top = `${screen.y}px`
      container.appendChild(bar)
      timerEls.push(bar)
    }
  }

  return { update }
}
