# Mini Parkering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3D isometric parking lot management game in the browser using Three.js.

**Architecture:** Single-page Vite app. Three.js renders the 3D scene (parking lot, cars, buildings, trees). HTML/CSS elements overlay the canvas for all UI (HUD, shop, popups, menus). Game state is a plain JS object mutated by the game loop. No framework.

**Tech Stack:** Vite 6, Three.js r170+, vanilla JS, CSS

## Global Constraints

- No npm frameworks (React, Vue, etc.) — vanilla JS only
- All 3D geometry is procedural (no .glb/.obj model files)
- All UI is HTML/CSS overlays, not Three.js text/sprites
- Mobile-responsive: touch and mouse input
- Game clock: 2 game-hours = 30 real seconds (1 game-minute ≈ 0.25 real seconds)
- Starting lot: 3 columns × 4 rows
- localStorage for highscore persistence

---

### Task 1: Project Scaffold & Empty Scene

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/style.css`

**Interfaces:**
- Produces: Running Vite dev server with a Three.js scene rendering a colored background. `initScene()` returns `{ scene, camera, renderer }`. Global game loop via `requestAnimationFrame`.

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd /Users/jds-tactile/Documents/GitHub/mini-parkering-html
npm init -y
npm install three
npm install -D vite
```

- [ ] **Step 2: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: { outDir: 'dist' }
})
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Mini Parkering</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <canvas id="game-canvas"></canvas>
  <div id="ui-overlay"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/style.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
#game-canvas { display: block; width: 100%; height: 100%; }
#ui-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
}
#ui-overlay > * { pointer-events: auto; }
```

- [ ] **Step 5: Create src/main.js with basic Three.js scene**

```js
import * as THREE from 'three'
import './style.css'

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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
dirLight.position.set(10, 20, 10)
dirLight.castShadow = true
scene.add(dirLight)

// Temp ground plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0x4a7c59 })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

window.addEventListener('resize', () => {
  const a = window.innerWidth / window.innerHeight
  camera.left = -frustumSize * a / 2
  camera.right = frustumSize * a / 2
  camera.top = frustumSize / 2
  camera.bottom = -frustumSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()

export { scene, camera, renderer }
```

- [ ] **Step 6: Add dev script to package.json and verify**

Add to package.json scripts: `"dev": "vite", "build": "vite build"`

Run: `npm run dev`
Expected: Browser opens showing a green ground plane with blue sky, isometric camera angle.

- [ ] **Step 7: Commit**

```bash
git add package.json vite.config.js index.html src/
git commit -m "feat: project scaffold with Three.js scene"
```

---

### Task 2: Game State & Clock

**Files:**
- Create: `src/game/state.js`
- Create: `src/game/clock.js`

**Interfaces:**
- Produces: `createGameState()` returns mutable state object `{ money, gameHour, dayCount, difficulty, upgrades, isRunning, isGameOver, highscore }`. `createGameClock(state)` returns `{ update(deltaSeconds), getTimeString(), getDayProgress() }`. `state.gameHour` is a float 0–24 that wraps. `getDayProgress()` returns 0–1 for lighting interpolation.

- [ ] **Step 1: Create src/game/state.js**

```js
export function createGameState() {
  return {
    money: 50,
    gameHour: 7.0,
    dayCount: 1,
    difficulty: 1,
    difficultyTimer: 0,
    isRunning: false,
    isGameOver: false,
    isPaused: false,
    highscore: parseInt(localStorage.getItem('miniParkering_highscore') || '0'),
    upgrades: {
      gateReliability: 0,  // 0-4 (5 levels: 0=base)
      extraRows: 0,
      extraCols: 0,
      extraQueueSlots: 0,
    },
    wardenActive: false,
    wardenTimer: 0,
    towActive: false,
    towTimer: 0,
    gateBroken: false,
    gateBreakTimer: 0,
    cars: [],          // active parked cars
    queue: [],         // cars waiting at gate
    activeCar: null,   // car entering/leaving animation
  }
}

export function saveHighscore(state) {
  if (state.money > state.highscore) {
    state.highscore = state.money
    localStorage.setItem('miniParkering_highscore', String(state.money))
  }
}

export function getBaseRows(state) { return 4 + state.upgrades.extraRows }
export function getBaseCols(state) { return 3 + state.upgrades.extraCols }
export function getQueueCapacity(state) { return 5 + state.upgrades.extraQueueSlots * 2 }
```

- [ ] **Step 2: Create src/game/clock.js**

```js
const REAL_SECONDS_PER_2_GAME_HOURS = 30
const GAME_HOURS_PER_REAL_SECOND = 2 / REAL_SECONDS_PER_2_GAME_HOURS  // 0.0667
const DIFFICULTY_INTERVAL = 90 // real seconds

export function createGameClock(state) {
  return {
    update(deltaSec) {
      if (!state.isRunning || state.isPaused) return

      const gameHoursDelta = deltaSec * GAME_HOURS_PER_REAL_SECOND
      state.gameHour += gameHoursDelta

      if (state.gameHour >= 24) {
        state.gameHour -= 24
        state.dayCount++
      }

      state.difficultyTimer += deltaSec
      if (state.difficultyTimer >= DIFFICULTY_INTERVAL) {
        state.difficultyTimer -= DIFFICULTY_INTERVAL
        state.difficulty++
      }

      if (state.wardenActive) {
        state.wardenTimer -= gameHoursDelta * 60 // convert to game-minutes
        if (state.wardenTimer <= 0) {
          state.wardenActive = false
          state.wardenTimer = 0
        }
      }

      if (state.towActive) {
        state.towTimer -= gameHoursDelta * 60
        if (state.towTimer <= 0) {
          state.towActive = false
          state.towTimer = 0
        }
      }
    },

    getTimeString() {
      const h = Math.floor(state.gameHour)
      const m = Math.floor((state.gameHour - h) * 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    },

    getDayProgress() {
      return state.gameHour / 24
    },

    gameMinutesToReal(gameMinutes) {
      return gameMinutes / (GAME_HOURS_PER_REAL_SECOND * 60)
    }
  }
}

export { GAME_HOURS_PER_REAL_SECOND }
```

- [ ] **Step 3: Wire clock into main.js game loop**

In `src/main.js`, import and instantiate state + clock. Add a `THREE.Clock` for delta time. Call `clock.update(delta)` each frame.

```js
// Add to main.js imports
import { createGameState } from './game/state.js'
import { createGameClock } from './game/clock.js'

// After scene setup
const state = createGameState()
const gameClock = createGameClock(state)
const threeClock = new THREE.Clock()

// Temp: start game immediately for testing
state.isRunning = true

function animate() {
  requestAnimationFrame(animate)
  const delta = threeClock.getDelta()
  gameClock.update(delta)
  renderer.render(scene, camera)
}
```

- [ ] **Step 4: Verify**

Run dev server. No visual change yet, but add `console.log(gameClock.getTimeString())` in the loop temporarily to confirm time advances. Remove after confirming.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.js src/game/clock.js src/main.js
git commit -m "feat: game state and clock system"
```

---

### Task 3: Parking Lot Scene (Surface, Lines, Building, Gate, Road, Trees)

**Files:**
- Create: `src/scene/lot.js`
- Create: `src/scene/building.js`
- Create: `src/scene/gate.js`
- Create: `src/scene/road.js`
- Create: `src/scene/trees.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `getBaseRows(state)`, `getBaseCols(state)` from `state.js`
- Produces:
  - `createParkingLot(scene, state)` returns `{ group, slotPositions: [{x,z,row,col}], rebuildLot() }`. `slotPositions` is recalculated on `rebuildLot()` when rows/cols change.
  - `createBuilding(scene)` returns `{ group }` — ticket office at top of lot.
  - `createGate(scene)` returns `{ group, barrierArm, liftBarrier(), lowerBarrier() }` — gate at entrance with animated barrier.
  - `createRoad(scene)` returns `{ group, queuePositions: [{x,z}] }` — road with 10 queue spots.
  - `createTrees(scene)` returns `{ group }` — decorative trees around lot edges.

- [ ] **Step 1: Create src/scene/lot.js**

The parking lot is a beige rectangle with white angled lines for each slot. Slots are arranged in rows with a driving lane down the center.

```js
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
```

- [ ] **Step 2: Create src/scene/building.js**

```js
import * as THREE from 'three'
import { getBaseRows, getBaseCols } from '../game/state.js'
import { SLOT_WIDTH, LANE_WIDTH } from './lot.js'

export function createBuilding(scene, state) {
  const group = new THREE.Group()

  function rebuild() {
    while (group.children.length) group.remove(group.children[0])

    const cols = getBaseCols(state)
    const buildingWidth = cols * SLOT_WIDTH * 2 + LANE_WIDTH + 3

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0xb8a088 })
    )
    body.position.set(0, 1.5, -getBaseRows(state) * 3.5 - 3)
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth + 1, 0.3, 5),
      new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    )
    roof.position.set(0, 3.15, -getBaseRows(state) * 3.5 - 3)
    roof.castShadow = true
    group.add(roof)

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x4a3728 })
    )
    door.position.set(0, 1, -getBaseRows(state) * 3.5 - 1.05)
    group.add(door)

    // Windows
    for (const xOff of [-3, 3]) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x87ceeb })
      )
      win.position.set(xOff, 2, -getBaseRows(state) * 3.5 - 1.05)
      group.add(win)
    }
  }

  rebuild()
  scene.add(group)
  return { group, rebuild }
}
```

- [ ] **Step 3: Create src/scene/gate.js**

```js
import * as THREE from 'three'

