import * as THREE from 'three'

export function createGateAlert(state, raycasterUtil, gate) {
  const overlay = document.getElementById('ui-overlay')
  let alertEl = null

  function show() {
    if (alertEl) return
    alertEl = document.createElement('div')
    alertEl.className = 'gate-alert'
    alertEl.innerHTML = '⚠️ Gate broken<br><span>Tap to fix</span>'
    alertEl.addEventListener('click', () => {
      state.gateBroken = false
      hide()
    })
    overlay.appendChild(alertEl)
  }

  function hide() {
    if (alertEl) {
      alertEl.remove()
      alertEl = null
    }
  }

  function update() {
    if (state.gateBroken) {
      show()
      // Position near gate
      const screen = raycasterUtil.projectToScreen(
        new THREE.Vector3(gate.group.position.x, 3, gate.group.position.z)
      )
      if (alertEl) {
        alertEl.style.left = `${screen.x}px`
        alertEl.style.top = `${screen.y - 30}px`
      }
    } else {
      hide()
    }
  }

  return { update }
}
