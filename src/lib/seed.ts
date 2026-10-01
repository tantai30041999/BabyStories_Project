import type { Album, StoredPost } from '../types'
import { albumFromPreset } from './albums'
import { daysAgo } from './dates'

/** Soft gradient "illustration" so the app looks alive before the first real upload. */
function art(emoji: string, from: string, to: string, deco: string[]) {
  const bubbles = [
    [150, 170, 90],
    [930, 140, 60],
    [980, 620, 110],
    [120, 760, 70],
    [700, 960, 80],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".35"/>`)
    .join('')
  const spots = [
    [210, 250],
    [870, 280],
    [230, 870],
    [860, 850],
  ]
  const decoEls = deco
    .map((d, i) => {
      const [x, y] = spots[i % spots.length]
      return `<text x="${x}" y="${y}" font-size="110" text-anchor="middle" dominant-baseline="middle">${d}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><radialGradient id="r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1080" fill="url(#g)"/>${bubbles}<circle cx="540" cy="540" r="400" fill="url(#r)"/><text x="540" y="580" font-size="400" text-anchor="middle" dominant-baseline="middle">${emoji}</text>${decoEls}</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

const SEEDS: { days: number; album: string; src: string; caption: string }[] = [
  { days: 244, album: 'newborn', src: art('👶', '#ffd6e4', '#ffeccf', ['⭐', '💗', '☁️', '🌙']), caption: 'Hello world, little one 💗' },
  { days: 236, album: 'newborn', src: art('🍼', '#ffe3ef', '#fff4d6', ['☁️', '💤', '⭐', '💗']), caption: 'First night home' },
  { days: 200, album: 'first-smile', src: art('😊', '#fff1b8', '#ffd1dc', ['✨', '💛', '🌸', '✨']), caption: 'THE first real smile 🥹' },
  { days: 172, album: 'sleepy', src: art('😴', '#d9d4ff', '#c8e7ff', ['🌙', '⭐', '☁️', '💤']), caption: 'Milk drunk & dreaming' },
  { days: 140, album: 'bath', src: art('🛁', '#c9f1ff', '#d8ffe9', ['🫧', '🦆', '🫧', '💧']), caption: 'Splish splash!' },
  { days: 138, album: 'bath', src: art('🦆', '#d2f4ff', '#fff7c9', ['🫧', '💧', '🫧', '⭐']), caption: 'Ducky is best friend now' },
  { days: 112, album: 'playtime', src: art('🍌', '#ffe3cc', '#fff6d6', ['🥕', '🍼', '🥄', '🍎']), caption: 'First taste of banana 🍌' },
  { days: 86, album: 'family', src: art('💕', '#ffd0e0', '#e6d6ff', ['👨', '👩', '👶', '🏡']), caption: 'All of us in one photo' },
  { days: 58, album: 'playtime', src: art('🧸', '#ffe0c7', '#ffd6e8', ['🎈', '🧩', '🪀', '⭐']), caption: 'Mr. Bear, chewed and loved' },
  { days: 27, album: 'outdoors', src: art('🌼', '#dcffd9', '#fff5c2', ['🦋', '🌷', '☀️', '🌿']), caption: 'First picnic in the park' },
  { days: 4, album: 'first-steps', src: art('👣', '#ffd9d9', '#ffe9c9', ['💪', '🎉', '⭐', '💗']), caption: 'Standing up for 2 whole seconds!' },
  { days: 1, album: 'playtime', src: art('🎈', '#e8e0ff', '#ffe0ef', ['🍓', '💗', '🌈', '☁️']), caption: 'Balloon party for no reason' },
]

export const DEFAULT_BIRTHDAY_DAYS_AGO = 245

export function makeSeed(): { albums: Album[]; posts: StoredPost[] } {
  const keys = [...new Set(SEEDS.map((s) => s.album))]
  const albums = keys.map(albumFromPreset)
  const posts = SEEDS.map((s, i) => ({
    id: crypto.randomUUID(),
    seedSrc: s.src,
    caption: s.caption,
    albumId: `a-${s.album}`,
    takenAt: daysAgo(s.days),
    createdAt: Date.now() - s.days * 86_400_000 + i,
  }))
  return { albums, posts }
}