export function createGate(scene) {
  const group = new THREE.Group()
  group.position.set(0, 0, 2)

  // Gate booth
  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.5, 1.5),
    new THREE.MeshLambertMaterial({ color: 0xddd8c4 })
  )
  booth.position.set(-1.2, 1.25, 0)
  booth.castShadow = true
  group.add(booth)

  const boothRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 2),
    new THREE.MeshLambertMaterial({ color: 0x666666 })
  )
  boothRoof.position.set(-1.2, 2.6, 0)
  group.add(boothRoof)

  // Barrier post
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  )
  post.position.set(0.5, 1, 0)
  group.add(post)

  // Barrier arm (pivots at post)
  const armPivot = new THREE.Group()
  armPivot.position.set(0.5, 2, 0)
  group.add(armPivot)

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.15, 0.15),
    new THREE.MeshLambertMaterial({ color: 0xff4444 })
  )
  arm.position.set(2, 0, 0)
  armPivot.add(arm)

  // Stripe on arm
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.16, 0.16),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    )
    stripe.position.set(1 + i * 1.2, 0, 0)
    armPivot.add(stripe)
  }

  let targetAngle = 0
  const barrierArm = armPivot

  function liftBarrier() { targetAngle = -Math.PI / 2 }
  function lowerBarrier() { targetAngle = 0 }

  function update(delta) {
    const current = barrierArm.rotation.z
    const diff = targetAngle - current
    if (Math.abs(diff) > 0.01) {
      barrierArm.rotation.z += diff * Math.min(1, delta * 5)
    }
  }

  scene.add(group)
  return { group, barrierArm, liftBarrier, lowerBarrier, update }
}
```

- [ ] **Step 4: Create src/scene/road.js**

```js
import * as THREE from 'three'

export function createRoad(scene) {
  const group = new THREE.Group()

  // Main road (runs along z-axis, south of gate)
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 30),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  )
  road.rotation.x = -Math.PI / 2
  road.position.set(0, 0.005, 17)
  road.receiveShadow = true
  group.add(road)

  // Road markings
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xcccccc })
  for (let i = 0; i < 10; i++) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 1),
      lineMat
    )
    dash.rotation.x = -Math.PI / 2
    dash.position.set(0, 0.01, 4 + i * 2.5)
    group.add(dash)
  }

  // Sidewalks
  for (const xOff of [-3.5, 3.5]) {
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.15, 30),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    )
    sidewalk.position.set(xOff, 0.075, 17)
    group.add(sidewalk)
  }

  // Queue positions (where cars wait in line on the road)
  const queuePositions = []
  for (let i = 0; i < 10; i++) {
    queuePositions.push({ x: 0, z: 5 + i * 2.8 })
  }

  scene.add(group)
  return { group, queuePositions }
}
```

- [ ] **Step 5: Create src/scene/trees.js**

```js
import * as THREE from 'three'

export function createTree(x, z) {
  const group = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x6b4226 })
  )
  trunk.position.set(x, 0.6, z)
  trunk.castShadow = true
  group.add(trunk)

  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x2d5a27 })
  )
  foliage.position.set(x, 1.6, z)
  foliage.castShadow = true
  group.add(foliage)

  return group
}

export function createTrees(scene, state) {
  const group = new THREE.Group()

  // Trees along left side
  for (let i = 0; i < 6; i++) {
    group.add(createTree(-8 - Math.random() * 2, -i * 3 + 1))
  }
  // Trees along right side
  for (let i = 0; i < 6; i++) {
    group.add(createTree(8 + Math.random() * 2, -i * 3 + 1))
  }
  // Trees near entrance
  group.add(createTree(-5, 4))
  group.add(createTree(5, 4))

  scene.add(group)
  return { group }
}
```

- [ ] **Step 6: Create src/scene/lighting.js**

```js
import * as THREE from 'three'

const DAY_COLORS = {
  sky:     [0x87ceeb, 0x87ceeb, 0xff9966, 0x1a1a3e, 0xff9966, 0x87ceeb],
  ambient: [0x8899bb, 0xffffff, 0xffaa77, 0x222244, 0xffaa77, 0xffffff],
  sun:     [0xffeedd, 0xffffff, 0xff8844, 0x111133, 0xff8844, 0xffffff],
}
// Keyframes at hours: 0, 5, 7, 12(noon), 18, 20, 24(=0)
const KEY_HOURS = [0, 5, 7, 12, 18, 20, 24]
const KEY_SKY =     [0x0a0a1e, 0x0a0a1e, 0xff9966, 0x87ceeb, 0xff9966, 0x1a1a3e, 0x0a0a1e]
const KEY_AMBIENT = [0x111133, 0x222244, 0xffaa77, 0xffffff, 0xffaa77, 0x222255, 0x111133]
const KEY_SUN_INT = [0.05, 0.1, 0.5, 1.0, 0.5, 0.1, 0.05]
const KEY_AMB_INT = [0.15, 0.2, 0.5, 0.6, 0.5, 0.2, 0.15]

function lerpColor(color, a, b, t) {
  const ca = new THREE.Color(a)
  const cb = new THREE.Color(b)
  color.copy(ca).lerp(cb, t)
}

function getKeyframeInterp(hour) {
  for (let i = 0; i < KEY_HOURS.length - 1; i++) {
    if (hour >= KEY_HOURS[i] && hour < KEY_HOURS[i + 1]) {
      const t = (hour - KEY_HOURS[i]) / (KEY_HOURS[i + 1] - KEY_HOURS[i])
      return { index: i, t }
    }
  }
  return { index: 0, t: 0 }
}

export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(10, 20, 10)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.set(1024, 1024)
  dirLight.shadow.camera.left = -20
  dirLight.shadow.camera.right = 20
  dirLight.shadow.camera.top = 20
  dirLight.shadow.camera.bottom = -20
  scene.add(dirLight)

  function update(gameHour) {
    const { index, t } = getKeyframeInterp(gameHour)

    lerpColor(scene.background, KEY_SKY[index], KEY_SKY[index + 1], t)
    lerpColor(ambientLight.color, KEY_AMBIENT[index], KEY_AMBIENT[index + 1], t)

    ambientLight.intensity = KEY_AMB_INT[index] + (KEY_AMB_INT[index + 1] - KEY_AMB_INT[index]) * t
    dirLight.intensity = KEY_SUN_INT[index] + (KEY_SUN_INT[index + 1] - KEY_SUN_INT[index]) * t

    // Sun position rotates over the day
    const sunAngle = (gameHour / 24) * Math.PI * 2 - Math.PI / 2
    dirLight.position.set(
      Math.cos(sunAngle) * 15,
      Math.abs(Math.sin(sunAngle)) * 20 + 2,
      Math.sin(sunAngle) * 10
    )
  }

  return { ambientLight, dirLight, update }
}
```

- [ ] **Step 7: Wire everything into main.js**

Replace the temp ground plane and lighting in `main.js` with imports from each scene module. Call `lighting.update(state.gameHour)` in the game loop. Call `gate.update(delta)` in the loop.

```js
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

function animate() {
  requestAnimationFrame(animate)
  const delta = threeClock.getDelta()
  gameClock.update(delta)
  lighting.update(state.gameHour)
  gate.update(delta)
  renderer.render(scene, camera)
}
animate()

export { scene, camera, renderer, state, lot, gate, road }
```

- [ ] **Step 8: Verify**

Run: `npm run dev`
Expected: Isometric view of a parking lot with white lines, a building at the back, a gate with red/white barrier, a road leading south, trees around the edges. Sky color shifts over time as the game clock runs (visible within ~30 seconds as dawn→day→dusk→night cycle).

- [ ] **Step 9: Commit**

```bash
git add src/scene/ src/main.js
git commit -m "feat: parking lot scene with building, gate, road, trees, day/night lighting"
```

---

### Task 4: Car Factory & Waypoint Animation System

**Files:**
- Create: `src/scene/car.js`

**Interfaces:**
- Produces: `createCar(colorIndex?)` returns `{ mesh, setPath(waypoints), update(delta), isAnimating, onArrive: callback }`. A car mesh is a rounded box ~1.8×1×3 with a cabin on top and colored body/stripe. `setPath([{x,y,z}...])` starts the car driving along waypoints. `update(delta)` advances position. `onArrive` fires when path ends.

- [ ] **Step 1: Create src/scene/car.js**

```js
import * as THREE from 'three'

