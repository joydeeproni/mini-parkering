import * as THREE from 'three'

export function createCarPopup(state, parkingManager, raycasterUtil, lot) {
  const overlay = document.getElementById('ui-overlay')
  let popupEl = null
  let activeSlotIndex = null

  function show(slotIndex) {
    hide()
    activeSlotIndex = slotIndex
    const slot = parkingManager.slots[slotIndex]
    if (!slot || !slot.car) return

    const isOverstaying = slot.timerRemaining <= 0

    popupEl = document.createElement('div')
    popupEl.className = 'car-popup'

    // Timer display
    const timerDiv = document.createElement('div')
    timerDiv.className = 'car-popup-timer'
    if (isOverstaying) {
      const mins = Math.ceil(slot.overstayTime)
      timerDiv.textContent = `OVERTIME +${mins}m`
      timerDiv.classList.add('overtime')
    } else {
      const mins = Math.ceil(slot.timerRemaining)
      const h = Math.floor(mins / 60)
      const m = mins % 60
      timerDiv.textContent = `${h}h ${m}m left`
    }
    popupEl.appendChild(timerDiv)

    if (slot.ticketed) {
      const badge = document.createElement('div')
      badge.className = 'car-popup-badge'
      badge.textContent = 'TICKETED'
      popupEl.appendChild(badge)
    }

    const btnRow = document.createElement('div')
    btnRow.className = 'car-popup-btns'

    if (isOverstaying && !slot.ticketed) {
      const ticketBtn = document.createElement('button')
      ticketBtn.className = 'popup-btn ticket'
      ticketBtn.textContent = `Ticket $${parkingManager.getTicketFee()}`
      ticketBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        parkingManager.ticketCar(slotIndex)
        show(slotIndex) // refresh to show badge
      })
      btnRow.appendChild(ticketBtn)
    }

    const extendBtn = document.createElement('button')
    extendBtn.className = 'popup-btn extend'
    extendBtn.textContent = 'Extend +1h ($15)'
    extendBtn.disabled = state.money < 15
    extendBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      parkingManager.extendParking(slotIndex)
      show(slotIndex) // refresh
    })
    btnRow.appendChild(extendBtn)

    popupEl.appendChild(btnRow)
    overlay.appendChild(popupEl)
    updatePosition()
  }

  function hide() {
    if (popupEl) {
      popupEl.remove()
      popupEl = null
    }
    activeSlotIndex = null
  }

  function updatePosition() {
    if (popupEl === null || activeSlotIndex === null) return
    const slotPos = lot.slotPositions[activeSlotIndex]
    if (!slotPos) return

    const screen = raycasterUtil.projectToScreen(
      new THREE.Vector3(slotPos.x, 1.5, slotPos.z)
    )
    popupEl.style.left = `${screen.x}px`
    popupEl.style.top = `${screen.y - 60}px`
  }

  function update() {
    if (popupEl === null || activeSlotIndex === null) return
    // Dismiss if the car has left
    const slot = parkingManager.slots[activeSlotIndex]
    if (!slot || !slot.car) {
      hide()
      return
    }
    updatePosition()
  }

  return { show, hide, update, get activeSlotIndex() { return activeSlotIndex } }
}
