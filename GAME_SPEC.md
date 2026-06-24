# Mini Parkering — Complete Game Specification

A 3D isometric parking lot management game built with Three.js and Vite. The player manages a parking lot, ticketing overstaying cars and upgrading facilities, while cars arrive in waves throughout the game day. The game gets progressively harder as days pass.

## Tech Stack

- **Renderer:** Three.js (OrthographicCamera, isometric view)
- **Bundler:** Vite 5 (compatible with Node 18+)
- **UI:** Pure HTML/CSS overlays on a `<canvas>` — no React, no framework
- **Debug:** dialkit (`dialkit/store` for vanilla JS) — real-time tuning panel
- **Style:** Swiss minimalist — Helvetica/system fonts, black/white/red palette, uppercase labels, no border-radius

## Architecture

```
index.html          — canvas + UI overlay shell
src/main.js         — orchestrator: creates scene, wires systems, runs game loop
src/style.css       — all CSS (HUD, popups, shop, screens, debug panel)
src/game/           — pure logic (no Three.js rendering)
  state.js          — game state factory, level configs, highscore
  clock.js          — game clock (time-of-day, day/night cycle, warden/tow timers)
  parking.js        — slot management, parking timers, fees, ticketing
  queue.js          — car queue, entry/exit waypoint animations
  spawner.js        — time-of-day spawn rates, difficulty scaling
  upgrades.js       — upgrade costs and purchase logic
src/scene/          — Three.js scene objects
  lot.js            — parking lot mesh with grid lines, P symbols, arrows
  building.js       — building behind the lot
  gate.js           — dual entry/exit barrier gates
  road.js           — two-lane road with sidewalks
  car.js            — car mesh factory + waypoint animation system
  trees.js          — procedural sphere-foliage trees
  lighting.js       — day/night cycle (sky color, sun position, ambient)
  warden.js         — parking warden figure (patrols and auto-tickets)
  towTruck.js       — tow truck (auto-removes ticketed cars)
src/ui/             — HTML/CSS overlay systems
  hud.js            — money, clock, day display, shop button, fee popups
  carPopup.js       — tap-a-car popup (ticket / extend buttons)
  carTimers.js      — floating timer labels above parked cars
  gateAlert.js      — "GATE BROKEN" pulsing alert
  shop.js           — fullscreen upgrade shop overlay
  startScreen.js    — title screen with PLAY button
  gameOver.js       — game over screen with score/stats
  debugPanel.js     — dialkit-powered tuning panel
src/utils/
  raycaster.js      — click/tap detection on 3D objects
```

## Game Flow

1. **Start screen** — title "MINI PARKERING" with P badge, PLAY / HIGHSCORE / OPTIONS buttons
2. **Gameplay** — isometric view of parking lot, cars arrive in queue, player manages lot
3. **Game over** — triggered when queue overflows (no room for new car), shows score + stats

### Core Loop (runs in `requestAnimationFrame`)

```
gameClock.update(delta)          — advance game time
detect difficulty change         — expand lot if level config changes
parkingManager.update(delta)     — tick parking timers, flag escapes/departures
handle car removals              — animate cars leaving via exit gate or tow truck
spawner.update(delta)            — spawn new cars based on time-of-day + difficulty
queueManager.update(delta)       — animate queue cars, assign to slots
updateGateBreak(delta)           — random gate breakage chance
warden.update(delta)             — patrol and auto-ticket
towTruck.update(delta)           — tow animation
hud/carPopup/gateAlert/timers   — update UI overlays
renderer.render(scene, camera)   — draw frame
```

## Camera & Scene

- **Camera:** OrthographicCamera, frustum size 40 (landscape) or 50 (portrait)
- **Position:** (20, 20, 20), lookAt (0, 0, -3)
- **Ground:** 80x80 plane, color `0x8fb896` (sage green)
- **Scene background:** `0xc5dde8` (soft blue, updated by lighting system)

## Color Palette (soft isometric pastel theme)

