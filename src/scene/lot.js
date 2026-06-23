import * as THREE from 'three'
import { getBaseRows, getBaseCols } from '../game/state.js'

const SLOT_WIDTH = 2.2
const SLOT_DEPTH = 3.5
const LANE_WIDTH = 3.0
const LOT_PADDING = 1.5

export function createParkingLot(scene, state) {
  const group = new THREE.Group()
  scene.add(group)

  let slotPositions = []

  function rebuildLot() {
    while (group.children.length) group.remove(group.children[0])
    slotPositions = []

    const rows = getBaseRows(state)
    const cols = getBaseCols(state)

    // Lot dimensions: two columns of slots with a lane between
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

    // Parking lines and slot positions
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // Left side slots
        const lx = -LANE_WIDTH / 2 - (col + 0.5) * SLOT_WIDTH
        const lz = -row * SLOT_DEPTH - SLOT_DEPTH / 2
        slotPositions.push({ x: lx, z: lz, row, col, side: 'left' })

        // Right side slots
        const rx = LANE_WIDTH / 2 + (col + 0.5) * SLOT_WIDTH
        const rz = -row * SLOT_DEPTH - SLOT_DEPTH / 2
        slotPositions.push({ x: rx, z: rz, row, col, side: 'right' })

        // Draw slot lines
        for (const sx of [lx, rx]) {
          const line = new THREE.Mesh(
            new THREE.PlaneGeometry(0.08, SLOT_DEPTH),
            lineMat
          )
          line.rotation.x = -Math.PI / 2
          line.position.set(sx - SLOT_WIDTH / 2, 0.02, lz)
          group.add(line)

          const line2 = line.clone()
          line2.position.set(sx + SLOT_WIDTH / 2, 0.02, lz)
          group.add(line2)
        }
      }
    }

    // Lane center line (dashed)
    for (let i = 0; i < rows * 2; i++) {
      const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.8),
        lineMat
      )
      dash.rotation.x = -Math.PI / 2
      dash.position.set(0, 0.02, -i * SLOT_DEPTH / 2 - 0.5)
      group.add(dash)
    }
  }

  rebuildLot()
  return { group, get slotPositions() { return slotPositions }, rebuildLot }
}

export { SLOT_WIDTH, SLOT_DEPTH, LANE_WIDTH }
