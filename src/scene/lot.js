import * as THREE from 'three'
import { getBaseRows, getBaseCols } from '../game/state.js'

const SLOT_WIDTH = 3.4
const SLOT_DEPTH = 5.0
const LANE_WIDTH = 3.5
const LOT_PADDING = 1.5

function createPText() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = 'bold 48px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('P', 32, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.LinearFilter
  return tex
}

function createArrowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  // Arrow pointing up (toward lot back)
  ctx.beginPath()
  ctx.moveTo(16, 4)
  ctx.lineTo(28, 24)
  ctx.lineTo(20, 24)
  ctx.lineTo(20, 58)
  ctx.lineTo(12, 58)
  ctx.lineTo(12, 24)
  ctx.lineTo(4, 24)
  ctx.closePath()
  ctx.fill()
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.LinearFilter
  return tex
}

let pTexture = null
let arrowTexture = null

export function createParkingLot(scene, state) {
  const group = new THREE.Group()
  scene.add(group)

  let slotPositions = []
  let currentState = state

  function setState(newState) {
    currentState = newState
  }

  function rebuildLot() {
    const state = currentState
    while (group.children.length) group.remove(group.children[0])
    slotPositions = []

    if (!pTexture) pTexture = createPText()
    if (!arrowTexture) arrowTexture = createArrowTexture()

    const rows = getBaseRows(state)
    const cols = getBaseCols(state)

    const lotWidth = cols * SLOT_WIDTH * 2 + LANE_WIDTH + LOT_PADDING * 2
    const lotDepth = rows * SLOT_DEPTH + LOT_PADDING * 2

    // Surface
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(lotWidth, lotDepth),
      new THREE.MeshLambertMaterial({ color: 0x8a8578 })
    )
    surface.rotation.x = -Math.PI / 2
    surface.position.set(0, 0.01, -lotDepth / 2 + LOT_PADDING)
    surface.receiveShadow = true
    surface.name = 'lotSurface'
    group.add(surface)

    // Curb
    const curbGeo = new THREE.BoxGeometry(lotWidth + 0.3, 0.15, lotDepth + 0.3)
    const curb = new THREE.Mesh(curbGeo, new THREE.MeshLambertMaterial({ color: 0xb8b2a8 }))
    curb.position.set(0, 0.075, -lotDepth / 2 + LOT_PADDING)
    group.add(curb)

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf0ece4 })
    const lineY = 0.02

    const leftEdge = -LANE_WIDTH / 2
    const rightEdge = LANE_WIDTH / 2
    const blockWidth = cols * SLOT_WIDTH

    // Slot positions + P markings
    const pMat = new THREE.MeshBasicMaterial({ map: pTexture, transparent: true })

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const lx = -LANE_WIDTH / 2 - (col + 0.5) * SLOT_WIDTH
        const lz = -row * SLOT_DEPTH - SLOT_DEPTH / 2
        slotPositions.push({ x: lx, z: lz, row, col, side: 'left' })

        const rx = LANE_WIDTH / 2 + (col + 0.5) * SLOT_WIDTH
        const rz = -row * SLOT_DEPTH - SLOT_DEPTH / 2
        slotPositions.push({ x: rx, z: rz, row, col, side: 'right' })

        // P symbol in each slot
        for (const sx of [lx, rx]) {
          const pPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(SLOT_WIDTH * 0.7, SLOT_DEPTH * 0.7),
            pMat
          )
          pPlane.rotation.x = -Math.PI / 2
          pPlane.position.set(sx, lineY + 0.001, lz)
          group.add(pPlane)
        }
      }
    }

    // Vertical grid lines — left block
    for (let c = 0; c <= cols; c++) {
      const x = leftEdge - c * SLOT_WIDTH
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, rows * SLOT_DEPTH),
        lineMat
      )
      line.rotation.x = -Math.PI / 2
      line.position.set(x, lineY, -rows * SLOT_DEPTH / 2)
      group.add(line)
    }

    // Vertical grid lines — right block
    for (let c = 0; c <= cols; c++) {
      const x = rightEdge + c * SLOT_WIDTH
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, rows * SLOT_DEPTH),
        lineMat
      )
      line.rotation.x = -Math.PI / 2
      line.position.set(x, lineY, -rows * SLOT_DEPTH / 2)
      group.add(line)
    }

    // Horizontal grid lines — both blocks
    for (let r = 0; r <= rows; r++) {
      const z = -r * SLOT_DEPTH

      const hLineL = new THREE.Mesh(
        new THREE.PlaneGeometry(blockWidth, 0.08),
        lineMat
      )
      hLineL.rotation.x = -Math.PI / 2
      hLineL.position.set(leftEdge - blockWidth / 2, lineY, z)
      group.add(hLineL)

      const hLineR = new THREE.Mesh(
        new THREE.PlaneGeometry(blockWidth, 0.08),
        lineMat
      )
      hLineR.rotation.x = -Math.PI / 2
      hLineR.position.set(rightEdge + blockWidth / 2, lineY, z)
      group.add(hLineR)
    }

    // Lane center dashes
    for (let i = 0; i < rows * 2; i++) {
      const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.8),
        lineMat
      )
      dash.rotation.x = -Math.PI / 2
      dash.position.set(0, lineY, -i * SLOT_DEPTH / 2 - 0.5)
      group.add(dash)
    }

    // Lane edge lines (yellow)
    const laneLineMat = new THREE.MeshBasicMaterial({ color: 0xe0c878 })
    for (const x of [leftEdge, rightEdge]) {
      const laneLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, rows * SLOT_DEPTH + LOT_PADDING),
        laneLineMat
      )
      laneLine.rotation.x = -Math.PI / 2
      laneLine.position.set(x, lineY, -rows * SLOT_DEPTH / 2)
      group.add(laneLine)
    }

    // Directional arrows in the lane
    const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTexture, transparent: true })
    for (let i = 0; i < Math.min(rows, 3); i++) {
      const arrow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 2.4),
        arrowMat
      )
      arrow.rotation.x = -Math.PI / 2
      arrow.position.set(0, lineY + 0.001, -SLOT_DEPTH * (i + 0.5))
      group.add(arrow)
    }
  }

  rebuildLot()
  return { group, get slotPositions() { return slotPositions }, rebuildLot, setState }
}

export { SLOT_WIDTH, SLOT_DEPTH, LANE_WIDTH, LOT_PADDING }
