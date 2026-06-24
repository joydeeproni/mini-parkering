import * as THREE from 'three'
import { getBaseRows, getBaseCols } from '../game/state.js'

const SLOT_WIDTH = 3.4
const SLOT_DEPTH = 5.0
const LANE_WIDTH = 3.5
const LOT_PADDING = 1.5

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

    const rows = getBaseRows(state)
    const cols = getBaseCols(state)

    const lotWidth = cols * SLOT_WIDTH * 2 + LANE_WIDTH + LOT_PADDING * 2
    const lotDepth = rows * SLOT_DEPTH + LOT_PADDING * 2

    // Surface
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(lotWidth, lotDepth),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    )
    surface.rotation.x = -Math.PI / 2
    surface.position.set(0, 0.01, -lotDepth / 2 + LOT_PADDING)
    surface.receiveShadow = true
    surface.name = 'lotSurface'
    group.add(surface)

    // Curb around lot
    const curbGeo = new THREE.BoxGeometry(lotWidth + 0.3, 0.15, lotDepth + 0.3)
    const curb = new THREE.Mesh(curbGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }))
    curb.position.set(0, 0.075, -lotDepth / 2 + LOT_PADDING)
    group.add(curb)

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const lineY = 0.02

    // Left parking block: x from -LANE_WIDTH/2 to -LANE_WIDTH/2 - cols*SLOT_WIDTH
    // Right parking block: x from LANE_WIDTH/2 to LANE_WIDTH/2 + cols*SLOT_WIDTH
    const leftEdge = -LANE_WIDTH / 2
    const leftOuter = leftEdge - cols * SLOT_WIDTH
    const rightEdge = LANE_WIDTH / 2
    const rightOuter = rightEdge + cols * SLOT_WIDTH

    // Slot positions
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const lx = -LANE_WIDTH / 2 - (col + 0.5) * SLOT_WIDTH
        const lz = -row * SLOT_DEPTH - SLOT_DEPTH / 2
        slotPositions.push({ x: lx, z: lz, row, col, side: 'left' })

        const rx = LANE_WIDTH / 2 + (col + 0.5) * SLOT_WIDTH
        const rz = -row * SLOT_DEPTH - SLOT_DEPTH / 2
        slotPositions.push({ x: rx, z: rz, row, col, side: 'right' })
      }
    }

    // --- Grid lines for left block ---
    const blockWidth = cols * SLOT_WIDTH

    // Vertical lines (column dividers) — left block
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

    // Vertical lines (column dividers) — right block
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

    // Horizontal lines (row dividers) — both blocks
    for (let r = 0; r <= rows; r++) {
      const z = -r * SLOT_DEPTH

      // Left block
      const hLineL = new THREE.Mesh(
        new THREE.PlaneGeometry(blockWidth, 0.08),
        lineMat
      )
      hLineL.rotation.x = -Math.PI / 2
      hLineL.position.set(leftEdge - blockWidth / 2, lineY, z)
      group.add(hLineL)

      // Right block
      const hLineR = new THREE.Mesh(
        new THREE.PlaneGeometry(blockWidth, 0.08),
        lineMat
      )
      hLineR.rotation.x = -Math.PI / 2
      hLineR.position.set(rightEdge + blockWidth / 2, lineY, z)
      group.add(hLineR)
    }

    // Lane center line (dashed)
    for (let i = 0; i < rows * 2; i++) {
      const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.8),
        lineMat
      )
      dash.rotation.x = -Math.PI / 2
      dash.position.set(0, lineY, -i * SLOT_DEPTH / 2 - 0.5)
      group.add(dash)
    }

    // Lane edge lines (solid, marking lane boundaries)
    const laneLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    for (const x of [leftEdge, rightEdge]) {
      const laneLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, rows * SLOT_DEPTH + LOT_PADDING),
        laneLineMat
      )
      laneLine.rotation.x = -Math.PI / 2
      laneLine.position.set(x, lineY, -rows * SLOT_DEPTH / 2)
      group.add(laneLine)
    }
  }

  rebuildLot()
  return { group, get slotPositions() { return slotPositions }, rebuildLot, setState }
}

export { SLOT_WIDTH, SLOT_DEPTH, LANE_WIDTH, LOT_PADDING }
