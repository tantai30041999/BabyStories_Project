import type { Localized } from '../i18n'
import type { MessageKey } from '../i18n/messages'

export type ThemeGroup = 'hero' | 'animal' | 'anime' | 'sweet'

export interface ThemeMeta {
  id: string
  name: Localized
  emoji: string
  tagline: Localized
  group: ThemeGroup
  swatches: [string, string, string]
  /** cute decorations used in videos & collages */
  stickers: string[]
}

export const THEME_GROUPS: { id: ThemeGroup; label: MessageKey }[] = [
  { id: 'hero', label: 'group.hero' },
  { id: 'animal', label: 'group.animal' },
  { id: 'anime', label: 'group.anime' },
  { id: 'sweet', label: 'group.sweet' },
]

export const THEMES: ThemeMeta[] = [
  {
    id: 'hero',
    name: { en: 'Super Hero', vi: 'Siêu Anh Hùng' },
    emoji: '🦸‍♂️',
    tagline: { en: 'Red cape, comic POW!', vi: 'Áo choàng đỏ, BÙM kiểu truyện tranh!' },
    group: 'hero',
    swatches: ['#e0202b', '#ffc000', '#1d3a9e'],
    stickers: ['🦸‍♂️', '⚡', '💥', '⭐', '🛡️', '🚀'],
  },
  {
    id: 'thunder',
    name: { en: 'Thunder Knight', vi: 'Hiệp Sĩ Sấm Sét' },
    emoji: '⚡',
    tagline: { en: 'Night hero, lightning gold', vi: 'Anh hùng bóng đêm, tia chớp vàng' },
    group: 'hero',
    swatches: ['#ffd400', '#3da5ff', '#191e33'],
    stickers: ['⚡', '🦇', '🌙', '💥', '🛡️', '⭐'],
  },
  {
    id: 'safari',
    name: { en: 'Safari Cub', vi: 'Sư Tử Con' },
    emoji: '🦁',
    tagline: { en: 'Lions, tigers & jungle', vi: 'Sư tử, hổ & rừng xanh' },
    group: 'animal',
    swatches: ['#e07a10', '#4f9a2c', '#f3e8c9'],
    stickers: ['🦁', '🐯', '🐘', '🦒', '🌴', '🐾'],
  },
  {
    id: 'dino',
    name: { en: 'Dino Roar', vi: 'Khủng Long Gầm' },
    emoji: '🦖',
    tagline: { en: 'Stomp stomp, RAWR!', vi: 'Dậm dậm, GÀO!' },
    group: 'animal',
    swatches: ['#23944f', '#ff7a2e', '#dbf0d1'],
    stickers: ['🦖', '🦕', '🌋', '🥚', '🌿', '🦴'],
  },
  {
    id: 'anime',
    name: { en: 'Anime Hero', vi: 'Anh Hùng Anime' },
    emoji: '🍥',
    tagline: { en: 'Speed lines & big dreams', vi: 'Đường tốc độ & ước mơ lớn' },
    group: 'anime',
    swatches: ['#ff6410', '#2878ff', '#ffe6d3'],
    stickers: ['🍥', '🔥', '⚡', '🍙', '🌀', '⭐'],
  },
  {
    id: 'neo',
    name: { en: 'Neo Tokyo', vi: 'Neo Tokyo' },
    emoji: '🌸',
    tagline: { en: 'Neon night city', vi: 'Thành phố đêm neon' },
    group: 'anime',
    swatches: ['#ff3d9a', '#22e0ff', '#1e1540'],
    stickers: ['🌸', '🗼', '🍜', '🐉', '✨', '🎏'],
  },
  {
    id: 'sky',
    name: { en: 'Baby Blue', vi: 'Xanh Em Bé' },
    emoji: '🐳',
    tagline: { en: 'Bubbly & bright', vi: 'Bong bóng & tươi sáng' },
    group: 'sweet',
    swatches: ['#4a9ff0', '#ffadc9', '#e3f1ff'],
    stickers: ['🐳', '🫧', '☁️', '💙'],
  },
  {
    id: 'mint',
    name: { en: 'Mint Cloud', vi: 'Mây Bạc Hà' },
    emoji: '🌿',
    tagline: { en: 'Fresh, calm & airy', vi: 'Tươi mát & dịu nhẹ' },
    group: 'sweet',
    swatches: ['#34b886', '#7cc8ff', '#e2f6ec'],
    stickers: ['🌿', '☁️', '🍃', '🫧'],
  },
  {
    id: 'lemon',
    name: { en: 'Lemon Chick', vi: 'Gà Con Chanh Vàng' },
    emoji: '🐥',
    tagline: { en: 'Sunny & chirpy', vi: 'Nắng vàng & líu lo' },
    group: 'sweet',
    swatches: ['#f5b700', '#ff9f7a', '#fff3c4'],
    stickers: ['🐥', '🍋', '🌼', '💛'],
  },
  {
    id: 'cocoa',
    name: { en: 'Cocoa Bear', vi: 'Gấu Ca Cao' },
    emoji: '🧸',
    tagline: { en: 'Snuggly & warm', vi: 'Ấm áp & mềm mại' },
    group: 'sweet',
    swatches: ['#b0785a', '#f2a7a0', '#f3e8dd'],
    stickers: ['🧸', '🍪', '🤎', '🎀'],
  },
  {
    id: 'peach',
    name: { en: 'Peachy Sunshine', vi: 'Nắng Đào' },
    emoji: '🍑',
    tagline: { en: 'Warm & giggly', vi: 'Ấm áp & khúc khích' },
    group: 'sweet',
    swatches: ['#ff8f4d', '#ffcc3d', '#ffeedd'],
    stickers: ['🍑', '🌼', '☀️', '🧡'],
  },
  {
    id: 'lavender',
    name: { en: 'Lavender Dream', vi: 'Giấc Mơ Oải Hương' },
    emoji: '🦄',
    tagline: { en: 'Soft purple magic', vi: 'Phép màu tím dịu' },
    group: 'sweet',
    swatches: ['#9270ff', '#ff9ecf', '#eee8ff'],
    stickers: ['🦄', '✨', '🌸', '💜'],
  },
  {
    id: 'strawberry',
    name: { en: 'Strawberry Milk', vi: 'Sữa Dâu' },
    emoji: '🍓',
    tagline: { en: 'Sweet pink & creamy', vi: 'Hồng ngọt & béo sữa' },
    group: 'sweet',
    swatches: ['#ff6f9c', '#ffb86b', '#ffeaf1'],
    stickers: ['🍓', '💗', '🎀', '☁️'],
  },
  {
    id: 'midnight',
    name: { en: 'Midnight Lullaby', vi: 'Khúc Ru Đêm' },
    emoji: '🌙',
    tagline: { en: 'Cozy night mode', vi: 'Chế độ đêm ấm cúng' },
    group: 'sweet',
    swatches: ['#ff8fb8', '#ffd37a', '#2d2950'],
    stickers: ['🌙', '⭐', '✨', '☁️'],
  },
]

export const getTheme = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0]

/** Each month of baby's life gets its own bold look until the parent picks one. */
const MONTH_CYCLE = ['hero', 'safari', 'anime', 'dino', 'sky', 'thunder', 'neo']
export const defaultMonthTheme = (month: number) =>
  MONTH_CYCLE[((month % MONTH_CYCLE.length) + MONTH_CYCLE.length) % MONTH_CYCLE.length]
