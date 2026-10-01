import { drawBackdrop, drawCover, font, pill, withShadow, wrapText, type LoadedPhoto, type Palette } from './canvas'
import { scheduleMusicBox } from './music'
import { translate } from '../i18n'

export type Transition = 'fade' | 'slide' | 'zoom'
export type Ratio = '9:16' | '1:1' | '4:5'

export interface VideoOptions {
  title: string
  subtitle: string
  theme: string
  perPhoto: number
  transition: Transition
  showDates: boolean
  music: boolean
  ratio: Ratio
}

export const VIDEO_SIZES: Record<Ratio, [number, number]> = {
  '9:16': [720, 1280],
  '1:1': [960, 960],
  '4:5': [864, 1080],
}

const INTRO = 2.4
const OUTRO = 2.6
const TR = 0.6

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const easeBack = (x: number) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2)

export const storyDuration = (n: number, per: number) => INTRO + n * per + OUTRO

interface Scene {
  kind: 'intro' | 'photo' | 'outro'
  start: number
  len: number
  index: number
}

export interface StoryRenderer {
  duration: number
  draw: (t: number) => void
}

export function createStoryRenderer(
  canvas: HTMLCanvasElement,
  photos: LoadedPhoto[],
  opts: VideoOptions,
  pal: Palette,
  stickers: string[],
  babyName: string,
): StoryRenderer {
  const [W, H] = VIDEO_SIZES[opts.ratio]
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const u = Math.min(W, H)
  const k = u / 720

  const n = photos.length
  const scenes: Scene[] = [
    { kind: 'intro', start: 0, len: INTRO, index: 0 },
    ...photos.map((_, i) => ({ kind: 'photo' as const, start: INTRO + i * opts.perPhoto, len: opts.perPhoto, index: i })),
    { kind: 'outro', start: INTRO + n * opts.perPhoto, len: OUTRO, index: 0 },
  ]
  const duration = storyDuration(n, opts.perPhoto)

  const centerText = (text: string, y: number, size: number, color: string, weight = 600, display: string | false = pal.display, maxLines = 2) => {
    ctx.font = font(weight, size, display)
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lines = wrapText(ctx, text, W * 0.8, maxLines)
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + (i - (lines.length - 1) / 2) * size * 1.15))
    return lines.length
  }

  const drawIntro = (lt: number) => {
    const p = clamp01(lt / 0.9)
    const s = easeBack(p)
    ctx.save()
    ctx.translate(W / 2, H * 0.45)
    ctx.scale(s, s)
    ctx.translate(-W / 2, -H * 0.45)
    ctx.font = font(400, 150 * k)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(stickers[0] ?? '💗', W / 2, H * 0.3 + Math.sin(lt * 3) * 8 * k)
    centerText(opts.title, H * 0.45, 64 * k, pal.ink)
    ctx.restore()
    ctx.globalAlpha *= clamp01((lt - 0.4) / 0.6)
    if (opts.subtitle) centerText(opts.subtitle, H * 0.56, 30 * k, pal.muted, 700, false)
    pill(ctx, `${babyName} · Baby Stories`, W / 2, H * 0.68, 22 * k, pal.primary, pal.primaryInk)
  }

  const drawPhoto = (i: number, lt: number) => {
    const ph = photos[i]
    const pad = 22 * k
    const cardW = W * 0.8
    const pw = cardW - pad * 2
    const labelH = opts.showDates || ph.caption ? 120 * k : pad
    const phH = Math.min(pw * (opts.ratio === '9:16' ? 1.25 : 1), H * 0.8 - labelH - pad * 2)
    const cardH = pad + phH + labelH
    const x = (W - cardW) / 2
    const y = (H - cardH) / 2 + (opts.ratio === '9:16' ? 10 * k : 0)
    const tilt = ((i % 2 ? 1 : -1) * 1.8 * Math.PI) / 180

    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(tilt)
    ctx.translate(-W / 2, -H / 2)
    withShadow(ctx, k, () => {
      ctx.fillStyle = pal.surface
      ctx.beginPath()
      ctx.roundRect(x, y, cardW, cardH, 30 * k)
      ctx.fill()
    })
    drawCover(ctx, ph.img, x + pad, y + pad, pw, phH, 20 * k, 1 + 0.08 * clamp01(lt / opts.perPhoto))

    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    let ty = y + pad + phH + 46 * k
    if (opts.showDates) {
      ctx.font = font(600, 34 * k, pal.display)
      ctx.fillStyle = pal.ink
      ctx.fillText(ph.age, x + pad + 4 * k, ty)
      ctx.font = font(700, 22 * k)
      ctx.fillStyle = pal.muted
      ctx.textAlign = 'right'
      ctx.fillText(ph.date, x + cardW - pad - 4 * k, ty)
      ctx.textAlign = 'left'
      ty += 38 * k
    }
    if (ph.caption) {
      ctx.font = font(700, 24 * k)
      ctx.fillStyle = opts.showDates ? pal.muted : pal.ink
      const line = wrapText(ctx, ph.caption, pw - 8 * k, 1)[0]
      ctx.fillText(line, x + pad + 4 * k, opts.showDates ? ty : ty + 10 * k)
    }
    ctx.restore()
  }

  const drawOutro = (lt: number) => {
    const p = easeBack(clamp01(lt / 0.9))
    ctx.save()
    ctx.translate(W / 2, H * 0.4)
    ctx.scale(p, p)
    ctx.font = font(400, 170 * k)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💗', 0, Math.sin(lt * 4) * 10 * k)
    ctx.restore()
    centerText(translate('video.madeWithLove'), H * 0.56, 54 * k, pal.ink)
    centerText(translate('video.forBaby', { name: babyName }), H * 0.63, 30 * k, pal.muted, 700, false)
  }

  const drawScene = (s: Scene, lt: number, amount: number, dir: 1 | -1) => {
    ctx.save()
    if (opts.transition === 'slide') {
      ctx.translate((1 - amount) * W * dir, 0)
      ctx.globalAlpha = clamp01(amount * 1.5)
    } else if (opts.transition === 'zoom') {
      const sc = dir === 1 ? 0.8 + 0.2 * amount : 1 + 0.3 * (1 - amount)
      ctx.translate(W / 2, H / 2)
      ctx.scale(sc, sc)
      ctx.translate(-W / 2, -H / 2)
      ctx.globalAlpha = amount
    } else ctx.globalAlpha = amount
    if (s.kind === 'intro') drawIntro(lt)
    else if (s.kind === 'photo') drawPhoto(s.index, lt)
    else drawOutro(lt)
    ctx.restore()
  }

  const drawProgress = (t: number) => {
    if (!n) return
    const gap = 6 * k
    const top = 24 * k
    const side = 24 * k
    const w = (W - side * 2 - gap * (n - 1)) / n
    for (let i = 0; i < n; i++) {
      const f = clamp01((t - INTRO - i * opts.perPhoto) / opts.perPhoto)
      ctx.fillStyle = pal.line
      ctx.beginPath()
      ctx.roundRect(side + i * (w + gap), top, w, 6 * k, 3 * k)
      ctx.fill()
      if (f > 0) {
        ctx.fillStyle = pal.primary
        ctx.beginPath()
        ctx.roundRect(side + i * (w + gap), top, w * f, 6 * k, 3 * k)
        ctx.fill()
      }
    }
  }

  const draw = (t: number) => {
    t = Math.min(t, duration - 0.001)
    drawBackdrop(ctx, W, H, pal, stickers, t)
    drawProgress(t)
    const si = scenes.findIndex((s) => t >= s.start && t < s.start + s.len)
    const s = scenes[Math.max(0, si)]
    const lt = t - s.start
    const next = scenes[si + 1]
    if (next && lt > s.len - TR) {
      const e = easeOut((lt - (s.len - TR)) / TR)
      drawScene(s, lt, 1 - e, -1)
      drawScene(next, 0, e, 1)
    } else drawScene(s, lt, 1, 1)
  }

  return { duration, draw }
}

