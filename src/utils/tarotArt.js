/**
 * 塔罗牌面（几何块绘制）。
 *
 * 22 张大阿卡纳各由一组几何图元（圆 / 三角 / 环 / 折线）构成牌面纹样，
 * 套在羊皮纸底 + 双层描边的牌框内，避免引入位图素材。
 * 输出为 base64 data URI，直接作为卡片背景图（与 Reicon 同一渲染管线）。
 */
import { svgToDataUri } from '../icons'

const BG = '#f7f1e3'
const FRAME = '#b08d4f'
const FG = '#3a3357'
const ACCENT = '#b08d4f'

/* 每张牌的纹样图元（viewBox 100x140，纹样区域约 y 36..96） */
const EMBLEMS = {
  // 0 愚者：太阳 + 崖路 + 行囊
  0: '<circle cx="36" cy="46" r="9"/><path d="M22 92 L42 92 L42 78 L60 78 L60 92 L78 92"/><path d="M44 92 L44 64 L58 64"/><circle cx="68" cy="58" r="4" fill="ACCENT" stroke="none"/>',
  // 1 魔术师：无穷环 + 权杖
  1: '<path d="M32 52 C32 42 49 42 49 52 C49 62 66 62 66 52 C66 42 49 42 49 52 C49 62 32 62 32 52 Z"/><line x1="49" y1="66" x2="49" y2="92"/><circle cx="49" cy="38" r="2.6" fill="ACCENT" stroke="none"/>',
  // 2 女祭司：双柱 + 新月
  2: '<rect x="30" y="42" width="9" height="50"/><rect x="61" y="42" width="9" height="50"/><path d="M56 48 A14 14 0 1 0 56 78 A11 11 0 1 1 56 48 Z" fill="ACCENT" stroke="none"/>',
  // 3 女皇：金星符号
  3: '<circle cx="50" cy="56" r="10"/><line x1="50" y1="66" x2="50" y2="92"/><line x1="42" y1="83" x2="58" y2="83"/>',
  // 4 皇帝：盾 + 王冠
  4: '<rect x="33" y="56" width="34" height="26"/><path d="M33 56 L39 42 L50 54 L61 42 L67 56"/>',
  // 5 教皇：拱门 + 十字
  5: '<path d="M33 92 L33 62 A17 17 0 0 1 67 62 L67 92"/><line x1="50" y1="52" x2="50" y2="76"/><line x1="42" y1="60" x2="58" y2="60"/>',
  // 6 恋人：交叠双环 + 星
  6: '<circle cx="42" cy="66" r="12"/><circle cx="58" cy="66" r="12"/><circle cx="50" cy="40" r="3" fill="ACCENT" stroke="none"/>',
  // 7 战车：车篷 + 双轮
  7: '<rect x="31" y="60" width="38" height="15"/><circle cx="40" cy="82" r="6"/><circle cx="60" cy="82" r="6"/><path d="M31 60 L50 46 L69 60"/>',
  // 8 力量：无穷双环 + 支柱
  8: '<circle cx="43" cy="58" r="8.5"/><circle cx="57" cy="58" r="8.5"/><line x1="50" y1="70" x2="50" y2="92"/>',
  // 9 隐士：灯 + 杖
  9: '<polygon points="50,42 61,54 50,66 39,54"/><line x1="66" y1="42" x2="66" y2="92"/><circle cx="50" cy="54" r="2.6" fill="ACCENT" stroke="none"/>',
  // 10 命运之轮：轮辐
  10: '<circle cx="50" cy="62" r="20"/><circle cx="50" cy="62" r="7"/><line x1="50" y1="42" x2="50" y2="55"/><line x1="50" y1="69" x2="50" y2="82"/><line x1="30" y1="62" x2="43" y2="62"/><line x1="57" y1="62" x2="70" y2="62"/>',
  // 11 正义：天平
  11: '<line x1="50" y1="42" x2="50" y2="88"/><line x1="30" y1="50" x2="70" y2="50"/><path d="M22 56 A9 9 0 0 0 40 56"/><path d="M60 56 A9 9 0 0 0 78 56"/><line x1="40" y1="92" x2="60" y2="92"/>',
  // 12 倒吊人：倒三角 + 光环
  12: '<path d="M32 46 L68 46 L50 78 Z"/><circle cx="50" cy="86" r="6"/><circle cx="50" cy="38" r="2.6" fill="ACCENT" stroke="none"/>',
  // 13 死神：镰刃 + 立柄
  13: '<path d="M30 48 A26 26 0 0 1 72 44"/><line x1="50" y1="46" x2="50" y2="92"/><line x1="38" y1="92" x2="62" y2="92"/>',
  // 14 节制：双杯 + 水流
  14: '<path d="M28 48 L44 48 L41 62 L31 62 Z"/><path d="M56 48 L72 48 L69 62 L59 62 Z"/><path d="M41 55 C47 59 53 55 59 59"/>',
  // 15 恶魔：倒五芒星 + 双角
  15: '<polygon points="50,75 46.2,63.3 33.8,63.3 43.8,56 40,44.2 50,51.5 60,44.2 56.2,56 66.2,63.3 53.8,63.3" fill="ACCENT" stroke="none"/><path d="M36 40 C40 34 46 34 48 38"/><path d="M64 40 C60 34 54 34 52 38"/>',
  // 16 塔：塔身 + 落雷
  16: '<rect x="41" y="44" width="18" height="48"/><line x1="36" y1="44" x2="64" y2="44"/><path d="M28 40 L44 56 L38 60 L54 74" stroke="ACCENT"/><circle cx="30" cy="72" r="2.4" fill="ACCENT" stroke="none"/><circle cx="70" cy="64" r="2.4" fill="ACCENT" stroke="none"/>',
  // 17 星星：大星 + 辅星
  17: '<polygon points="50,38 55,58 76,64 55,70 50,90 45,70 24,64 45,58" fill="ACCENT" stroke="none"/><circle cx="30" cy="44" r="2" fill="FG" stroke="none"/><circle cx="70" cy="44" r="2" fill="FG" stroke="none"/><circle cx="30" cy="84" r="2" fill="FG" stroke="none"/><circle cx="70" cy="84" r="2" fill="FG" stroke="none"/>',
  // 18 月亮：新月 + 三滴露
  18: '<path d="M60 40 A22 22 0 1 0 60 90 A17 17 0 1 1 60 40 Z" fill="ACCENT" stroke="none"/><circle cx="36" cy="96" r="2" fill="FG" stroke="none"/><circle cx="46" cy="101" r="2" fill="FG" stroke="none"/><circle cx="56" cy="96" r="2" fill="FG" stroke="none"/>',
  // 19 太阳：日轮 + 八芒
  19: '<circle cx="50" cy="62" r="15"/><line x1="70" y1="62" x2="78" y2="62"/><line x1="64.1" y1="76.1" x2="69.8" y2="81.8"/><line x1="50" y1="82" x2="50" y2="90"/><line x1="35.9" y1="76.1" x2="30.2" y2="81.8"/><line x1="30" y1="62" x2="22" y2="62"/><line x1="35.9" y1="47.9" x2="30.2" y2="42.2"/><line x1="50" y1="42" x2="50" y2="34"/><line x1="64.1" y1="47.9" x2="69.8" y2="42.2"/>',
  // 20 审判：号角 + 升起之灵
  20: '<path d="M32 88 L60 52 L68 60 Z"/><circle cx="42" cy="42" r="2.4" fill="ACCENT" stroke="none"/><circle cx="54" cy="38" r="2.4" fill="ACCENT" stroke="none"/><circle cx="66" cy="42" r="2.4" fill="ACCENT" stroke="none"/>',
  // 21 世界：桂冠环 + 菱星
  21: '<ellipse cx="50" cy="62" rx="19" ry="28"/><polygon points="50,50 60,62 50,74 40,62" fill="ACCENT" stroke="none"/>',
}

const cache = {}

/** 生成某张牌（0..21）的几何牌面 data URI */
export function cardFaceUri(cardId) {
  if (cache[cardId]) return cache[cardId]
  const body = (EMBLEMS[cardId] || '').replace(/ACCENT/g, ACCENT).replace(/FG/g, FG)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">`
    + `<rect width="100" height="140" fill="${BG}"/>`
    + `<rect x="5" y="5" width="90" height="130" rx="6" fill="none" stroke="${FRAME}" stroke-width="2"/>`
    + `<rect x="9" y="9" width="82" height="122" rx="4" fill="none" stroke="${FRAME}" stroke-width="0.8" opacity="0.6"/>`
    + `<circle cx="50" cy="18" r="2.5" fill="${FRAME}"/>`
    + `<g stroke="${FG}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</g>`
    + `<line x1="24" y1="122" x2="76" y2="122" stroke="${FRAME}" stroke-width="1.2"/>`
    + `</svg>`
  const uri = svgToDataUri(svg)
  cache[cardId] = uri
  return uri
}
