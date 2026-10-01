import type { Album } from '../types'

interface Preset {
  key: string
  name: string
  emoji: string
  theme: string
}

/** Starter albums (also used to migrate photos saved by v1 of the app). */
export const ALBUM_PRESETS: Preset[] = [
  { key: 'newborn', name: 'Newborn', emoji: '👶', theme: 'sky' },
  { key: 'first-smile', name: 'First Smile', emoji: '😊', theme: 'anime' },
  { key: 'sleepy', name: 'Sleepy Time', emoji: '😴', theme: 'thunder' },
  { key: 'bath', name: 'Bath Time', emoji: '🛁', theme: 'sky' },
  { key: 'feeding', name: 'Yummy', emoji: '🍼', theme: 'dino' },
  { key: 'playtime', name: 'Playtime', emoji: '🧸', theme: 'safari' },
  { key: 'first-steps', name: 'First Steps', emoji: '👣', theme: 'hero' },
  { key: 'outdoors', name: 'Outdoors', emoji: '🌼', theme: 'dino' },
  { key: 'family', name: 'Family', emoji: '💕', theme: 'hero' },
  { key: 'birthday', name: 'Birthday', emoji: '🎂', theme: 'anime' },
  { key: 'everyday', name: 'Everyday', emoji: '✨', theme: 'neo' },
]

export const ALBUM_EMOJIS = ['📷', '👶', '🍼', '🧸', '🛁', '😴', '🌼', '🎂', '💕', '✨', '🐣', '🌙', '🎈', '🦄', '🐻', '🍓', '⭐', '🎀', '🏖️', '🎄', '🐶', '🚗', '👵', '🎨', '🦁', '🦖', '🦸‍♂️', '⚡', '🍥', '🚀', '⚽', '🐉']

const PRESET_VI: Record<string, string> = {
  newborn: 'Sơ sinh',
  'first-smile': 'Nụ cười đầu tiên',
  sleepy: 'Giờ ngủ',
  bath: 'Giờ tắm',
  feeding: 'Ăn ngon',
  playtime: 'Giờ chơi',
  'first-steps': 'Những bước đầu tiên',
  outdoors: 'Dạo chơi',
  family: 'Gia đình',
  birthday: 'Sinh nhật',
  everyday: 'Mỗi ngày',
}

/** Starter albums are stored with English names; show them translated unless the parent renamed them. */
export function albumName(a: Pick<Album, 'id' | 'name'>, lang: 'en' | 'vi') {
  if (lang !== 'vi') return a.name
  const p = ALBUM_PRESETS.find((x) => `a-${x.key}` === a.id)
  return p && p.name === a.name ? PRESET_VI[p.key] : a.name
}

export function albumFromPreset(key: string): Album {
  const p = ALBUM_PRESETS.find((a) => a.key === key) ?? ALBUM_PRESETS[ALBUM_PRESETS.length - 1]
  return { id: `a-${p.key}`, name: p.name, emoji: p.emoji, theme: p.theme, createdAt: Date.now() }
}
