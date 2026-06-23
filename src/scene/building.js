import * as THREE from 'three'
import { getBaseRows, getBaseCols } from '../game/state.js'
import { SLOT_WIDTH, LANE_WIDTH } from './lot.js'

export function createBuilding(scene, state) {
  const group = new THREE.Group()
  let currentState = state

  function setState(newState) {
    currentState = newState
  }

  function rebuild() {
    while (group.children.length) group.remove(group.children[0])

    const cols = getBaseCols(currentState)
    const buildingWidth = cols * SLOT_WIDTH * 2 + LANE_WIDTH + 3

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0xb8a088 })
    )
    body.position.set(0, 1.5, -getBaseRows(currentState) * 3.5 - 3)
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth + 1, 0.3, 5),
      new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    )
    roof.position.set(0, 3.15, -getBaseRows(currentState) * 3.5 - 3)
    roof.castShadow = true
    group.add(roof)

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x4a3728 })
    )
    door.position.set(0, 1, -getBaseRows(currentState) * 3.5 - 1.05)
    group.add(door)

    // Windows
    for (const xOff of [-3, 3]) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x87ceeb })
      )
      win.position.set(xOff, 2, -getBaseRows(currentState) * 3.5 - 1.05)
      group.add(win)
    }
  }

  rebuild()
  scene.add(group)
  return { group, rebuild, setState }
}