const CAR_COLORS = [
  0xe74c3c, // red
  0x3498db, // blue
  0xf39c12, // yellow/orange
  0x2ecc71, // green
  0x9b59b6, // purple
  0xe8dcc8, // beige
  0x1abc9c, // teal
  0x34495e, // dark gray
]

const STRIPE_COLORS = [0xffffff, 0xffdd44, 0x333333, 0xff6600]

export function createCar(colorIndex) {
  const color = CAR_COLORS[colorIndex ?? Math.floor(Math.random() * CAR_COLORS.length)]
  const stripe = STRIPE_COLORS[Math.floor(Math.random() * STRIPE_COLORS.length)]

  const group = new THREE.Group()

  // Body
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.8)
  bodyGeo.translate(0, 0.3, 0)
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color }))
  body.castShadow = true
  group.add(body)

  // Round the body edges visually with a slightly inset top
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.5, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x87ceeb })
  )
  cabin.position.set(0, 0.85, -0.2)
  cabin.castShadow = true
  group.add(cabin)

  // Stripe
  const stripeGeo = new THREE.BoxGeometry(1.62, 0.05, 0.3)
  const stripeMesh = new THREE.Mesh(stripeGeo, new THREE.MeshLambertMaterial({ color: stripe }))
  stripeMesh.position.set(0, 0.62, 0.5)
  group.add(stripeMesh)

  // Wheels (4 small dark cylinders)
  const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8)
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
  for (const [wx, wz] of [[-0.75, 0.9], [0.75, 0.9], [-0.75, -0.9], [0.75, -0.9]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(wx, 0.15, wz)
    group.add(wheel)
  }

  // Headlights
  const headlightGeo = new THREE.BoxGeometry(0.2, 0.15, 0.05)
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc })
  for (const hx of [-0.55, 0.55]) {
    const hl = new THREE.Mesh(headlightGeo, headlightMat)
    hl.position.set(hx, 0.35, 1.4)
    group.add(hl)
  }

  // Taillights
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 })
  for (const hx of [-0.55, 0.55]) {
    const tl = new THREE.Mesh(headlightGeo, taillightMat)
    tl.position.set(hx, 0.35, -1.4)
    group.add(tl)
  }

  // Animation state
  let waypoints = []
  let waypointIndex = 0
  let isAnimating = false
  let speed = 6
  let onArrive = null
  let parkReverse = false

  function setPath(points, opts = {}) {
    waypoints = points.map(p => new THREE.Vector3(p.x, p.y ?? 0, p.z))
    waypointIndex = 0
    isAnimating = true
    speed = opts.speed || 6
    parkReverse = opts.reverse || false
    if (waypoints.length > 0) {
      group.position.copy(waypoints[0])
    }
  }

  function update(delta) {
    if (!isAnimating || waypoints.length === 0) return

    const target = waypoints[waypointIndex]
    const current = group.position
    const dir = new THREE.Vector3().subVectors(target, current)
    const dist = dir.length()

    if (dist < 0.1) {
      waypointIndex++
      if (waypointIndex >= waypoints.length) {
        isAnimating = false
        if (onArrive) onArrive()
        return
      }
    } else {
      dir.normalize()
      const step = Math.min(speed * delta, dist)
      current.add(dir.multiplyScalar(step))

      // Face direction of travel
      const lookTarget = target.clone()
      lookTarget.y = current.y
      if (lookTarget.distanceTo(current) > 0.01) {
        const angle = Math.atan2(
          lookTarget.x - current.x,
          lookTarget.z - current.z
        )
        group.rotation.y = parkReverse ? angle + Math.PI : angle
      }
    }
  }

  return {
    mesh: group,
    setPath,
    update,
    get isAnimating() { return isAnimating },
    set onArrive(fn) { onArrive = fn },
    get onArrive() { return onArrive },
  }
}
```

- [ ] **Step 2: Test by spawning a test car in main.js**

Add a temporary car to scene that drives along a test path:

```js
import { createCar } from './scene/car.js'

// After scene setup, temp test:
const testCar = createCar()
scene.add(testCar.mesh)
testCar.setPath([
  { x: 0, z: 20 },
  { x: 0, z: 2 },
  { x: -3, z: -2 },
  { x: -3, z: -5 },
])
testCar.onArrive = () => console.log('Car arrived!')

// In animate():
// testCar.update(delta)
```

Add `testCar.update(delta)` to the loop temporarily.

- [ ] **Step 3: Verify**

Run dev server. Confirm: a colorful low-poly car drives from the road, through the gate area, into the lot. Console logs "Car arrived!" when it stops.

- [ ] **Step 4: Remove test car, commit**

Remove the temporary test car code from main.js.

```bash
git add src/scene/car.js src/main.js
git commit -m "feat: car factory with waypoint animation system"
```

---

### Task 5: Parking Slot Manager & Car Spawner

**Files:**
- Create: `src/game/parking.js`
- Create: `src/game/spawner.js`
- Create: `src/game/queue.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `lot.slotPositions`, `road.queuePositions`, `gate.liftBarrier/lowerBarrier`, `createCar()`, `state`, `GAME_HOURS_PER_REAL_SECOND`
- Produces:
  - `createParkingManager(state, lot, gate, scene)` returns `{ update(delta), assignSlot(car): slotIndex|null, releaseSlot(index), getSlotCar(index), parkedCars: [] }`
  - `createSpawner(state, parkingManager, queueManager)` returns `{ update(delta) }` — spawns cars at time-of-day rates
  - `createQueueManager(state, road, gate, parkingManager, scene)` returns `{ update(delta), addCar(car), queueLength, isOverflowing }`

- [ ] **Step 1: Create src/game/parking.js**

```js
import * as THREE from 'three'
import { GAME_HOURS_PER_REAL_SECOND } from './clock.js'
import { getBaseRows, getBaseCols } from './state.js'

export function createParkingManager(state, lot, gate, scene) {
  // Each slot: { car, timerRemaining (game-minutes), overstayTime, ticketed, ticketFee }
  let slots = []

  function rebuildSlots() {
    const count = lot.slotPositions.length
    const newSlots = []
    for (let i = 0; i < count; i++) {
      newSlots.push(slots[i] || { car: null, timerRemaining: 0, overstayTime: 0, ticketed: false, ticketFee: 0 })
    }
    slots = newSlots
  }
  rebuildSlots()

  function assignSlot(car) {
    const emptyIndex = slots.findIndex(s => s.car === null)
    if (emptyIndex === -1) return null

    slots[emptyIndex] = {
      car,
      timerRemaining: 120, // 2 game-hours in game-minutes
      overstayTime: 0,
      ticketed: false,
      ticketFee: 0,
    }
    return emptyIndex
  }

  function releaseSlot(index) {
    const slot = slots[index]
    if (!slot || !slot.car) return null
    const car = slot.car
    const fee = slot.ticketed ? slot.ticketFee : getBaseFee()
    slots[index] = { car: null, timerRemaining: 0, overstayTime: 0, ticketed: false, ticketFee: 0 }
    return { car, fee }
  }

  function getBaseFee() {
    return 10 + state.difficulty * 2
  }

  function getTicketFee() {
    return 25 + state.difficulty * 5
  }

  function ticketCar(slotIndex) {
    const slot = slots[slotIndex]
    if (!slot || !slot.car || slot.ticketed) return false
    slot.ticketed = true
    slot.ticketFee = getTicketFee()
    return true
  }

  function extendParking(slotIndex) {
    const slot = slots[slotIndex]
    if (!slot || !slot.car) return false
    if (state.money < 15) return false
    state.money -= 15
    slot.timerRemaining += 60 // +1 game-hour
    slot.overstayTime = 0
    return true
  }

  const ESCAPE_THRESHOLD = 30 // game-minutes before unticketed overstayer escapes
  const TICKETED_LEAVE_DELAY = 10 // game-minutes after ticketed before leaving
  const carsToRemove = []

  function update(delta) {
    const gameMinutesDelta = delta * GAME_HOURS_PER_REAL_SECOND * 60

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (!slot.car) continue

      if (slot.timerRemaining > 0) {
        slot.timerRemaining -= gameMinutesDelta
        if (slot.timerRemaining <= 0) {
          slot.timerRemaining = 0
        }
      } else {
        // Overstaying
        slot.overstayTime += gameMinutesDelta

        // Auto-ticket by warden
        if (state.wardenActive && !slot.ticketed) {
          ticketCar(i)
        }

        if (!slot.ticketed && slot.overstayTime >= ESCAPE_THRESHOLD) {
          // Car escapes! Penalty
          const penalty = getTicketFee()
          state.money -= penalty
          carsToRemove.push({ index: i, escaped: true, fee: -penalty })
        } else if (slot.ticketed && slot.overstayTime >= TICKETED_LEAVE_DELAY) {
          // Ticketed car leaves
          carsToRemove.push({ index: i, escaped: false, fee: slot.ticketFee })
        }
      }
    }

    // Also: normal cars leave when timer hits 0 and they haven't overstayed long
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (!slot.car) continue
      if (slot.timerRemaining <= 0 && slot.overstayTime === 0) {
        // Just expired this frame — don't remove immediately, let overstay logic handle
      }
    }

    return carsToRemove.splice(0)
  }

  return {
    assignSlot,
    releaseSlot,
    ticketCar,
    extendParking,
    update,
    rebuildSlots,
    get slots() { return slots },
    getBaseFee,
    getTicketFee,
  }
}
```