| Element | Hex | Description |
|---------|-----|-------------|
| Sky (noon) | `0xc5dde8` | Soft powder blue |
| Grass | `0x8fb896` | Sage green |
| Road | `0xc9bfb0` | Warm beige-gray |
| Sidewalks | `0xd4cfc5` | Light warm gray |
| Lot surface | `0x8a8578` | Warm medium gray |
| Lot curb | `0xb8b2a8` | Soft stone |
| Lot grid lines | `0xf0ece4` | Off-white cream |
| Lot lane lines | `0xe0c878` | Muted gold |
| Building body | `0xd4c8b8` | Warm beige |
| Building roof | `0x6b8e9e` | Soft teal-blue |
| Building door | `0x6a5d50` | Warm brown |
| Building windows | `0xa8d4e6` | Light sky blue |
| Tree foliage | `0x6aaa7a` | Soft green |
| Tree trunk | `0x8b7355` | Warm brown |
| Gate booth | `0xe8e0d0` | Cream |
| Gate arm | `0xe07060` | Muted coral |
| Entry sign | `0x6aaa78` | Muted green |
| Exit sign | `0xc65050` | Muted red |
| Tow truck body | `0xd4a860` | Warm amber |
| Tow truck cabin | `0xe0c080` | Light gold |

### Car Colors (8 muted pastels)
`0xd4726a` coral, `0x6a9ebd` steel blue, `0xe8c86a` sand yellow, `0x7ab88a` sage green, `0x9e84b0` lavender, `0xe0d5c4` cream, `0x6db8a8` teal, `0x8a9aa8` blue-gray

### Car Stripe Colors
`0xf0ece4` cream, `0xe8d8a0` pale gold, `0x606060` gray, `0xd0926a` terracotta

## Lighting / Day-Night Cycle

Keyframes at hours [0, 5, 7, 12, 18, 20, 24] with linear interpolation:

| Hour | Sky | Sun Intensity | Ambient Intensity |
|------|-----|---------------|-------------------|
| 0 (midnight) | `0x1a1a30` | 0.05 | 0.15 |
| 5 (pre-dawn) | `0x1a1a30` | 0.1 | 0.2 |
| 7 (sunrise) | `0xe8b090` | 0.5 | 0.5 |
| 12 (noon) | `0xc5dde8` | 1.0 | 0.6 |
| 18 (sunset) | `0xe8b090` | 0.5 | 0.5 |
| 20 (dusk) | `0x2a2a48` | 0.1 | 0.2 |
| 24 | `0x1a1a30` | 0.05 | 0.15 |

Sun rotates around the scene based on game hour. Shadow map: 1024x1024, camera bounds -20 to 20.

## Game State

```js
{
  money: 50,
  gameHour: 7.0,        // starts at 7 AM
  dayCount: 1,
  difficulty: 1,         // = dayCount
  isRunning: false,
  isGameOver: false,
  isPaused: false,
  highscore: (from localStorage),
  upgrades: {
    gateReliability: 0,  // 0-4
    extraQueueSlots: 0,   // unlimited
  },
  wardenActive: false,
  wardenTimer: 0,
  towActive: false,
  towTimer: 0,
  gateBroken: false,
  gateBreakTimer: 0,
}
```

## Level Configs (lot size scales with difficulty/dayCount)

| Level | Rows | Cols | Slots (rows*cols*2) | Queue Cap |
|-------|------|------|---------------------|-----------|
| 1 | 3 | 2 | 12 | 5 |
| 2 | 3 | 3 | 18 | 6 |
| 3 | 4 | 3 | 24 | 7 |
| 4 | 4 | 4 | 32 | 8 |
| 5+ | 5 | 4 | 40 | 10 |

Slots are arranged in two blocks flanking a center driving lane: left block and right block, each `cols` wide. Total slot count = rows * cols * 2.

## Game Clock

- **Speed:** 2 game-hours = 3 real seconds (default), tunable via debug panel
- **GAME_HOURS_PER_REAL_SECOND** = 0.667
- Game starts at 7:00 AM, day rolls over at 24:00
- On day rollover: `dayCount++`, `difficulty = dayCount`
- When difficulty changes AND level config changes, the lot rebuilds and expands

## Parking Lot Layout

```
SLOT_WIDTH = 3.4    SLOT_DEPTH = 5.0
LANE_WIDTH = 3.5    LOT_PADDING = 1.5

Layout:
  [left parking block] [center lane] [right parking block]
  
Left slots:  x = -LANE_WIDTH/2 - (col+0.5)*SLOT_WIDTH
Right slots: x = +LANE_WIDTH/2 + (col+0.5)*SLOT_WIDTH
All slots:   z = -row * SLOT_DEPTH - SLOT_DEPTH/2
```

Visual elements:
- Dark gray surface with stone curb border
- White grid lines (vertical column dividers, horizontal row dividers)
- Yellow lane edge lines along center driving lane
- "P" text (canvas-generated, semi-transparent) in each parking space
- Directional arrows (canvas-generated) in the center lane
- White center lane dashes

