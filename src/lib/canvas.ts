import type { Post } from '../types'
import { babyAge, formatDate } from './dates'

export interface Palette {
  bg: string
  surface: string
  surface2: string
  line: string
  ink: string
  muted: string
  primary: string
  primaryInk: string
  accent: string
  blob1: string
  blob2: string
  /** display font family, e.g. "Bangers" */
  display: string
  pattern: CanvasPattern
}

export type CanvasPattern = 'dots' | 'halftone' | 'stripes' | 'spots' | 'scales' | 'speedlines' | 'grid'

/** Reads a theme's colors straight from the CSS so canvas art always matches the site. */
export function readPalette(themeId: string): Palette {
  const el = document.createElement('div')
  el.dataset.theme = themeId
  el.style.display = 'none'
  document.body.append(el)
  const cs = getComputedStyle(el)
  const v = (n: string) => cs.getPropertyValue(n).trim()
  const p = {
    bg: v('--bg'),
    surface: v('--surface'),
    surface2: v('--surface-2'),
    line: v('--line'),
    ink: v('--ink'),
    muted: v('--muted'),
    primary: v('--primary'),
    primaryInk: v('--primary-ink'),
    accent: v('--accent'),
    blob1: v('--blob-1'),
    blob2: v('--blob-2'),
    display: v('--display-font').replace(/["']/g, '') || 'Fredoka',
    pattern: (v('--canvas-pattern') || 'dots') as CanvasPattern,
  }
  el.remove()
  return p
}

export interface LoadedPhoto {
  id: string
  img: HTMLImageElement
  date: string
  age: string
  caption: string
}

const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(src: string) {
  let p = imageCache.get(src)
  if (!p) {
    const img = new Image()
    img.src = src
    p = img.decode().then(
      () => img,
      () => img,
    )
    imageCache.set(src, p)
  }
  return p
}

export async function loadPhotos(posts: Post[], birthday: string): Promise<LoadedPhoto[]> {
  return Promise.all(
    posts.map(async (p) => ({
      id: p.id,
      img: await loadImage(p.src),
      date: formatDate(p.takenAt),
      age: babyAge(birthday, p.takenAt),
      caption: p.caption,
    })),
  )
}

export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('600 40px Fredoka'),
      document.fonts.load('800 20px Nunito'),
      document.fonts.load('700 20px Nunito'),
      document.fonts.load('400 40px Bangers'),
      document.fonts.load('400 40px "Lilita One"'),
      document.fonts.load('400 40px "Mochiy Pop One"'),
      document.fonts.load('700 40px "Baloo 2"'),
      document.fonts.load('400 40px "Paytone One"'),
      document.fonts.load('700 40px "Chakra Petch"'),
    ])
  } catch {
    /* fall back to system fonts */
  }
}

/** Weights we load for display fonts; anything else is single-weight (400). */
const DISPLAY_WEIGHT: Record<string, number> = { Fredoka: 600, 'Baloo 2': 800, 'Chakra Petch': 700 }

/** `display`: a theme display font family (e.g. pal.display) or false for body text. */
export const font = (weight: number, size: number, display: string | false = false) =>
  display
    ? // single-weight display fonts would get faux-bold above 400
      `${DISPLAY_WEIGHT[display] ?? 400} ${Math.round(size)}px "${display}", Nunito, sans-serif`
    : `${weight} ${Math.round(size)}px Nunito, sans-serif`

/** object-fit: cover into a rounded box, with optional zoom for Ken Burns. */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 0,
  zoom = 1,
) {
  const iw = img.naturalWidth || 1080
  const ih = img.naturalHeight || 1080
  const s = Math.max(w / iw, h / ih) * zoom
  const dw = iw * s
  const dh = ih * s
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width <= maxW || !line) line = test
    else {
      lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines)
    let last = cut[maxLines - 1]
    while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1)
    cut[maxLines - 1] = last + '…'
    return cut
  }
  return lines
}

export function withShadow(ctx: CanvasRenderingContext2D, scale: number, draw: () => void) {
  ctx.save()
  ctx.shadowColor = 'rgba(40, 20, 40, 0.18)'
  ctx.shadowBlur = 36 * scale
  ctx.shadowOffsetY = 12 * scale
  draw()
  ctx.restore()
}