export function animate(duration: number, frame: (t: number) => void, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const start = performance.now()
    const tick = () => {
      if (signal?.aborted) return resolve()
      const t = (performance.now() - start) / 1000
      frame(Math.min(t, duration))
      if (t >= duration) return resolve()
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/** Plays the story on the canvas (with music out loud if asked). */
export async function previewStory(r: StoryRenderer, music: boolean, onProgress: (p: number) => void, signal: AbortSignal) {
  let actx: AudioContext | undefined
  if (music) {
    actx = new AudioContext()
    scheduleMusicBox(actx, actx.destination, actx.currentTime + 0.05, r.duration)
  }
  await animate(r.duration, (t) => {
    r.draw(t)
    onProgress(t / r.duration)
  }, signal)
  void actx?.close()
}

const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]

export const pickVideoMime = () =>
  typeof MediaRecorder === 'undefined' ? '' : (MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? '')

/** Records the story in real time from the canvas (+ music box track) into a video file. */
export async function recordStory(
  canvas: HTMLCanvasElement,
  r: StoryRenderer,
  music: boolean,
  onProgress: (p: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  const stream = canvas.captureStream(30)
  let actx: AudioContext | undefined
  if (music) {
    actx = new AudioContext()
    await actx.resume()
    const dest = actx.createMediaStreamDestination()
    scheduleMusicBox(actx, dest, actx.currentTime + 0.05, r.duration)
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr))
  }
  const mimeType = pickVideoMime()
  const rec = new MediaRecorder(stream, { ...(mimeType && { mimeType }), videoBitsPerSecond: 6_000_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const stopped = new Promise<void>((res) => (rec.onstop = () => res()))

  r.draw(0)
  rec.start(250)
  await animate(r.duration, (t) => {
    r.draw(t)
    onProgress(t / r.duration)
  }, signal)
  rec.stop()
  await stopped
  stream.getTracks().forEach((t) => t.stop())
  void actx?.close()
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
  return new Blob(chunks, { type: (rec.mimeType || mimeType || 'video/webm').split(';')[0] })
}