- [ ] **Step 2: Create src/game/queue.js**

```js
import { getQueueCapacity } from './state.js'
import { createCar } from '../scene/car.js'

export function createQueueManager(state, road, gate, parkingManager, lot, scene) {
  const queue = []
  let processingCar = null

  function addCar() {
    const capacity = getQueueCapacity(state)
    if (queue.length >= capacity) {
      return false // overflow!
    }
    const car = createCar()
    const queuePos = road.queuePositions[queue.length]
    car.mesh.position.set(queuePos.x, 0, queuePos.z)
    car.mesh.rotation.y = Math.PI // face toward gate
    scene.add(car.mesh)
    queue.push(car)
    return true
  }

  function processNext() {
    if (processingCar || queue.length === 0 || state.gateBroken) return

    const car = queue.shift()
    processingCar = car

    // Reassign queue positions for remaining cars
    queue.forEach((c, i) => {
      const pos = road.queuePositions[i]
      c.setPath([{ x: pos.x, z: pos.z }], { speed: 4 })
    })

    // Drive car from queue to gate, then to assigned slot
    const slotIndex = parkingManager.assignSlot(car)
    if (slotIndex === null) {
      // No slots available — car leaves (no penalty, just leaves)
      const exitPath = [
        { x: 0, z: 2 },
        { x: 0, z: 30 },
      ]
      car.setPath(exitPath, { speed: 6 })
      car.onArrive = () => {
        scene.remove(car.mesh)
        processingCar = null
      }
      return
    }

    const slotPos = lot.slotPositions[slotIndex]
    gate.liftBarrier()

    const entryPath = [
      { x: 0, z: 2 },  // at gate
      { x: 0, z: 0 },  // past gate
      { x: 0, z: slotPos.z }, // drive down lane
      { x: slotPos.x, z: slotPos.z }, // into slot
    ]

    car.setPath(entryPath, { speed: 5 })
    car.onArrive = () => {
      gate.lowerBarrier()
      processingCar = null
    }
  }

  function startCarLeaving(slotIndex, fee) {
    const result = parkingManager.releaseSlot(slotIndex)
    if (!result) return

    const { car } = result
    const slotPos = lot.slotPositions[slotIndex]

    const exitPath = [
      { x: slotPos.x, z: slotPos.z },
      { x: 0, z: slotPos.z },
      { x: 0, z: 0 },
      { x: 0, z: 2 },
      { x: 0, z: 30 },
    ]

    gate.liftBarrier()
    car.setPath(exitPath, { speed: 5 })
    car.onArrive = () => {
      scene.remove(car.mesh)
      gate.lowerBarrier()
      state.money += fee
    }

    return { car, fee }
  }

  function update(delta) {
    // Update all queued car animations
    queue.forEach(c => c.update(delta))
    if (processingCar) processingCar.update(delta)

    // Try to process next car if gate is free
    if (!processingCar) processNext()
  }

  return {
    addCar,
    update,
    startCarLeaving,
    get queueLength() { return queue.length },
    get isProcessing() { return !!processingCar },
  }
}
```

- [ ] **Step 3: Create src/game/spawner.js**

```js
const SPAWN_RATES = [
  // [startHour, endHour, carsPerGameHour]
  [0, 5, 0],
  [5, 7, 2],
  [7, 9, 8],     // morning rush
  [9, 11, 4],
  [11, 13, 7],   // lunch rush
  [13, 17, 4],
  [17, 19, 8],   // evening rush
  [19, 21, 3],
  [21, 24, 1],
]

function getSpawnRate(gameHour, difficulty) {
  let base = 0
  for (const [start, end, rate] of SPAWN_RATES) {
    if (gameHour >= start && gameHour < end) {
      base = rate
      break
    }
  }
  return base * (1 + (difficulty - 1) * 0.25)
}

export function createSpawner(state, queueManager) {
  let spawnAccumulator = 0

  function update(delta) {
    if (!state.isRunning || state.isPaused) return

    const rate = getSpawnRate(state.gameHour, state.difficulty)
    if (rate === 0) return

    // Convert rate from cars/game-hour to cars/real-second
    const GAME_HOURS_PER_REAL_SECOND = 2 / 30
    const carsPerRealSecond = rate * GAME_HOURS_PER_REAL_SECOND

    spawnAccumulator += carsPerRealSecond * delta

    while (spawnAccumulator >= 1) {
      spawnAccumulator -= 1
      const success = queueManager.addCar()
      if (!success) {
        // Queue overflow — game over!
        state.isGameOver = true
        state.isRunning = false
        return
      }
    }
  }

  return { update }
}
```

- [ ] **Step 4: Wire into main.js**

Add imports and instantiation for parkingManager, queueManager, spawner. In the animate loop, call their update methods. Also handle car removals from parkingManager.

```js
// Add imports
import { createParkingManager } from './game/parking.js'
import { createQueueManager } from './game/queue.js'
import { createSpawner } from './game/spawner.js'

// After lot, gate, road creation:
const parkingManager = createParkingManager(state, lot, gate, scene)
const queueManager = createQueueManager(state, road, gate, parkingManager, lot, scene)
const spawner = createSpawner(state, queueManager)

// In animate(), after gameClock.update:
const removals = parkingManager.update(delta)
for (const { index, escaped, fee } of removals) {
  if (state.towActive && !escaped) {
    // Instant tow
    queueManager.startCarLeaving(index, fee)
  } else if (!escaped) {
    queueManager.startCarLeaving(index, fee)
  } else {
    // Escaped — car just vanishes (or drives off)
    const result = parkingManager.releaseSlot(index)
    if (result) scene.remove(result.car.mesh)
  }
}
spawner.update(delta)
queueManager.update(delta)

// Update all parked car animations
parkingManager.slots.forEach(slot => {
  if (slot.car) slot.car.update(delta)
})
```

- [ ] **Step 5: Verify**

Run dev server. Cars should appear on the road, queue up, drive through the gate one by one, park in slots. As time passes, they overstay and eventually escape (money goes negative). Day/night cycle continues working.

- [ ] **Step 6: Commit**

```bash
git add src/game/parking.js src/game/queue.js src/game/spawner.js src/main.js
git commit -m "feat: parking manager, queue system, car spawner"
```

---

### Task 6: HUD (Money, Clock, Day Counter)

**Files:**
- Create: `src/ui/hud.js`
- Modify: `index.html`
- Modify: `src/style.css`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `state`, `gameClock.getTimeString()`
- Produces: `createHUD(state, gameClock)` returns `{ update(), showFeePopup(x, y, amount) }`. Updates DOM elements each frame.

- [ ] **Step 1: Add HUD HTML structure to index.html**

Inside `#ui-overlay`:
```html
<div id="hud">
  <div id="hud-money">$50</div>
  <div id="hud-time">07:00</div>
  <div id="hud-day">Day 1</div>
  <div id="hud-shop-btn">Shop</div>
</div>
```

- [ ] **Step 2: Add HUD styles to style.css**

```css
#hud {
  position: absolute; top: 12px; left: 12px; right: 12px;
  display: flex; justify-content: space-between; align-items: flex-start;
  font-family: 'Courier New', monospace;
  pointer-events: none;
}
#hud > * { pointer-events: auto; }
#hud-money {
  background: rgba(0,0,0,0.7); color: #4ade80; padding: 8px 14px;
  border-radius: 8px; font-size: 20px; font-weight: bold;
}
#hud-time {
  background: rgba(0,0,0,0.7); color: #fff; padding: 8px 14px;
  border-radius: 8px; font-size: 18px;
}
#hud-day {
  background: rgba(0,0,0,0.7); color: #fbbf24; padding: 8px 14px;
  border-radius: 8px; font-size: 16px;
}
#hud-shop-btn {
  background: #2563eb; color: #fff; padding: 10px 18px;
  border-radius: 10px; font-size: 16px; font-weight: bold;
  cursor: pointer; user-select: none;
}
#hud-shop-btn:active { background: #1d4ed8; }

.fee-popup {
  position: absolute; color: #4ade80; font-size: 18px; font-weight: bold;
  font-family: 'Courier New', monospace; pointer-events: none;
  animation: floatUp 1.5s ease-out forwards;
}
.fee-popup.penalty { color: #ef4444; }
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-40px); }
}
```