/** The theme's signature texture — same idea as the CSS `--pattern`, drawn for video & collage. */
function drawPattern(ctx: CanvasRenderingContext2D, W: number, H: number, pal: Palette, u: number, t: number) {
  const dot = (x: number, y: number, r: number) => {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  switch (pal.pattern) {
    case 'halftone': {
      // comic-book dots that grow toward the top-left corner
      ctx.fillStyle = pal.primary
      ctx.globalAlpha = 0.18
      const step = u * 0.032
      for (let y = 0, row = 0; y < H + step; y += step, row++)
        for (let x = row % 2 ? step / 2 : 0; x < W + step; x += step)
          dot(x, y, step * (0.08 + 0.3 * Math.max(0, 1 - (x / W + y / H) / 1.4)))
      break
    }
    case 'stripes': {
      ctx.fillStyle = pal.primary
      ctx.globalAlpha = 0.08
      ctx.translate(W / 2, H / 2)
      ctx.rotate(-Math.PI / 4)
      const d = Math.hypot(W, H)
      for (let x = -d; x < d; x += u * 0.09) ctx.fillRect(x + ((t * u * 0.02) % (u * 0.09)), -d, u * 0.025, d * 2)
      break
    }
    case 'spots': {
      // animal print
      const r = rng(11)
      for (let i = 0; i < 46; i++) {
        const x = r() * W
        const y = r() * H
        const s = u * (0.012 + r() * 0.022)
        ctx.globalAlpha = 0.22
        ctx.fillStyle = i % 3 ? pal.primary : pal.ink
        ctx.beginPath()
        ctx.ellipse(x, y, s, s * (0.6 + r() * 0.3), r() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'scales': {
      ctx.strokeStyle = pal.primary
      ctx.globalAlpha = 0.18
      ctx.lineWidth = u * 0.004
      const s = u * 0.06
      for (let y = 0, row = 0; y < H + s; y += s / 2, row++)
        for (let x = row % 2 ? s / 2 : 0; x < W + s; x += s) {
          ctx.beginPath()
          ctx.arc(x, y, s / 2, 0, Math.PI)
          ctx.stroke()
        }
      break
    }
    case 'speedlines': {
      // manga focus lines bursting from the center
      ctx.fillStyle = pal.ink
      ctx.globalAlpha = 0.07
      const cx = W / 2
      const cy = H * 0.42
      const R = Math.hypot(W, H)
      const r0 = u * 0.42
      const r = rng(5)
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * Math.PI * 2 + r() * 0.03
        const w = 0.006 + r() * 0.012
        const start = r0 + r() * u * 0.15
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * start, cy + Math.sin(a) * start)
        ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R)
        ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R)
        ctx.fill()
      }
      break
    }
    case 'grid': {
      // neon city grid rolling toward the viewer
      ctx.strokeStyle = pal.accent
      ctx.lineWidth = u * 0.003
      const horizon = H * 0.55
      ctx.globalAlpha = 0.28
      for (let i = 0; i < 14; i++) {
        const p = (i + ((t * 0.6) % 1)) / 14
        const y = horizon + (H - horizon) * p * p
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo(W / 2 + i * W * 0.03, horizon)
        ctx.lineTo(W / 2 + i * W * 0.22, H)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.1
      for (let x = 0; x < W; x += u * 0.06) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, horizon)
        ctx.stroke()
      }
      break
    }
    default: {
      ctx.fillStyle = pal.surface2
      const step = u * 0.09
      for (let y = step / 2, row = 0; y < H; y += step, row++)
        for (let x = (row % 2 ? step / 2 : 0) + step / 4; x < W; x += step) dot(x, y, u * 0.006)
    }
  }
}

/** Soft blobs, the theme pattern and bobbing stickers. `t` animates it (seconds). */
export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  pal: Palette,
  stickers: string[] | null,
  t = 0,
) {
  const u = Math.min(W, H)
  ctx.fillStyle = pal.bg
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.globalAlpha = 0.9
  ctx.fillStyle = pal.blob1
  ctx.beginPath()
  ctx.arc(W * 0.9 + Math.sin(t * 0.6) * u * 0.03, H * 0.08, u * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = pal.blob2
  ctx.beginPath()
  ctx.arc(W * 0.05, H * 0.95 + Math.cos(t * 0.5) * u * 0.03, u * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  drawPattern(ctx, W, H, pal, u, t)
  ctx.restore()

  if (stickers?.length) {
    const spots = [
      [0.1, 0.07],
      [0.9, 0.2],
      [0.08, 0.8],
      [0.9, 0.93],
    ]
    ctx.font = font(400, u * 0.085)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    spots.forEach(([sx, sy], i) => {
      ctx.save()
      ctx.translate(W * sx, H * sy + Math.sin(t * 2 + i) * u * 0.01)
      ctx.rotate(Math.sin(t + i * 2) * 0.12 + (i % 2 ? 0.15 : -0.15))
      ctx.fillText(stickers[i % stickers.length], 0, 0)
      ctx.restore()
    })
  }
}

export function pill(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, size: number, bg: string, fg: string) {
  ctx.font = font(800, size)
  const w = ctx.measureText(text).width + size * 1.6
  const h = size * 2
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy + size * 0.05)
}

/** Deterministic random so "Shuffle" gives stable layouts. */
export function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Native share sheet when available, otherwise a download. */
export async function shareOrSave(blob: Blob, name: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([blob], name, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  saveBlob(blob, name)
  return 'saved'
}
