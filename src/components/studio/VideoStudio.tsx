import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Download, Play, RotateCcw, Share2, Square } from 'lucide-react'
import { useUI } from '../../store/UIContext'
import { readPalette, saveBlob, shareOrSave, type LoadedPhoto } from '../../lib/canvas'
import { getTheme } from '../../lib/themes'
import {
  createStoryRenderer,
  pickVideoMime,
  previewStory,
  recordStory,
  storyDuration,
  type VideoOptions,
} from '../../lib/video'
import { ThemeSwatches } from '../ThemeSwatches'
import { Field, Segmented, Toggle } from './controls'
import { useI18n } from '../../i18n'

interface Props {
  photos: LoadedPhoto[] | null
  defaults: { title: string; subtitle: string; theme: string }
  babyName: string
}

const MAX_VIDEO = 30

export function VideoStudio({ photos, defaults, babyName }: Props) {
  const { toast } = useUI()
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [opts, setOpts] = useState<VideoOptions>({
    ...defaults,
    perPhoto: 2.5,
    transition: 'fade',
    showDates: true,
    music: true,
    ratio: '9:16',
  })
  const [status, setStatus] = useState<'idle' | 'preview' | 'recording'>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null)
  const set = (patch: Partial<VideoOptions>) => setOpts((o) => ({ ...o, ...patch }))

  const list = photos?.slice(0, MAX_VIDEO) ?? []
  const supported = typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype
  const ext = pickVideoMime().includes('mp4') ? 'mp4' : 'webm'

  const renderer = () =>
    createStoryRenderer(canvasRef.current!, list, opts, readPalette(opts.theme), getTheme(opts.theme).stickers, babyName)

  // Poster frame (title card) whenever settings change.
  useEffect(() => {
    if (status !== 'idle' || !photos || !canvasRef.current) return
    renderer().draw(1.2)
  })

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => () => void (result && URL.revokeObjectURL(result.url)), [result])

  const run = async (kind: 'preview' | 'recording') => {
    if (!list.length) return toast(t('video.pickOne'))
    const ac = new AbortController()
    abortRef.current = ac
    setStatus(kind)
    setProgress(0)
    const r = renderer()
    try {
      if (kind === 'preview') await previewStory(r, opts.music, setProgress, ac.signal)
      else {
        const blob = await recordStory(canvasRef.current!, r, opts.music, setProgress, ac.signal)
        setResult({ blob, url: URL.createObjectURL(blob) })
        toast(t('video.ready'))
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast(t('video.failed'))
    } finally {
      if (abortRef.current === ac) abortRef.current = null
      setStatus('idle')
    }
  }

  const fileName = `${(opts.title || 'baby-story').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase()}.${ext}`
  const seconds = Math.round(storyDuration(list.length, opts.perPhoto))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col items-center gap-4">
        {result && status === 'idle' ? (
          <video
            src={result.url}
            controls
            autoPlay
            playsInline
            className="max-h-[70dvh] w-auto max-w-full rounded-3xl bg-black shadow-pop"
          />
        ) : (
          <canvas ref={canvasRef} className="h-auto max-h-[70dvh] w-auto max-w-full rounded-3xl shadow-pop" />
        )}

        {status !== 'idle' && (
          <div className="w-full max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-1.5 text-center text-xs font-bold text-muted">
              {status === 'recording' ? t('video.recording') : t('video.previewing')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2.5">
          {result && status === 'idle' ? (
            <>
              <button onClick={() => saveBlob(result.blob, fileName)} className="btn btn-primary">
                <Download className="size-4" /> {t('video.download')}
              </button>
              <button
                onClick={async () => (await shareOrSave(result.blob, fileName)) === 'saved' && toast(t('video.saved'))}
                className="btn btn-ghost"
              >
                <Share2 className="size-4" /> {t('common.share')}
              </button>
              <button onClick={() => setResult(null)} className="btn btn-ghost">
                <RotateCcw className="size-4" /> {t('video.editAgain')}
              </button>
            </>
          ) : status === 'idle' ? (
            <>
              <button onClick={() => run('preview')} disabled={!photos} className="btn btn-ghost">
                <Play className="size-4 fill-current" /> {t('video.preview')}
              </button>
              <button onClick={() => run('recording')} disabled={!photos || !supported} className="btn btn-primary">
                <Clapperboard className="size-4" /> {t('video.create')}
              </button>
            </>
          ) : (
            <button onClick={() => abortRef.current?.abort()} className="btn btn-ghost">
              <Square className="size-4 fill-current" /> {t('video.stop')}
            </button>
          )}
        </div>
        {!supported && <p className="text-center text-xs text-muted">{t('video.unsupported')}</p>}
        {(photos?.length ?? 0) > MAX_VIDEO && (
          <p className="text-center text-xs text-muted">{t('video.firstN', { n: MAX_VIDEO })}</p>
        )}
      </div>

      <fieldset disabled={status !== 'idle'} className="card space-y-5 self-start p-5 disabled:opacity-60">
        <Field label={t('studio.titleField')}>
          <input className="input" value={opts.title} maxLength={50} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label={t('studio.subtitleField')}>
          <input className="input" value={opts.subtitle} maxLength={60} onChange={(e) => set({ subtitle: e.target.value })} />
        </Field>
        <Field label={t('common.theme')}>
          <ThemeSwatches value={opts.theme} onChange={(theme) => set({ theme })} size={32} />
        </Field>
        <Field label={t('studio.format')}>
          <Segmented
            value={opts.ratio}
            onChange={(ratio) => set({ ratio })}
            options={[
              { value: '9:16', label: t('studio.story') },
              { value: '1:1', label: t('studio.square') },
              { value: '4:5', label: t('studio.portrait') },
            ]}
          />
        </Field>
        <Field label={t('video.transition')}>
          <Segmented
            value={opts.transition}
            onChange={(transition) => set({ transition })}
            options={[
              { value: 'fade', label: t('video.fade') },
              { value: 'slide', label: t('video.slide') },
              { value: 'zoom', label: t('video.zoom') },
            ]}
          />
        </Field>
        <Field label={t('video.each', { s: opts.perPhoto, t: seconds })}>
          <input
            type="range"
            min={1.5}
            max={5}
            step={0.5}
            value={opts.perPhoto}
            onChange={(e) => set({ perPhoto: Number(e.target.value) })}
            className="w-full accent-[var(--primary)]"
          />
        </Field>
        <div className="space-y-2">
          <Toggle checked={opts.showDates} onChange={(showDates) => set({ showDates })}>
            {t('video.showDates')}
          </Toggle>
          <Toggle checked={opts.music} onChange={(music) => set({ music })}>
            {t('video.music')}
          </Toggle>
        </div>
      </fieldset>
    </div>
  )
}