- [ ] **Step 3: Create src/ui/hud.js**

```js
export function createHUD(state, gameClock) {
  const moneyEl = document.getElementById('hud-money')
  const timeEl = document.getElementById('hud-time')
  const dayEl = document.getElementById('hud-day')
  const overlay = document.getElementById('ui-overlay')

  function update() {
    moneyEl.textContent = `$${state.money}`
    timeEl.textContent = gameClock.getTimeString()
    dayEl.textContent = `Day ${state.dayCount}`

    if (state.money < 0) moneyEl.style.color = '#ef4444'
    else moneyEl.style.color = '#4ade80'
  }

  function showFeePopup(screenX, screenY, amount) {
    const el = document.createElement('div')
    el.className = amount >= 0 ? 'fee-popup' : 'fee-popup penalty'
    el.textContent = amount >= 0 ? `+$${amount}` : `-$${Math.abs(amount)}`
    el.style.left = `${screenX}px`
    el.style.top = `${screenY}px`
    overlay.appendChild(el)
    setTimeout(() => el.remove(), 1500)
  }

  return { update, showFeePopup }
}
```

- [ ] **Step 4: Wire into main.js**

```js
import { createHUD } from './ui/hud.js'
const hud = createHUD(state, gameClock)
// In animate(): hud.update()
```

- [ ] **Step 5: Verify**

Run dev server. HUD shows money, time (advancing), day count. Money goes up/down as cars pay/escape.

- [ ] **Step 6: Commit**

```bash
git add src/ui/hud.js index.html src/style.css src/main.js
git commit -m "feat: HUD with money, clock, day counter"
```

---

### Task 7: Raycaster & Car Interaction Popup

**Files:**
- Create: `src/utils/raycaster.js`
- Create: `src/ui/carPopup.js`
- Modify: `src/style.css`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `camera`, `scene`, `parkingManager`, `state`, `renderer`
- Produces:
  - `createRaycaster(camera, renderer)` returns `{ getClickedObject(event, targetMeshes): mesh|null }`
  - `createCarPopup(state, parkingManager, camera, renderer)` returns `{ show(slotIndex), hide(), update() }`. Shows floating Ticket/Extend buttons near the tapped car, positioned by projecting 3D→screen.

- [ ] **Step 1: Create src/utils/raycaster.js**

```js
import * as THREE from 'three'

export function createRaycaster(camera, renderer) {
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function getClickedObject(event, scene) {
    const rect = renderer.domElement.getBoundingClientRect()
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    const clientY = event.touches ? event.touches[0].clientY : event.clientY
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)

    return intersects.length > 0 ? intersects[0] : null
  }

  function projectToScreen(position) {
    const vec = position.clone().project(camera)
    const rect = renderer.domElement.getBoundingClientRect()
    return {
      x: (vec.x * 0.5 + 0.5) * rect.width,
      y: (-vec.y * 0.5 + 0.5) * rect.height,
    }
  }

  return { getClickedObject, projectToScreen }
}
```

- [ ] **Step 2: Create src/ui/carPopup.js**

```js
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

    const btnRow = document.createElement('div')
    btnRow.className = 'car-popup-btns'

    if (isOverstaying && !slot.ticketed) {
      const ticketBtn = document.createElement('button')
      ticketBtn.className = 'popup-btn ticket'
      ticketBtn.textContent = `Ticket $${parkingManager.getTicketFee()}`
      ticketBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        parkingManager.ticketCar(slotIndex)
        hide()
      })
      btnRow.appendChild(ticketBtn)
    }

    if (slot.ticketed) {
      const badge = document.createElement('div')
      badge.className = 'car-popup-badge'
      badge.textContent = 'TICKETED'
      popupEl.appendChild(badge)
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
      new (await import('three')).Vector3(slotPos.x, 1.5, slotPos.z)
    )
    popupEl.style.left = `${screen.x}px`
    popupEl.style.top = `${screen.y - 60}px`
  }

  // Use synchronous THREE import instead
  let THREE_Vector3 = null
  import('three').then(m => { THREE_Vector3 = m.Vector3 })

  function update() {
    if (popupEl === null || activeSlotIndex === null || !THREE_Vector3) return
    const slotPos = lot.slotPositions[activeSlotIndex]
    if (!slotPos) return

    const screen = raycasterUtil.projectToScreen(
      new THREE_Vector3(slotPos.x, 1.5, slotPos.z)
    )
    popupEl.style.left = `${screen.x}px`
    popupEl.style.top = `${screen.y - 60}px`
  }

  return { show, hide, update, get activeSlotIndex() { return activeSlotIndex } }
}
```

- [ ] **Step 3: Add car popup styles to style.css**

```css
.car-popup {
  position: absolute; transform: translate(-50%, -100%);
  background: rgba(0,0,0,0.85); border-radius: 10px; padding: 10px;
  color: white; font-family: 'Courier New', monospace;
  min-width: 140px; text-align: center; z-index: 10;
}
.car-popup-timer { font-size: 14px; margin-bottom: 8px; color: #a3e635; }
.car-popup-timer.overtime { color: #ef4444; font-weight: bold; }
.car-popup-btns { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.popup-btn {
  padding: 6px 12px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: bold; cursor: pointer; font-family: inherit;
}
.popup-btn.ticket { background: #ef4444; color: white; }
.popup-btn.extend { background: #3b82f6; color: white; }
.popup-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.car-popup-badge {
  background: #ef4444; color: white; font-size: 11px; font-weight: bold;
  padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;
}
```

- [ ] **Step 4: Wire click/tap handling into main.js**

```js
import { createRaycaster } from './utils/raycaster.js'
import { createCarPopup } from './ui/carPopup.js'

const raycasterUtil = createRaycaster(camera, renderer)
const carPopup = createCarPopup(state, parkingManager, raycasterUtil, lot)

function handleTap(event) {
  if (!state.isRunning) return
  const hit = raycasterUtil.getClickedObject(event, scene)
  if (!hit) { carPopup.hide(); return }

  // Check if clicked on a parked car
  let clickedMesh = hit.object
  // Walk up to find car group
  while (clickedMesh.parent && clickedMesh.parent !== scene) {
    clickedMesh = clickedMesh.parent
  }

  // Find which slot this car belongs to
  const slotIndex = parkingManager.slots.findIndex(s => s.car && s.car.mesh === clickedMesh)
  if (slotIndex !== -1) {
    carPopup.show(slotIndex)
  } else if (state.gateBroken && /* clicked near gate */ hit.point.z > 0 && hit.point.z < 4) {
    state.gateBroken = false
  } else {
    carPopup.hide()
  }
}

renderer.domElement.addEventListener('click', handleTap)
renderer.domElement.addEventListener('touchstart', handleTap, { passive: true })

// In animate(): carPopup.update()
```

- [ ] **Step 5: Verify**

Run dev server. Tap/click a parked car — popup appears with timer and Extend button. When a car overstays (timer red), Ticket button appears. Clicking Ticket marks the car. Tapping elsewhere dismisses popup.

- [ ] **Step 6: Commit**

```bash
git add src/utils/raycaster.js src/ui/carPopup.js src/style.css src/main.js
git commit -m "feat: raycaster and car interaction popup (ticket/extend)"
```

---

### Task 8: Gate Breaking & Repair

**Files:**
- Create: `src/ui/gateAlert.js`
- Modify: `src/game/state.js` (add gate break logic to a helper)
- Modify: `src/style.css`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `state`, `raycasterUtil`, `gate`
- Produces: `createGateAlert(state, raycasterUtil, gate)` returns `{ update() }`. Shows pulsing alert when gate is broken. Gate break timing is managed in the main loop using state fields.

- [ ] **Step 1: Add gate break timing logic**

In `main.js`, add gate break logic to the game loop:

```js
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
```

- [ ] **Step 2: Create src/ui/gateAlert.js**

```js
import * as THREE from 'three'

export function createGateAlert(state, raycasterUtil, gate) {
  const overlay = document.getElementById('ui-overlay')
  let alertEl = null

  function show() {
    if (alertEl) return
    alertEl = document.createElement('div')
    alertEl.className = 'gate-alert'
    alertEl.innerHTML = '⚠️ GATE BROKEN<br><span>Tap to fix!</span>'
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
```

