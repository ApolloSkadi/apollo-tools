/**
 * 六爻 3D 硬币场景（three-platformize / WebGL Canvas，页面级持有）。
 *
 * 设计要点：
 *  - 场景由页面创建与销毁，canvas 常驻挂载（idle 时隐藏），避免反复初始化；
 *  - targets: [3|2, 3|2, 3|2]，3=正面(阳·金)，2=反面(阴·银)，落定姿态确定性；
 *  - 节奏与页面状态机对齐：第 i 枚在 FLIP_MS + i*STAGGER_MS 落定。
 */
import * as THREE from 'three-platformize'
import { WechatPlatform } from 'three-platformize/src/WechatPlatform'

export const CANVAS_ID = 'liuyao-coin-canvas'
export const FLIP_MS = 900
export const STAGGER_MS = 200
const BASE_TURNS = 4

const COLORS = {
  gold: 0xd9a441,
  goldDark: 0xb9852f,
  silver: 0xb9bec7,
  silverDark: 0x8f96a3,
  felt: 0x2e4636,
}

function makeCoin(xOffset) {
  const group = new THREE.Group()

  const sideMat = new THREE.MeshStandardMaterial({ color: COLORS.goldDark, metalness: 0.55, roughness: 0.4 })
  const headsMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 0.6, roughness: 0.32 })
  const tailsMat = new THREE.MeshStandardMaterial({ color: COLORS.silver, metalness: 0.5, roughness: 0.45 })

  // CylinderGeometry 材质组：0 侧面、1 顶面（正面·金）、2 底面（背面·银）
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 48), [sideMat, headsMat, tailsMat])
  group.add(body)

  // 正面（金）：阳爻圆环纹；背面（银）：阴爻双横纹
  const headRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 40), sideMat)
  headRing.rotation.x = Math.PI / 2
  headRing.position.y = 0.07
  group.add(headRing)

  const barGeo = new THREE.BoxGeometry(0.62, 0.02, 0.13)
  const barMat = new THREE.MeshStandardMaterial({ color: COLORS.silverDark, metalness: 0.4, roughness: 0.5 })
  const bar1 = new THREE.Mesh(barGeo, barMat)
  bar1.position.set(0, 0.07, 0.22)
  group.add(bar1)
  const bar2 = new THREE.Mesh(barGeo, barMat)
  bar2.position.set(0, 0.07, -0.22)
  group.add(bar2)

  group.position.x = xOffset
  return group
}

/**
 * 创建场景。
 * @param {object} canvas weapp WebGL canvas 节点
 * @param {object} size   { width, height } CSS 像素尺寸
 * @returns {{ applyToss(targets: number[]): void, dispose(): void }}
 */
export function createCoinScene(canvas, { width, height }) {
  const platform = new WechatPlatform(canvas)
  THREE.PLATFORM.set(platform)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  // 微信端 pixelRatio 不宜取满（README 经验：一半或 2，不能是 3）
  renderer.setPixelRatio(Math.min(platform.window.devicePixelRatio || 2, 2))
  renderer.setSize(width, height)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
  camera.position.set(0, 3.2, 4.7)
  camera.lookAt(0, 0.4, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.75))
  const dir = new THREE.DirectionalLight(0xffffff, 0.85)
  dir.position.set(3, 6, 4)
  scene.add(dir)

  const felt = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: COLORS.felt, roughness: 0.95 })
  )
  felt.rotation.x = -Math.PI / 2
  felt.position.y = -0.06
  scene.add(felt)

  const coins = [-1.15, 0, 1.15].map((x) => {
    const coin = makeCoin(x)
    scene.add(coin)
    return coin
  })

  let spin = null
  let running = true
  let renderFailures = 0

  const loop = () => {
    if (!running) return
    try {
      // 统一用 Date.now() 作为时间基准，避免 rAF 时间戳（相对时间原点）与
      // applyToss 里的 startedAt（epoch 毫秒）不一致，导致 progress 恒为 0 而不动。
      const now = Date.now()
      if (spin) {
        coins.forEach((coin, i) => {
          const { startedAt, duration, finalX, height } = spin[i]
          const p = Math.min(Math.max((now - startedAt) / duration, 0), 1)
          const ease = 1 - Math.pow(1 - p, 3)
          coin.rotation.x = ease * finalX
          coin.position.y = Math.sin(p * Math.PI) * height
          coin.rotation.z = Math.sin(p * Math.PI * 2) * 0.05 * (1 - p)
        })
      }
      renderer.render(scene, camera)
    } catch (e) {
      renderFailures += 1
      if (renderFailures > 5) {
        running = false
        return
      }
    }
    canvas.requestAnimationFrame(loop)
  }
  canvas.requestAnimationFrame(loop)

  return {
    applyToss(targets) {
      if (!targets) return
      const startedAt = Date.now()
      spin = targets.map((target, i) => ({
        startedAt,
        duration: FLIP_MS + i * STAGGER_MS,
        // 落定姿态：正面朝上 rotation.x ≡ 0；反面朝上再翻 π
        finalX: BASE_TURNS * Math.PI * 2 + (target === 3 ? 0 : Math.PI),
        height: 1.5 + 0.25 * i,
      }))
    },
    dispose() {
      running = false
      try { renderer.dispose() } catch (e) { /* ignore */ }
      try { THREE.PLATFORM.dispose() } catch (e) { /* ignore */ }
      try { platform.dispose() } catch (e) { /* ignore */ }
    },
  }
}