## Dual Gate System

- **Entry gate** at (3, 0, 2) — right side, barrier arm extends right
- **Exit gate** at (-3, 0, 2) — left side, barrier arm extends left
- Each gate: booth (cream), barrier arm (coral with white stripes), post
- Green sign above entry, red sign above exit
- Barrier lifts (rotates -90deg on Z) when cars pass, animated at speed factor 5

## Two-Lane Road

- Road: width=12, length=35, positioned at z=19, warm beige-gray
- Right lane (x=3): incoming queue cars
- Left lane (x=-3): exiting cars drive away
- Center divider: dashed white line
- Sidewalks on outer edges
- 12 queue positions on right lane: x=3, z starting at 6, spaced 3.5 apart

## Car System

### Mesh
- Body: 1.6 x 0.6 x 2.8, random color from 8-color palette
- Cabin (windshield): 1.3 x 0.5 x 1.4, soft blue `0xc8dce8`
- Random stripe across hood from 4 stripe colors
- 4 dark wheels (cylinder), 2 headlights (warm yellow), 2 taillights (red)

### Waypoint Animation
- Cars follow a list of waypoint positions
- Speed default=6, configurable per path
- Cars face direction of travel (or reverse for parking)
- `onArrive` callback when final waypoint reached

### Entry Path (right lane → entry gate → center lane → slot)
1. Queue position on right lane (x=3, z=6+i*3.5)
2. Entry gate (3, 3) → (3, 1) → center lane (0, 0)
3. Slot position

### Exit Path (slot → center lane → exit gate → left lane away)
1. Slot → center lane (0, 0)
2. Exit gate approach (-3, 1) → (-3, 3)
3. Drive away on left lane (-3, 35)

## Spawn System

### Base Rates (cars per game-hour)
| Time | Rate | Description |
|------|------|-------------|
| 00-05 | 0 | Night (no cars) |
| 05-07 | 1 | Early morning |
| 07-09 | 3 | Morning rush |
| 09-11 | 2 | Mid-morning |
| 11-13 | 3 | Lunch rush |
| 13-17 | 2 | Afternoon |
| 17-19 | 3 | Evening rush |
| 19-21 | 1 | Evening |
| 21-24 | 0.5 | Late night |

### Difficulty Scaling
`effectiveRate = baseRate * (1 + (difficulty-1) * 0.4) * spawnMultiplier`

40% increase per difficulty level. At difficulty 5 (day 5), rates are 2.6x the base.

## Parking Timer System

- **Parking duration:** `max(60, 120 - (difficulty-1) * 12)` game-minutes
- At difficulty 1: 120 min (= 3 real seconds of free parking)
- Shrinks 12 min per level, minimum 60 min

### Overstay Flow
1. Timer expires → car starts overstaying
2. If warden active: auto-ticket immediately
3. If NOT ticketed after 240 game-minutes (~6 real sec): car **escapes**, player loses ticket fee as penalty
4. If ticketed, after 120 game-minutes (~3 real sec): car pays ticket fee and leaves via exit gate

### Player Actions (tap car to open popup)
- **Ticket** (red button): manually ticket an overstaying car, earns ticket fee
- **Extend** ($15, black button): adds 60 game-minutes, resets overstay timer

### Fees
- Base parking fee: `10 + difficulty * 2`
- Ticket fee: `25 + difficulty * 5`

## Gate Breaking

- Random break chance every 5 seconds: `0.002 * (1 + difficulty * 0.3)`
- Reduced by gate reliability upgrade: `chance * (1 - gateReliability * 0.15)`
- When broken: cars can't enter, pulsing red "GATE BROKEN" alert appears
- Player taps alert to fix

## Upgrades (Shop)

| Upgrade | Cost | Max Level | Effect |
|---------|------|-----------|--------|
| Gate Reliability | 50 + level*30 | 4 | -15% break chance per level |
| Queue Capacity | 40 + level*20 | unlimited | +2 queue slots per level |
| Parking Warden | 60 + difficulty*10 | consumable | Auto-tickets all overstayers for ~5 game-min |
| Auto-Tow | 50 + difficulty*10 | consumable | Auto-removes ticketed cars for ~5 game-min |

Shop is fullscreen dark overlay, pauses game when open. Shows current lot info line: `Level X | Lot: Y slots | Queue: Z | Gate: W%`