- [ ] **Step 3: Add gate alert styles**

```css
.gate-alert {
  position: absolute; transform: translate(-50%, -100%);
  background: #dc2626; color: white; padding: 10px 16px;
  border-radius: 10px; font-family: 'Courier New', monospace;
  font-size: 16px; font-weight: bold; text-align: center;
  cursor: pointer; z-index: 10;
  animation: pulse 0.8s ease-in-out infinite alternate;
}
.gate-alert span { font-size: 12px; font-weight: normal; }
@keyframes pulse {
  from { transform: translate(-50%, -100%) scale(1); }
  to { transform: translate(-50%, -100%) scale(1.1); }
}
```

- [ ] **Step 4: Wire into main.js**

```js
import { createGateAlert } from './ui/gateAlert.js'
const gateAlert = createGateAlert(state, raycasterUtil, gate)

// In animate():
updateGateBreak(delta)
gateAlert.update()
```

- [ ] **Step 5: Verify**

Run dev server. After some time, gate breaks — pulsing red alert appears. Clicking it fixes the gate. While broken, no cars pass through (queue builds). Higher difficulty = more frequent breaks.

- [ ] **Step 6: Commit**

```bash
git add src/ui/gateAlert.js src/style.css src/main.js
git commit -m "feat: gate breaking mechanic with tap-to-fix alert"
```

---

### Task 9: Upgrade Shop

**Files:**
- Create: `src/ui/shop.js`
- Create: `src/game/upgrades.js`
- Modify: `src/style.css`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `state`, `parkingManager`, `lot`, `building`
- Produces: `createShop(state, parkingManager, lot, building)` returns `{ open(), close(), isOpen }`. Full-screen overlay with upgrade cards. Buying upgrades mutates state and triggers lot/building rebuilds where needed.

- [ ] **Step 1: Create src/game/upgrades.js**

```js
export function getUpgradeCost(type, state) {
  switch (type) {
    case 'gateReliability':
      if (state.upgrades.gateReliability >= 4) return null
      return 50 + state.upgrades.gateReliability * 30
    case 'addRow':
      return 80 + state.upgrades.extraRows * 40
    case 'addCol':
      return 80 + state.upgrades.extraCols * 40
    case 'queueCapacity':
      return 40 + state.upgrades.extraQueueSlots * 20
    case 'warden':
      return 60 + state.difficulty * 10
    case 'tow':
      return 50 + state.difficulty * 10
    default: return null
  }
}

export function buyUpgrade(type, state) {
  const cost = getUpgradeCost(type, state)
  if (cost === null || state.money < cost) return false
  state.money -= cost

  switch (type) {
    case 'gateReliability': state.upgrades.gateReliability++; break
    case 'addRow': state.upgrades.extraRows++; break
    case 'addCol': state.upgrades.extraCols++; break
    case 'queueCapacity': state.upgrades.extraQueueSlots++; break
    case 'warden':
      state.wardenActive = true
      state.wardenTimer = 5 // 5 game-minutes
      break
    case 'tow':
      state.towActive = true
      state.towTimer = 5
      break
  }
  return true
}
```

- [ ] **Step 2: Create src/ui/shop.js**

```js
import { getUpgradeCost, buyUpgrade } from '../game/upgrades.js'
import { getBaseRows, getBaseCols, getQueueCapacity } from '../game/state.js'

const UPGRADES = [
  { key: 'gateReliability', name: 'Gate Reliability', desc: 'Breaks less often', icon: '🔧' },
  { key: 'addRow', name: 'Add Row', desc: '+1 parking row', icon: '➕' },
  { key: 'addCol', name: 'Add Column', desc: '+1 parking column', icon: '➕' },
  { key: 'queueCapacity', name: 'Queue Capacity', desc: '+2 queue slots', icon: '🚗' },
  { key: 'warden', name: 'Parking Warden', desc: 'Auto-ticket 5 game-min', icon: '👮' },
  { key: 'tow', name: 'Auto-Tow', desc: 'Instant tow 5 game-min', icon: '🚛' },
]

export function createShop(state, parkingManager, lot, building) {
  const overlay = document.getElementById('ui-overlay')
  let shopEl = null
  let isOpen = false

  function open() {
    if (shopEl) return
    isOpen = true
    state.isPaused = true

    shopEl = document.createElement('div')
    shopEl.className = 'shop-overlay'

    const title = document.createElement('h2')
    title.textContent = 'Upgrade Shop'
    shopEl.appendChild(title)

    const info = document.createElement('div')
    info.className = 'shop-info'
    info.textContent = `Lot: ${getBaseRows(state)}×${getBaseCols(state)} | Queue: ${getQueueCapacity(state)} | Gate Lvl: ${state.upgrades.gateReliability + 1}/5`
    shopEl.appendChild(info)

    const grid = document.createElement('div')
    grid.className = 'shop-grid'

    for (const upgrade of UPGRADES) {
      const cost = getUpgradeCost(upgrade.key, state)
      const card = document.createElement('div')
      card.className = 'shop-card'

      if (cost === null) {
        card.classList.add('maxed')
        card.innerHTML = `
          <div class="shop-icon">${upgrade.icon}</div>
          <div class="shop-name">${upgrade.name}</div>
          <div class="shop-desc">MAX LEVEL</div>
        `
      } else {
        const canAfford = state.money >= cost
        if (!canAfford) card.classList.add('cant-afford')
        card.innerHTML = `
          <div class="shop-icon">${upgrade.icon}</div>
          <div class="shop-name">${upgrade.name}</div>
          <div class="shop-desc">${upgrade.desc}</div>
          <div class="shop-cost">$${cost}</div>
        `
        card.addEventListener('click', () => {
          if (buyUpgrade(upgrade.key, state)) {
            if (upgrade.key === 'addRow' || upgrade.key === 'addCol') {
              lot.rebuildLot()
              parkingManager.rebuildSlots()
              building.rebuild()
            }
            close()
            open() // reopen with updated state
          }
        })
      }

      grid.appendChild(card)
    }

    shopEl.appendChild(grid)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'shop-close'
    closeBtn.textContent = 'Close'
    closeBtn.addEventListener('click', close)
    shopEl.appendChild(closeBtn)

    overlay.appendChild(shopEl)
  }

  function close() {
    if (shopEl) {
      shopEl.remove()
      shopEl = null
    }
    isOpen = false
    state.isPaused = false
  }

  return { open, close, get isOpen() { return isOpen } }
}
```

- [ ] **Step 3: Add shop styles to style.css**

```css
.shop-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 20px;
  font-family: 'Courier New', monospace; color: white; z-index: 20;
}
.shop-overlay h2 { font-size: 28px; margin-bottom: 10px; color: #fbbf24; }
.shop-info { font-size: 13px; color: #aaa; margin-bottom: 16px; }
.shop-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px; max-width: 500px; width: 100%;
}
.shop-card {
  background: rgba(255,255,255,0.1); border-radius: 10px; padding: 14px;
  text-align: center; cursor: pointer; transition: background 0.2s;
}
.shop-card:hover { background: rgba(255,255,255,0.2); }
.shop-card.cant-afford { opacity: 0.4; cursor: not-allowed; }
.shop-card.maxed { opacity: 0.5; cursor: default; }
.shop-icon { font-size: 28px; margin-bottom: 6px; }
.shop-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
.shop-desc { font-size: 11px; color: #aaa; margin-bottom: 6px; }
.shop-cost { font-size: 16px; font-weight: bold; color: #4ade80; }
.shop-close {
  margin-top: 20px; padding: 10px 30px; background: #dc2626; color: white;
  border: none; border-radius: 8px; font-size: 16px; cursor: pointer;
  font-family: inherit; font-weight: bold;
}
```

- [ ] **Step 4: Wire into main.js**

```js
import { createShop } from './ui/shop.js'
const shop = createShop(state, parkingManager, lot, building)

document.getElementById('hud-shop-btn').addEventListener('click', () => {
  if (shop.isOpen) shop.close()
  else shop.open()
})
```

- [ ] **Step 5: Verify**

Run dev server. Click "Shop" button — overlay appears with 6 upgrade cards. Buy "Add Row" — lot expands with new row visible. Buy warden — auto-ticketing begins. Close returns to game.

- [ ] **Step 6: Commit**

```bash
git add src/game/upgrades.js src/ui/shop.js src/style.css src/main.js
git commit -m "feat: upgrade shop with all 6 upgrades"
```

---

### Task 10: Start Screen, Game Over, Highscore

**Files:**
- Create: `src/ui/startScreen.js`
- Create: `src/ui/gameOver.js`
- Modify: `src/style.css`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `state`
- Produces:
  - `createStartScreen(onPlay)` returns `{ show(), hide() }`. Shows title + buttons. Calls `onPlay()` when Play is clicked.
  - `createGameOver(state, onRestart)` returns `{ show(), hide() }`. Shows score, highscore, restart button.

