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

    const progressDiv = document.createElement('div')
    progressDiv.className = 'car-popup-progress'
    if (!isOverstaying && slot.initialDuration > 0) {
      const frac = slot.timerRemaining / slot.initialDuration
      progressDiv.style.width = `${Math.max(0, Math.min(100, frac * 100))}%`
    } else {
      progressDiv.style.width = '0%'
    }
    popupEl.appendChild(progressDiv)

    const timerDiv = document.createElement('div')
    timerDiv.className = 'car-popup-timer'
    if (isOverstaying) {
      const mins = Math.ceil(slot.overstayTime)
      timerDiv.textContent = `${mins} sec left`
      timerDiv.classList.add('overtime')
    } else {
      const mins = Math.ceil(slot.timerRemaining)
      const h = Math.floor(mins / 60)
      const m = mins % 60
      timerDiv.textContent = h > 0 ? `${h}h ${m}m left` : `${m}m left`
    }
    popupEl.appendChild(timerDiv)

    const btnRow = document.createElement('div')
    btnRow.className = 'car-popup-btns'

    if (isOverstaying) {
      if (slot.ticketed) {
        const ticketedBtn = document.createElement('button')
        ticketedBtn.className = 'popup-btn ticketed'
        ticketedBtn.textContent = 'Ticketed!'
        ticketedBtn.disabled = true
        btnRow.appendChild(ticketedBtn)
      } else {
        const ticketBtn = document.createElement('button')
        ticketBtn.className = 'popup-btn ticket'
        ticketBtn.textContent = `Ticket +$${parkingManager.getTicketFee()}`
        ticketBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          parkingManager.ticketCar(slotIndex)
          show(slotIndex)
        })
        btnRow.appendChild(ticketBtn)
      }
    }

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
    const slot = parkingManager.slots[activeSlotIndex]
    if (!slot || !slot.car) {
      hide()
      return
    }
    updatePosition()
  }

  return { show, hide, update, get activeSlotIndex() { return activeSlotIndex } }
}
