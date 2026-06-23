import * as THREE from 'three'

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
