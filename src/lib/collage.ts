import { drawBackdrop, drawCover, font, pill, rng, withShadow, wrapText, type LoadedPhoto, type Palette } from './canvas'
import { translate } from '../i18n'

export type CollageLayout = 'grid' | 'polaroid' | 'hero'
export type CollageRatio = '9:16' | '1:1' | '4:5'

export interface CollageOptions {
  title: string
  subtitle: string
  theme: string
  layout: CollageLayout
  ratio: CollageRatio
  showDates: boolean
  stickers: boolean
  seed: number
}

export const COLLAGE_SIZES: Record<CollageRatio, [number, number]> = {
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
}

export const MAX_COLLAGE = 20

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Biggest square cells that fit n items in the box, centered. */
function gridCells(n: number, box: Box, gap: number): Box[] {
  let best = { cols: 1, size: 0 }
  for (let cols = 1; cols <= Math.min(n, 6); cols++) {
    const rows = Math.ceil(n / cols)
    const size = Math.min((box.w - gap * (cols - 1)) / cols, (box.h - gap * (rows - 1)) / rows)
    if (size > best.size) best = { cols, size }
  }
  const { cols, size } = best
  const rows = Math.ceil(n / cols)
  const totalH = rows * size + (rows - 1) * gap
  const cells: Box[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols)
    const inRow = Math.min(cols, n - r * cols)
    const rowW = inRow * size + (inRow - 1) * gap
    const c = i % cols
    cells.push({
      x: box.x + (box.w - rowW) / 2 + c * (size + gap),
      y: box.y + (box.h - totalH) / 2 + r * (size + gap),
      w: size,
      h: size,
    })
  }
  return cells
}

export function drawCollage(
  canvas: HTMLCanvasElement,
  photos: LoadedPhoto[],
  opts: CollageOptions,
  pal: Palette,
  stickers: string[],
  babyName: string,
) {
  const [W, H] = COLLAGE_SIZES[opts.ratio]
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const k = W / 1080
  const rand = rng(opts.seed)
  const list = photos.slice(0, MAX_COLLAGE)

  drawBackdrop(ctx, W, H, pal, null)

  // Header
  const pad = 64 * k
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = font(600, 84 * k, pal.display)
  ctx.fillStyle = pal.ink
  const titleLines = wrapText(ctx, opts.title || translate('studio.storyOf', { name: babyName }), W - pad * 2, 2)
  let y = pad + 80 * k
  titleLines.forEach((l) => {
    ctx.fillText(l, W / 2, y)
    y += 92 * k
  })
  if (opts.subtitle) {
    ctx.font = font(700, 36 * k)
    ctx.fillStyle = pal.muted
    ctx.fillText(wrapText(ctx, opts.subtitle, W - pad * 2, 1)[0], W / 2, y - 20 * k)
    y += 40 * k
  }
  const footerH = 110 * k
  const box: Box = { x: pad, y: y + 10 * k, w: W - pad * 2, h: H - y - 10 * k - footerH }

  const tile = (ph: LoadedPhoto, b: Box, border: number, radius: number) => {
    withShadow(ctx, k, () => {
      ctx.fillStyle = pal.surface
      ctx.beginPath()
      ctx.roundRect(b.x, b.y, b.w, b.h, radius + border)
      ctx.fill()
    })
    drawCover(ctx, ph.img, b.x + border, b.y + border, b.w - border * 2, b.h - border * 2, radius)
    if (opts.showDates && b.w > 150 * k) {
      const size = Math.max(16, Math.min(26, b.w / 14)) * k
      ctx.font = font(800, size)
      const label = ph.age
      const lw = ctx.measureText(label).width + size * 1.2
      ctx.fillStyle = 'rgba(255,255,255,.88)'
      ctx.beginPath()
      ctx.roundRect(b.x + border + size * 0.5, b.y + b.h - border - size * 2.3, lw, size * 1.8, size)
      ctx.fill()
      ctx.fillStyle = '#3b2433'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, b.x + border + size * 1.1, b.y + b.h - border - size * 1.4)
    }
  }

  const polaroid = (ph: LoadedPhoto, cx: number, cy: number, size: number, angle: number) => {
    const border = size * 0.06
    const bottom = size * 0.22
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    withShadow(ctx, k, () => {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(-size / 2, -size / 2, size, size + bottom - border, 10 * k)
      ctx.fill()
    })
    drawCover(ctx, ph.img, -size / 2 + border, -size / 2 + border, size - border * 2, size - border * 2, 6 * k)
    const label = opts.showDates ? ph.age : ph.caption
    if (label) {
      ctx.font = font(600, Math.max(14 * k, size * 0.075), pal.display)
      ctx.fillStyle = '#4b2537'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(wrapText(ctx, label, size - border * 2, 1)[0], 0, size / 2 + (bottom - border) / 2 - border / 2)
    }
    // washi tape
    ctx.fillStyle = pal.accent
    ctx.globalAlpha = 0.75
    ctx.fillRect(-size * 0.14, -size / 2 - size * 0.04, size * 0.28, size * 0.08)
    ctx.restore()
  }

  if (list.length === 0) {
    ctx.font = font(400, 200 * k)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📷', W / 2, box.y + box.h / 2)
  } else if (opts.layout === 'grid') {
    gridCells(list.length, box, 22 * k).forEach((c, i) => tile(list[i], c, 10 * k, 22 * k))
  } else if (opts.layout === 'hero') {
    const [first, ...rest] = list
    const heroH = rest.length ? box.h * 0.58 : box.h
    tile(first, { x: box.x, y: box.y, w: box.w, h: heroH - 12 * k }, 14 * k, 30 * k)
    if (rest.length) {
      const sub = { x: box.x, y: box.y + heroH + 12 * k, w: box.w, h: box.h - heroH - 12 * k }
      gridCells(rest.length, sub, 18 * k).forEach((c, i) => tile(rest[i], c, 8 * k, 18 * k))
    }
  } else {
    // A polaroid is ~1.16× taller than wide, so fit cells to that shape, then tilt & nudge a little.
    const cells = gridCells(list.length, { ...box, h: box.h / 1.16 }, 18 * k)
    cells
      .map((c, i) => ({ c, i, a: (rand() - 0.5) * 0.24, dx: (rand() - 0.5) * c.w * 0.08, dy: (rand() - 0.5) * c.h * 0.06 }))
      .forEach(({ c, i, a, dx, dy }) => {
        const size = Math.min(c.w, box.w * 0.9) * 0.94
        const cy = box.y + (c.y - box.y) * 1.16 + (c.h * 1.16) / 2
        polaroid(list[i], c.x + c.w / 2 + dx, cy - size * 0.08 + dy, size, a)
      })
  }

  if (opts.stickers) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const spots: [number, number][] = [
      [0.08, 0.05],
      [0.92, 0.07],
      [0.06, 0.96],
      [0.94, 0.94],
      [0.5 + (rand() - 0.5) * 0.6, 0.97],
    ]
    spots.forEach(([sx, sy], i) => {
      ctx.save()
      ctx.translate(W * sx, H * sy)
      ctx.rotate((rand() - 0.5) * 0.6)
      ctx.font = font(400, (70 + rand() * 30) * k)
      ctx.fillText(stickers[i % stickers.length], 0, 0)
      ctx.restore()
    })
  }

  pill(ctx, `💗 ${babyName} · Baby Stories`, W / 2, H - footerH / 2 - 6 * k, 24 * k, pal.primary, pal.primaryInk)
}
