# Mini Parkering — Design Spec

## Overview
3D parking lot management game. Top-down isometric, low-poly flat aesthetic. Built with Vite + Three.js + HTML/CSS overlays.

## Architecture

Single-page app. One Three.js canvas for 3D scene, DOM elements layered on top for UI.

```
src/
  main.js          — entry, scene setup, game loop
  scene/
    lot.js         — parking lot grid, lines, surface
    building.js    — ticket office building
    gate.js        — entrance gate with barrier arm
    road.js        — road leading into the lot
    trees.js       — decorative low-poly trees
    car.js         — car factory (colors, shapes, animations)
    lighting.js    — day/night cycle, ambient + directional
  game/
    state.js       — game state (money, time, difficulty, upgrades)
    clock.js       — game clock (24hr cycle, 30s = 2 game-hours)
    spawner.js     — car arrival logic, time-of-day rates
    parking.js     — slot management, timers, overstay detection
    queue.js       — entrance queue, overflow = game over
    upgrades.js    — shop logic
  ui/
    hud.js         — money, clock, day counter
    shop.js        — upgrade shop overlay
    carPopup.js    — contextual buttons (Ticket / Extend)
    gateAlert.js   — gate broken alert + tap-to-fix
    startScreen.js — title, Play/Highscore/Options
    gameOver.js    — game over screen with score
  utils/
    raycaster.js   — tap/click detection → 3D object picking
```

## Camera & Visual Style

- Fixed isometric OrthographicCamera, ~45° down, no rotation/zoom
- MeshLambertMaterial or MeshToonMaterial, no textures, solid colors
- Parking surface: warm beige/gray. Grass: green planes. Trees: dark green spheres on brown cylinders.
- Cars: rounded boxes with color variations + accent stripes
- Building: simple block with roof overhang

## Game Clock & Day/Night

- 2 game-hours = 30 real seconds → full 24hr = 6 minutes real time
- DirectionalLight rotates to simulate sun arc
- AmbientLight color shifts (warm day → blue dusk → dark night → dawn)
- Scene background color follows same curve

## Core Loop

1. Cars spawn at gate at time-of-day rates (busy 7-9am, 11am-1pm, 5-7pm; quiet evenings; near-zero night)
2. Gate barrier lifts, car animates driving to empty slot
3. Each car has max 2hr parking timer (floating countdown above car)
4. Timer expires → "overstay" state (timer turns red, counts up)
5. Player taps overstaying car → contextual buttons: "Ticket $X" / "Extend +1hr ($15)"
6. Extend is also available before overtime
7. Unticketed overstayers escape after ~30 game-minutes → player loses penalty fee
8. Ticketed cars leave after short delay, auto-paying fee at gate exit
9. Normal cars leave when time up, paying base fee at gate

## Car Animations

- **Entering:** Drive from road → stop at gate → barrier lifts → drive along lane → reverse-park wiggle into slot
- **Leaving:** Pull out of slot → drive along lane → barrier lifts → exit onto road → drive off-screen → "+$X" fee popup at gate

Cars follow waypoint paths using lerp/tween.

## Gate Mechanics

- Breaks randomly (increasing frequency with difficulty)
- Broken gate = no cars enter, queue builds
- Alert icon pulses over gate — player taps to fix (instant)
- Upgradeable reliability (5 levels)

## Queue & Game Over

- Cars queue on road outside gate (visible line)
- Base queue capacity: 5 cars
- Queue overflow → game over
- Upgradeable capacity

## Upgrade Shop

Button in HUD opens overlay. Spend earned money:

| Upgrade | Effect | Type |
|---------|--------|------|
| Gate Reliability | Breaks less often | 5 levels |
| Add Row | +1 row to parking grid | unlimited |
| Add Column | +1 column to grid | unlimited |
| Queue Capacity | +2 queue slots | unlimited |
| Parking Warden | Auto-tickets overstayers for 5 game-min | consumable |
| Auto-Tow | Instant removal of ticketed cars for 5 game-min | consumable |

### Parking Warden
- Consumable. Small warden figure patrols lot for 5 game-minutes (~37 real seconds)
- Auto-tickets any overstaying car immediately
- Disappears when timer runs out. Can repurchase.
- Cost scales with difficulty

### Auto-Tow
- Consumable. Active for 5 game-minutes
- Ticketed cars (manual or warden) towed out immediately
- Tow truck animation: hooks car, drags to gate
- Towed cars still pay ticket fee on exit

## Progression

- Difficulty increases every ~90 real seconds
- More cars, faster spawns, shorter escape grace period
- Starting lot: 3 columns × 4 rows = 12 slots

## Interaction

- Tap car → floating contextual buttons (Ticket / Extend), dismiss on tap-away
- Tap broken gate → fixes immediately
- Tap shop button → upgrade overlay
- Raycaster for 3D→screen mapping

## Start Screen

- "MINI PARKERING" title in chunky block font
- Parking lot background (dimmed 3D scene or static)
- Buttons: Play, Highscore, Options

## Scoring

- Money earned = score
- Highscore persisted in localStorage

## Tech

- Vite + Three.js, no framework
- Responsive, works on mobile and desktop
- HTML/CSS overlays for all UI
