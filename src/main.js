import * as THREE from 'three'
import './style.css'
import { createGameState } from './game/state.js'
import { createGameClock } from './game/clock.js'
import { createParkingLot } from './scene/lot.js'
import { createBuilding } from './scene/building.js'
import { createGate } from './scene/gate.js'
import { createRoad } from './scene/road.js'
import { createTrees } from './scene/trees.js'
import { createLighting } from './scene/lighting.js'
import { createParkingManager } from './game/parking.js'
import { createQueueManager } from './game/queue.js'
import { createSpawner } from './game/spawner.js'
import { createHUD } from './ui/hud.js'
import { createRaycaster } from './utils/raycaster.js'
import { createCarPopup } from './ui/carPopup.js'
import { createGateAlert } from './ui/gateAlert.js'
import { createShop } from './ui/shop.js'

const canvas = document.getElementById('game-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)

const frustumSize = 30
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2, frustumSize * aspect / 2,
  frustumSize / 2, -frustumSize / 2, 0.1, 100
)
camera.position.set(20, 20, 20)
camera.lookAt(0, 0, 0)

// Grass ground
const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshLambertMaterial({ color: 0x4a7c59 })
)
grass.rotation.x = -Math.PI / 2
grass.receiveShadow = true
scene.add(grass)

const state = createGameState()
const gameClock = createGameClock(state)
const threeClock = new THREE.Clock()

const lot = createParkingLot(scene, state)
const building = createBuilding(scene, state)
const gate = createGate(scene)
const road = createRoad(scene)
const trees = createTrees(scene, state)
const lighting = createLighting(scene)

const parkingManager = createParkingManager(state, lot, gate, scene)
const queueManager = createQueueManager(state, road, gate, parkingManager, lot, scene)
const spawner = createSpawner(state, queueManager)
const hud = createHUD(state, gameClock)

const raycasterUtil = createRaycaster(camera, renderer)
const carPopup = createCarPopup(state, parkingManager, raycasterUtil, lot)
const gateAlert = createGateAlert(state, raycasterUtil, gate)
const shop = createShop(state, parkingManager, lot, building)

document.getElementById('hud-shop-btn').addEventListener('click', () => {
  if (shop.isOpen) shop.close()
  else shop.open()
})

function handleTap(event) {
  if (!state.isRunning) return
  const hit = raycasterUtil.getClickedObject(event, scene)
  if (!hit) { carPopup.hide(); return }

  // Walk up the scene graph from the clicked mesh to find the top-level car group
  let clickedMesh = hit.object
  while (clickedMesh.parent && clickedMesh.parent !== scene) {
    clickedMesh = clickedMesh.parent
  }

  // Find which slot this car belongs to
  const slotIndex = parkingManager.slots.findIndex(s => s.car && s.car.mesh === clickedMesh)
  if (slotIndex !== -1) {
    carPopup.show(slotIndex)
  } else {
    carPopup.hide()
  }
}

renderer.domElement.addEventListener('click', handleTap)
renderer.domElement.addEventListener('touchstart', handleTap, { passive: true })

state.isRunning = true

window.addEventListener('resize', () => {
  const a = window.innerWidth / window.innerHeight
  camera.left = -frustumSize * a / 2
  camera.right = frustumSize * a / 2
  camera.top = frustumSize / 2
  camera.bottom = -frustumSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function updateGateBreak(delta) {
  if (state.gateBroken) return

  const breakChance = 0.002 * (1 + state.difficulty * 0.3)
  const reliability = 1 - state.upgrades.gateReliability * 0.15 // 0-4 levels = 0-60% reduction
  state.gateBreakTimer += delta

  if (state.gateBreakTimer > 5) { // check every 5 seconds
    state.gateBreakTimer = 0
    if (Math.random() < breakChance * reliability) {
      state.gateBroken = true
    }
  }
}

function animate() {
  requestAnimationFrame(animate)
  const delta = threeClock.getDelta()
  gameClock.update(delta)
  lighting.update(state.gameHour)
  gate.update(delta)

  // Game system updates
  const removals = parkingManager.update(delta)
  for (const { index, escaped, fee } of removals) {
    if (!escaped) {
      queueManager.startCarLeaving(index, fee)
    } else {
      // Escaped car — release slot and remove mesh immediately
      const result = parkingManager.releaseSlot(index)
      if (result) scene.remove(result.car.mesh)
    }
  }

  spawner.update(delta)
  queueManager.update(delta)
  updateGateBreak(delta)
  hud.update()
  carPopup.update()
  gateAlert.update()

  // Update parked car animations
  parkingManager.slots.forEach(slot => {
    if (slot.car) slot.car.update(delta)
  })

  // Check game over
  if (state.isGameOver) {
    // Game over state — future tasks will handle UI
  }

  renderer.render(scene, camera)
}
animate()

export { scene, camera, renderer, state, lot, gate, road, parkingManager, queueManager, spawner, hud }