- [ ] **Step 1: Create src/ui/startScreen.js**

```js
export function createStartScreen(state, onPlay) {
  const overlay = document.getElementById('ui-overlay')
  let el = null

  function show() {
    el = document.createElement('div')
    el.className = 'start-screen'
    el.innerHTML = `
      <div class="start-title">
        <div class="title-badge">P</div>
        <h1>MINI<br>PARKERING</h1>
      </div>
      <div class="start-buttons">
        <button class="start-btn play">Play</button>
        <button class="start-btn highscore">Highscore: $${state.highscore}</button>
        <button class="start-btn options">Options</button>
      </div>
    `

    el.querySelector('.play').addEventListener('click', () => {
      hide()
      onPlay()
    })

    overlay.appendChild(el)
  }

  function hide() {
    if (el) { el.remove(); el = null }
  }

  return { show, hide }
}
```

- [ ] **Step 2: Create src/ui/gameOver.js**

```js
import { saveHighscore } from '../game/state.js'

export function createGameOver(state, onRestart) {
  const overlay = document.getElementById('ui-overlay')
  let el = null

  function show() {
    saveHighscore(state)

    el = document.createElement('div')
    el.className = 'gameover-screen'
    el.innerHTML = `
      <h1>GAME OVER</h1>
      <div class="gameover-reason">Queue overflow!</div>
      <div class="gameover-score">Score: $${Math.max(0, state.money)}</div>
      <div class="gameover-high">Best: $${state.highscore}</div>
      <div class="gameover-stats">
        <div>Day ${state.dayCount}</div>
        <div>Difficulty ${state.difficulty}</div>
      </div>
      <button class="start-btn play">Play Again</button>
    `

    el.querySelector('.play').addEventListener('click', () => {
      hide()
      onRestart()
    })

    overlay.appendChild(el)
  }

  function hide() {
    if (el) { el.remove(); el = null }
  }

  return { show, hide }
}
```

- [ ] **Step 3: Add start/gameover styles**

```css
.start-screen, .gameover-screen {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: 'Courier New', monospace; color: white; z-index: 30;
}
.start-title { text-align: center; margin-bottom: 40px; }
.title-badge {
  display: inline-block; width: 60px; height: 60px; line-height: 60px;
  background: #2563eb; color: white; font-size: 36px; font-weight: bold;
  border-radius: 12px; margin-bottom: 16px;
}
.start-title h1 { font-size: 48px; line-height: 1.1; letter-spacing: 4px; }
.start-buttons { display: flex; flex-direction: column; gap: 12px; min-width: 200px; }
.start-btn {
  padding: 14px 24px; border: none; border-radius: 10px;
  font-size: 18px; font-weight: bold; cursor: pointer;
  font-family: 'Courier New', monospace; text-align: left;
}
.start-btn.play { background: #22c55e; color: white; }
.start-btn.highscore { background: rgba(255,255,255,0.15); color: #fbbf24; }
.start-btn.options { background: rgba(255,255,255,0.15); color: #aaa; }
.gameover-screen h1 { font-size: 42px; color: #ef4444; margin-bottom: 10px; }
.gameover-reason { font-size: 16px; color: #aaa; margin-bottom: 20px; }
.gameover-score { font-size: 32px; color: #4ade80; font-weight: bold; }
.gameover-high { font-size: 18px; color: #fbbf24; margin-bottom: 16px; }
.gameover-stats { display: flex; gap: 20px; font-size: 14px; color: #aaa; margin-bottom: 24px; }
```

- [ ] **Step 4: Wire into main.js — full game flow**

Restructure main.js so the game starts paused on the start screen. Play button starts the game. Game over triggers the game over screen. Restart resets state and scene.

```js
// Add imports
import { createStartScreen } from './ui/startScreen.js'
import { createGameOver } from './ui/gameOver.js'
import { createGameState } from './game/state.js'

let state, gameClock, parkingManager, queueManager, spawner, hud, shop, gateAlert, carPopup

function startGame() {
  // Reset state
  state = createGameState()
  state.isRunning = true
  // Re-init all systems with new state...
  // (rebuild lot, reconnect managers, show HUD, hide start screen)
  document.getElementById('hud').style.display = 'flex'
}

function handleGameOver() {
  document.getElementById('hud').style.display = 'none'
  gameOverScreen.show()
}

const startScreen = createStartScreen(state, startGame)
const gameOverScreen = createGameOver(state, () => {
  startGame()
})

startScreen.show()

// In animate(), check for game over:
if (state.isGameOver && !gameOverShown) {
  gameOverShown = true
  handleGameOver()
}
```

(The actual implementation will need to fully restructure main.js init flow — the subagent should use the code above as guidance and restructure main.js so all game systems can be torn down and rebuilt on restart.)

- [ ] **Step 5: Verify**

Run dev server. Start screen appears with "MINI PARKERING" title and buttons. Click Play — game starts. Let queue overflow — game over screen shows score and highscore. Click Play Again — fresh game.

- [ ] **Step 6: Commit**

```bash
git add src/ui/startScreen.js src/ui/gameOver.js src/style.css src/main.js
git commit -m "feat: start screen, game over, highscore persistence"
```

---

### Task 11: Warden & Tow Truck Visuals

**Files:**
- Create: `src/scene/warden.js`
- Create: `src/scene/towTruck.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `state`, `lot.slotPositions`, `parkingManager`
- Produces:
  - `createWarden(scene, state, lot)` returns `{ update(delta) }`. Small figure that appears when `state.wardenActive`, patrols between rows.
  - `createTowTruck(scene)` returns `{ towCar(carMesh, gatePosition, onDone), update(delta) }`. Animates a tow truck hooking a car and dragging it to the gate.

- [ ] **Step 1: Create src/scene/warden.js**

```js
import * as THREE from 'three'

export function createWarden(scene, state, lot) {
  const group = new THREE.Group()
  group.visible = false

  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 1, 8),
    new THREE.MeshLambertMaterial({ color: 0x1a365d })
  )
  body.position.y = 0.5
  group.add(body)

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xfad5a5 })
  )
  head.position.y = 1.2
  group.add(head)

  // Hat
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.22, 0.15, 8),
    new THREE.MeshLambertMaterial({ color: 0x1e40af })
  )
  hat.position.y = 1.4
  group.add(hat)

  scene.add(group)

  let patrolIndex = 0
  let patrolTarget = new THREE.Vector3()

  function update(delta) {
    if (!state.wardenActive) {
      group.visible = false
      return
    }

    group.visible = true
    const positions = lot.slotPositions
    if (positions.length === 0) return

    const target = positions[patrolIndex % positions.length]
    patrolTarget.set(target.x, 0, target.z)

    const dir = patrolTarget.clone().sub(group.position)
    const dist = dir.length()

    if (dist < 0.5) {
      patrolIndex = (patrolIndex + 1) % positions.length
    } else {
      dir.normalize()
      group.position.add(dir.multiplyScalar(Math.min(3 * delta, dist)))
      group.rotation.y = Math.atan2(dir.x, dir.z)
    }
  }

  return { update }
}
```

- [ ] **Step 2: Create src/scene/towTruck.js**

```js
import * as THREE from 'three'

export function createTowTruck(scene) {
  const truckGroup = new THREE.Group()
  truckGroup.visible = false

  // Truck body (larger than car)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 3.5),
    new THREE.MeshLambertMaterial({ color: 0xf59e0b })
  )
  body.position.y = 0.4
  truckGroup.add(body)

  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 1.2),
    new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
  )
  cabin.position.set(0, 1, 0.8)
  truckGroup.add(cabin)

  // Flatbed
  const flatbed = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.1, 2),
    new THREE.MeshLambertMaterial({ color: 0x666666 })
  )
  flatbed.position.set(0, 0.85, -0.7)
  truckGroup.add(flatbed)

  scene.add(truckGroup)

  let activeTow = null

  function towCar(carMesh, slotPos, gatePos, onDone) {
    truckGroup.visible = true
    truckGroup.position.set(slotPos.x, 0, slotPos.z + 3)

    activeTow = {
      phase: 'approach', // approach → hookup → drag → done
      carMesh,
      slotPos: new THREE.Vector3(slotPos.x, 0, slotPos.z),
      gatePos: new THREE.Vector3(gatePos.x ?? 0, 0, gatePos.z ?? 30),
      onDone,
    }
  }

  function update(delta) {
    if (!activeTow) return

    const speed = 5
    const t = activeTow

    if (t.phase === 'approach') {
      const dir = t.slotPos.clone().sub(truckGroup.position)
      if (dir.length() < 0.5) {
        t.phase = 'hookup'
        t.carMesh.position.set(truckGroup.position.x, 0.9, truckGroup.position.z - 1.5)
      } else {
        dir.normalize()
        truckGroup.position.add(dir.multiplyScalar(speed * delta))
        truckGroup.rotation.y = Math.atan2(dir.x, dir.z)
      }
    } else if (t.phase === 'hookup') {
      t.phase = 'drag'
    } else if (t.phase === 'drag') {
      const dir = t.gatePos.clone().sub(truckGroup.position)
      if (dir.length() < 1) {
        t.phase = 'done'
        truckGroup.visible = false
        scene.remove(t.carMesh)
        if (t.onDone) t.onDone()
        activeTow = null
      } else {
        dir.normalize()
        truckGroup.position.add(dir.multiplyScalar(speed * delta))
        t.carMesh.position.set(truckGroup.position.x, 0.9, truckGroup.position.z - 1.5)
        truckGroup.rotation.y = Math.atan2(dir.x, dir.z)
      }
    }
  }

  return { towCar, update, get isBusy() { return !!activeTow } }
}
```

- [ ] **Step 3: Wire into main.js**

```js
import { createWarden } from './scene/warden.js'
import { createTowTruck } from './scene/towTruck.js'

