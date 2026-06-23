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
import { createStartScreen } from './ui/startScreen.js'
import { createGameOver } from './ui/gameOver.js'

// --- Persistent Three.js setup (survives restarts) ---

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

const threeClock = new THREE.Clock()

// Use a base state for initial scene construction (base upgrades = 0, same as fresh game)
const sceneState = createGameState()

// Persistent scene objects — built once, geometry matches base layout
const lot = createParkingLot(scene, sceneState)
const building = createBuilding(scene, sceneState)
const gate = createGate(scene)
const road = createRoad(scene)
const trees = createTrees(scene, sceneState)
const lighting = createLighting(scene)

window.addEventListener('resize', () => {
  const a = window.innerWidth / window.innerHeight
  camera.left = -frustumSize * a / 2
  camera.right = frustumSize * a / 2
  camera.top = frustumSize / 2
  camera.bottom = -frustumSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// --- Game logic systems (re-created on each restart) ---

let state = null
let gameClock = null
let parkingManager = null
let queueManager = null
let spawner = null
let hud = null
let raycasterUtil = null
let carPopup = null
let gateAlert = null
let shop = null
let gameOverShown = false

// --- Screen controllers (created once, reference state via closures) ---

// We create these after startGame() sets state for the first time,
// but we need forward references. Use wrapper callbacks.
let startScreen = null
let gameOverScreen = null

function handleTap(event) {
  if (!state || !state.isRunning) return
  const hit = raycasterUtil.getClickedObject(event, scene)
  if (!hit) { carPopup.hide(); return }

  let clickedMesh = hit.object
  while (clickedMesh.parent && clickedMesh.parent !== scene) {
    clickedMesh = clickedMesh.parent
  }

  const slotIndex = parkingManager.slots.findIndex(s => s.car && s.car.mesh === clickedMesh)
  if (slotIndex !== -1) {
    carPopup.show(slotIndex)
  } else {
    carPopup.hide()
  }
}

renderer.domElement.addEventListener('click', handleTap)
renderer.domElement.addEventListener('touchstart', handleTap, { passive: true })

function updateGateBreak(delta) {
  if (state.gateBroken) return

  const breakChance = 0.002 * (1 + state.difficulty * 0.3)
  const reliability = 1 - state.upgrades.gateReliability * 0.15
  state.gateBreakTimer += delta

  if (state.gateBreakTimer > 5) {
    state.gateBreakTimer = 0
    if (Math.random() < breakChance * reliability) {
      state.gateBroken = true
    }
  }
}

function clearAllCarMeshes() {
  // Remove parked car meshes from previous game
  if (parkingManager) {
    parkingManager.slots.forEach(slot => {
      if (slot.car && slot.car.mesh) scene.remove(slot.car.mesh)
    })
  }
  // Queue cars are managed by queueManager — clear them via scene children snapshot
  // Remove any THREE.Group that isn't a known persistent object (grass, lot, building, etc.)
  // Safe approach: remove objects added by car factory (they are Groups at top level)
  const persistentGroups = new Set([
    lot.group, building.group, gate.group || null, road.group || null,
    trees.group || null, grass
  ].filter(Boolean))

  const toRemove = []
  scene.children.forEach(child => {
    if (child instanceof THREE.Group && !persistentGroups.has(child)) {
      toRemove.push(child)
    }
  })
  toRemove.forEach(obj => scene.remove(obj))
}

function startGame() {
  // Clear any lingering car meshes from previous game
  clearAllCarMeshes()

  // Create fresh state
  state = createGameState()
  state.isRunning = true
  gameOverShown = false

  // Re-create all game logic systems with fresh state
  // Lot geometry stays at base size (fresh game always starts with 0 upgrades)
  gameClock = createGameClock(state)
  parkingManager = createParkingManager(state, lot, gate, scene)
  queueManager = createQueueManager(state, road, gate, parkingManager, lot, scene)
  spawner = createSpawner(state, queueManager)
  hud = createHUD(state, gameClock)
  raycasterUtil = createRaycaster(camera, renderer)
  carPopup = createCarPopup(state, parkingManager, raycasterUtil, lot)
  gateAlert = createGateAlert(state, raycasterUtil, gate)
  shop = createShop(state, parkingManager, lot, building)

  // Wire shop button (re-attach since shop is new)
  const shopBtn = document.getElementById('hud-shop-btn')
  // Clone to remove old listeners, then re-attach
  const newShopBtn = shopBtn.cloneNode(true)
  shopBtn.parentNode.replaceChild(newShopBtn, shopBtn)
  newShopBtn.addEventListener('click', () => {
    if (shop.isOpen) shop.close()
    else shop.open()
  })

  // Show HUD
  document.getElementById('hud').style.display = 'flex'

  // Update game over screen with fresh state reference on next game-over
  gameOverScreen = createGameOver(state, () => {
    document.getElementById('hud').style.display = 'none'
    startGame()
  })
}

function handleGameOver() {
  state.isRunning = false
  document.getElementById('hud').style.display = 'none'
  if (carPopup) carPopup.hide()
  gameOverScreen.show()
}

// --- Initial state for start screen (reads highscore from localStorage) ---
const initialState = createGameState()

startScreen = createStartScreen(initialState, () => {
  startGame()
})

// Hide HUD until game starts
document.getElementById('hud').style.display = 'none'

// Show start screen
startScreen.show()

// --- Animation loop ---

function animate() {
  requestAnimationFrame(animate)
  const delta = threeClock.getDelta()

  lighting.update(state ? state.gameHour : 7.0)
  gate.update(delta)

  if (!state || !state.isRunning) {
    renderer.render(scene, camera)
    return
  }

  gameClock.update(delta)

  const removals = parkingManager.update(delta)
  for (const { index, escaped, fee } of removals) {
    if (!escaped) {
      queueManager.startCarLeaving(index, fee)
    } else {
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

  parkingManager.slots.forEach(slot => {
    if (slot.car) slot.car.update(delta)
  })

  // Check game over
  if (state.isGameOver && !gameOverShown) {
    gameOverShown = true
    handleGameOver()
  }

  renderer.render(scene, camera)
}
animate()

export { scene, camera, renderer, lot, gate, road }
