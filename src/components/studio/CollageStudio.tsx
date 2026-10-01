import { useEffect, useRef, useState } from 'react'
import { Download, FolderInput, Share2, Shuffle } from 'lucide-react'
import { useLibrary } from '../../store/LibraryContext'
import { useUI } from '../../store/UIContext'
import { readPalette, saveBlob, shareOrSave, type LoadedPhoto } from '../../lib/canvas'
import { drawCollage, MAX_COLLAGE, type CollageOptions } from '../../lib/collage'
import { getTheme } from '../../lib/themes'
import { toDateInput } from '../../lib/dates'
import { ThemeSwatches } from '../ThemeSwatches'
import { Field, Segmented, Toggle } from './controls'
import { useI18n } from '../../i18n'
import { albumName } from '../../lib/albums'

interface Props {
  photos: LoadedPhoto[] | null
  defaults: { title: string; subtitle: string; theme: string }
  babyName: string
  albumId?: string
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/png'))

export function CollageStudio({ photos, defaults, babyName, albumId }: Props) {
  const { albums, addPhotos } = useLibrary()
  const { toast } = useUI()
  const { t, lang } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [opts, setOpts] = useState<CollageOptions>({
    ...defaults,
    layout: 'polaroid',
    ratio: '4:5',
    showDates: true,
    stickers: true,
    seed: 7,
  })
  const [target, setTarget] = useState(albumId ?? albums[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<CollageOptions>) => setOpts((o) => ({ ...o, ...patch }))

  useEffect(() => {
    if (!photos || !canvasRef.current) return
    drawCollage(canvasRef.current, photos, opts, readPalette(opts.theme), getTheme(opts.theme).stickers, babyName)
  }, [photos, opts, babyName])

  const fileName = `${(opts.title || 'baby-collage').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase()}.png`

  const saveToAlbum = async () => {
    if (!canvasRef.current || !target) return
    setSaving(true)
    try {
      const blob = await toBlob(canvasRef.current)
      await addPhotos([{ blob, takenAt: toDateInput(new Date()) }], target, t('collage.caption', { title: opts.title }))
      const a = albums.find((x) => x.id === target)
      toast(t('collage.savedTo', { album: a ? `${a.emoji} ${albumName(a, lang)}` : '' }))
    } catch {
      toast(t('collage.saveFailed'))
    }
    setSaving(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col items-center gap-4">
        <canvas ref={canvasRef} className="h-auto max-h-[70dvh] w-auto max-w-full rounded-3xl shadow-pop" />
        <div className="flex flex-wrap justify-center gap-2.5">
          <button
            onClick={async () => canvasRef.current && saveBlob(await toBlob(canvasRef.current), fileName)}
            disabled={!photos}
            className="btn btn-primary"
          >
            <Download className="size-4" /> {t('collage.download')}
          </button>
          <button
            onClick={async () => {
              if (!canvasRef.current) return
              if ((await shareOrSave(await toBlob(canvasRef.current), fileName)) === 'saved') toast(t('collage.imageSaved'))
            }}
            disabled={!photos}
            className="btn btn-ghost"
          >
            <Share2 className="size-4" /> {t('common.share')}
          </button>
        </div>
        <div className="flex w-full max-w-md items-center gap-2 rounded-3xl bg-surface p-2 shadow-soft">
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input border-0 py-2 text-sm" aria-label={t('common.album')}>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {albumName(a, lang)}
              </option>
            ))}
          </select>
          <button onClick={saveToAlbum} disabled={!photos || saving || !target} className="btn btn-ghost shrink-0 px-3.5">
            <FolderInput className="size-4" /> {saving ? t('common.saving') : t('collage.saveToAlbum')}
          </button>
        </div>
        {(photos?.length ?? 0) > MAX_COLLAGE && (
          <p className="text-center text-xs text-muted">{t('collage.max', { n: MAX_COLLAGE })}</p>
        )}
      </div>

      <div className="card space-y-5 self-start p-5">
        <Field label={t('studio.titleField')}>
          <input className="input" value={opts.title} maxLength={50} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label={t('studio.subtitleField')}>
          <input className="input" value={opts.subtitle} maxLength={60} onChange={(e) => set({ subtitle: e.target.value })} />
        </Field>
        <Field label={t('common.theme')}>
          <ThemeSwatches value={opts.theme} onChange={(theme) => set({ theme })} size={32} />
        </Field>
        <Field label={t('collage.layout')}>
          <Segmented
            value={opts.layout}
            onChange={(layout) => set({ layout })}
            options={[
              { value: 'polaroid', label: t('collage.polaroid') },
              { value: 'grid', label: t('collage.grid') },
              { value: 'hero', label: t('collage.hero') },
            ]}
          />
        </Field>
        <Field label={t('studio.size')}>
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
        <div className="space-y-2">
          <Toggle checked={opts.showDates} onChange={(showDates) => set({ showDates })}>
            {t('collage.showAge')}
          </Toggle>
          <Toggle checked={opts.stickers} onChange={(stickers) => set({ stickers })}>
            {t('collage.stickers')}
          </Toggle>
        </div>
        <button onClick={() => set({ seed: opts.seed + 1 })} className="btn btn-ghost w-full">
          <Shuffle className="size-4" /> {t('collage.shuffle')}
        </button>
      </div>
    </div>
  )
}