const warden = createWarden(scene, state, lot)
const towTruck = createTowTruck(scene)

// In animate():
warden.update(delta)
towTruck.update(delta)

// In removal handling, when towActive and car is ticketed:
if (state.towActive && !escaped && !towTruck.isBusy) {
  const slot = parkingManager.slots[index]
  const slotPos = lot.slotPositions[index]
  towTruck.towCar(slot.car.mesh, slotPos, { x: 0, z: 30 }, () => {
    state.money += fee
  })
  parkingManager.releaseSlot(index)
}
```

- [ ] **Step 4: Verify**

Run dev server. Buy warden from shop — small figure patrols lot, auto-tickets overstayers. Buy tow — yellow truck appears, hooks ticketed cars, drags them away.

- [ ] **Step 5: Commit**

```bash
git add src/scene/warden.js src/scene/towTruck.js src/main.js
git commit -m "feat: parking warden and tow truck visuals"
```

---

### Task 12: Floating Car Timers

**Files:**
- Create: `src/ui/carTimers.js`
- Modify: `src/style.css`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `parkingManager.slots`, `lot.slotPositions`, `raycasterUtil`
- Produces: `createCarTimers(parkingManager, lot, raycasterUtil)` returns `{ update() }`. Renders a floating HTML timer above each parked car, positioned via 3D→screen projection. Green for normal countdown, red for overstay.

- [ ] **Step 1: Create src/ui/carTimers.js**

```js
import * as THREE from 'three'

export function createCarTimers(parkingManager, lot, raycasterUtil) {
  const overlay = document.getElementById('ui-overlay')
  const container = document.createElement('div')
  container.className = 'car-timers-container'
  overlay.appendChild(container)

  let timerEls = []

  function update() {
    // Remove old timers
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

      const el = document.createElement('div')

      if (slot.timerRemaining > 0) {
        const mins = Math.ceil(slot.timerRemaining)
        const h = Math.floor(mins / 60)
        const m = mins % 60
        el.className = 'car-timer'
        el.textContent = h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`
      } else {
        const mins = Math.ceil(slot.overstayTime)
        el.className = 'car-timer overtime'
        el.textContent = `+${mins}m`
        if (slot.ticketed) {
          el.classList.add('ticketed')
          el.textContent = `🎫 +${mins}m`
        }
      }

      el.style.left = `${screen.x}px`
      el.style.top = `${screen.y}px`
      container.appendChild(el)
      timerEls.push(el)
    }
  }

  return { update }
}
```

- [ ] **Step 2: Add timer styles**

```css
.car-timers-container { position: absolute; inset: 0; pointer-events: none; }
.car-timer {
  position: absolute; transform: translate(-50%, -100%);
  background: rgba(0,0,0,0.7); color: #a3e635; padding: 2px 6px;
  border-radius: 4px; font-family: 'Courier New', monospace;
  font-size: 11px; font-weight: bold; white-space: nowrap;
}
.car-timer.overtime { color: #ef4444; }
.car-timer.ticketed { color: #f59e0b; }
```

- [ ] **Step 3: Wire into main.js**

```js
import { createCarTimers } from './ui/carTimers.js'
const carTimers = createCarTimers(parkingManager, lot, raycasterUtil)
// In animate(): carTimers.update()
```

- [ ] **Step 4: Verify**

Run dev server. Each parked car has a floating timer. Counts down green, turns red on overstay, shows ticket badge when ticketed.

- [ ] **Step 5: Commit**

```bash
git add src/ui/carTimers.js src/style.css src/main.js
git commit -m "feat: floating car timers with overstay/ticketed states"
```

---

### Task 13: Polish & Mobile Responsiveness

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`
- Modify: `index.html`

**Interfaces:**
- No new interfaces. This task improves camera framing on narrow screens, adds touch event handling refinements, and adjusts UI sizing for mobile.

- [ ] **Step 1: Responsive camera adjustment**

In main.js resize handler, adjust `frustumSize` based on aspect ratio so the lot is always visible. On portrait (mobile), zoom out more:

```js
function updateCamera() {
  const a = window.innerWidth / window.innerHeight
  const size = a < 1 ? 40 : 30 // zoom out more on portrait
  camera.left = -size * a / 2
  camera.right = size * a / 2
  camera.top = size / 2
  camera.bottom = -size / 2
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', updateCamera)
updateCamera()
```

- [ ] **Step 2: Touch-friendly UI adjustments in style.css**

```css
@media (max-width: 600px) {
  .start-title h1 { font-size: 32px; }
  #hud-money, #hud-time, #hud-day { font-size: 14px; padding: 6px 10px; }
  #hud-shop-btn { padding: 8px 14px; font-size: 14px; }
  .shop-grid { grid-template-columns: repeat(2, 1fr); }
  .car-popup { min-width: 120px; }
  .popup-btn { padding: 8px 10px; font-size: 12px; }
}
```

- [ ] **Step 3: Prevent double-tap zoom and context menus on mobile**

In index.html, ensure viewport meta is set (already done). In style.css:

```css
canvas { touch-action: manipulation; }
body { -webkit-user-select: none; user-select: none; }
```

- [ ] **Step 4: Add favicon and meta**

In `index.html` head:
```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🅿️</text></svg>">
<meta name="theme-color" content="#1a1a2e">
<meta name="apple-mobile-web-app-capable" content="yes">
```

- [ ] **Step 5: Verify**

Run dev server on desktop and test with browser responsive mode (iPhone SE, iPad). Game is playable on both. UI scales. Camera shows full lot on portrait. Tap interactions work without zoom.

- [ ] **Step 6: Commit**

```bash
git add index.html src/main.js src/style.css
git commit -m "feat: mobile responsiveness and polish"
```

---

### Task 14: Integration, Bug Fixes, Final Tuning

**Files:**
- Modify: `src/main.js` (full restructure for clean game flow)
- Possibly modify: any file with bugs found during integration

**Interfaces:**
- No new interfaces. This task ensures all systems work together cleanly: start→play→game over→restart cycle; all upgrades functional; no orphaned car meshes; correct fee collection with popups.

- [ ] **Step 1: Full game flow restructure in main.js**

Restructure `main.js` so `startGame()` fully tears down and rebuilds all game systems. Ensure:
- Start screen shows on load
- Play creates fresh state + all managers
- Game over screen appears on queue overflow
- Play Again fully resets (no leftover cars/timers in scene)
- HUD hides/shows with game state
- Shop pauses game correctly

This is the integration task — the subagent should read the full main.js, identify any disconnected wiring, and restructure as needed. The key contract: every `animate()` frame should call, in order:

1. `gameClock.update(delta)`
2. `updateGateBreak(delta)`
3. `parkingManager.update(delta)` → process removals
4. `spawner.update(delta)`
5. `queueManager.update(delta)`
6. `lighting.update(state.gameHour)`
7. `gate.update(delta)`
8. `warden.update(delta)`
9. `towTruck.update(delta)`
10. `hud.update()`
11. `carTimers.update()`
12. `carPopup.update()`
13. `gateAlert.update()`
14. Check `state.isGameOver` → show game over screen

All parked cars' `update(delta)` must also be called (for enter/leave animations).

- [ ] **Step 2: Test full game flow**

Run dev server. Play through:
- Start screen → Play
- Cars arrive and park
- Let some overstay → ticket them
- Extend a car's time
- Gate breaks → fix it
- Buy upgrades (row, warden, tow)
- Let queue overflow → game over
- Check highscore → Play Again

- [ ] **Step 3: Fix any bugs found**

Address any issues: orphaned meshes, wrong fee amounts, broken restart, cars overlapping, etc.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: full game integration and bug fixes"
```