## Warden (scene object)

- Small uniformed figure (navy body, skin-tone head, blue hat)
- When activated: patrols between slot positions at speed 3
- Auto-tickets any overstaying, un-ticketed car it reaches
- Timer counts down in game-minutes

## Tow Truck (scene object)

- Yellow truck with flatbed (larger than cars)
- When activated and a ticketed car needs removal:
  1. Approaches slot position
  2. Hooks up car (lifts to y=0.9 on flatbed)
  3. Drags to exit gate position (-3, 35)
  4. Removes car from scene, collects fee

## UI Overlay System

All UI is positioned via `#ui-overlay` (absolute, full-screen, pointer-events:none). Children get `pointer-events: auto` except `.car-timers-container` which stays `pointer-events: none !important` (critical CSS specificity fix).

### HUD (top bar)
- Money (left), Time (center), Day (right), SHOP button (right)
- Black background with white text, thin white border

### Floating Car Timers
- Small labels above each parked car showing remaining time
- Projected from 3D world position (y=2.2 above slot) to screen coordinates
- Classes: `.car-timer`, `.overtime` (red), `.ticketed` (orange)

### Fee Popups
- Float-up animation when money is earned/lost at gate
- Green for income, red (`.penalty`) for losses

## Raycaster (click/tap detection)

- Handles both mouse click and touchstart events
- Casts ray from camera through click point
- Walks up parent hierarchy to find top-level Group (car mesh)
- Matches against parked car meshes to find slot index

## Debug Panel (dialkit)

Uses `dialkit/store` (framework-agnostic) with a custom vanilla JS renderer. Panel appears top-right, collapsible, dark semi-transparent background. All values persist to localStorage.

### Tunable Parameters

**Spawning:**
- spawnMultiplier [1.0, range 0.1-5.0]
- difficultyRamp [0.4, range 0.0-2.0]

**Timing:**
- realSecPer2GameHours [3, range 0.5-30]
- baseParkingMinutes [120, range 30-600]
- parkingShrinkPerLevel [12, range 0-30]
- escapeThreshold [240, range 60-600]
- ticketedLeaveDelay [120, range 30-600]

**Economy:**
- startingMoney [50, range 0-500]
- baseFee [10, range 1-100]
- feePerDifficulty [2, range 0-20]
- ticketBase [25, range 5-200]
- ticketPerDifficulty [5, range 0-30]

**Gate:**
- breakChance [0.002, range 0-0.05]
- breakDifficultyScale [0.3, range 0-2]

## CSS Design System

- **Font:** -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif
- **Colors:** Black `#000`, white `#fff`, red `#d00`, green `#4ade80`
- **Pattern:** Uppercase labels, letter-spacing 0.5-3px, font-weight 700
- **No border-radius** anywhere (sharp corners throughout)
- **Z-index layers:** game canvas (0) → car timers (auto) → car popup/gate alert (10) → shop (20) → start/gameover screens (30) → debug panel (100)
- **Mobile breakpoint:** 600px — smaller fonts, tighter padding

## Game Over

- Triggered when `queueManager.addCar()` returns false (queue full, no parking slots)
- Sets `state.isGameOver = true`
- Shows score (final money), highscore, day count, difficulty level
- Saves highscore to `localStorage` key `"miniParkering_highscore"`
- "PLAY AGAIN" restarts with fresh state

## Key Implementation Notes

1. **Persistent vs per-game objects:** Scene objects (lot, building, gates, road, trees, lighting, grass) are created once. Game logic systems (clock, parking, queue, spawner, UI) are re-created on each game start with fresh state.

2. **Lot expansion:** When `state.difficulty` changes and the level config differs, the lot group is cleared and rebuilt. Parked cars are repositioned to updated slot positions. The building also rebuilds to match new lot width.

3. **Car cleanup between games:** All non-persistent THREE.Groups are removed from the scene. UI elements (timer containers, popups, alerts) are removed from DOM.

4. **The CSS specificity fix is critical:** `#ui-overlay > .car-timers-container { pointer-events: none !important; }` — without this, the full-screen timer container blocks all click/tap events on the 3D scene.

5. **Game clock exports `GAME_HOURS_PER_REAL_SECOND`** as a mutable variable that the clock updates from tuning values each frame. Other modules import this for their own time calculations.

6. **Queue overflow = game over.** When the spawner tries to add a car but the queue is full AND no parking slots are available, the game ends.
