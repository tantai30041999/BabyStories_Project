import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { FolderPlus, ImagePlus, Plus, X } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useProfile } from '../store/ProfileContext'
import { useTheme } from '../store/ThemeContext'
import { useUI } from '../store/UIContext'
import { ALBUM_EMOJIS } from '../lib/albums'
import { babyAge, formatDate, toDateInput } from '../lib/dates'
import { monthEmoji, monthLabel } from '../lib/months'
import { getTheme } from '../lib/themes'
import { resizeImage } from '../lib/image'
import { readJSON, writeJSON } from '../lib/storage'
import { LogoMark } from '../components/Logo'
import { useI18n } from '../i18n'
import { albumName } from '../lib/albums'
import { ThemeSwatches } from '../components/ThemeSwatches'
import type { Album } from '../types'

interface Picked {
  key: string
  file: File
  url: string
  takenAt: string
}

const MAX_BATCH = 30
const LAST_ALBUM_KEY = 'bs:lastAlbum'

const FLOATERS = [
  { e: '🧸', cls: '-left-3 top-6 sm:-left-12', d: 0 },
  { e: '🍼', cls: '-right-2 top-2 sm:-right-10 sm:top-16', d: 0.6 },
  { e: '🐥', cls: 'hidden sm:block -left-14 bottom-24', d: 1.2 },
  { e: '☁️', cls: 'hidden sm:block right-16 -top-10', d: 0.3 },
  { e: '⭐', cls: 'hidden sm:block -right-12 bottom-16', d: 0.9 },
  { e: '🎀', cls: 'hidden sm:block left-20 -bottom-7', d: 1.5 },
]

export function Home() {
  const { albums, addPhotos, createAlbum } = useLibrary()
  const { profile } = useProfile()
  const { currentMonth, monthTheme, setMonthTheme, followMonth, setFollowMonth } = useTheme()
  const { toast } = useUI()
  const { t, tr, lang } = useI18n()
  const [params] = useSearchParams()

  const [files, setFiles] = useState<Picked[]>([])
  const [albumId, setAlbumId] = useState<string | null>(() => params.get('album') ?? readJSON(LAST_ALBUM_KEY, null))
  const [newAlbum, setNewAlbum] = useState<{ name: string; emoji: string } | null>(null)
  const [caption, setCaption] = useState('')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ count: number; album: Album } | null>(null)
  const today = toDateInput(new Date())
  const filesRef = useRef(files)
  filesRef.current = files

  const selected = albums.find((a) => a.id === albumId) ?? albums[0]
  const thisMonthTheme = getTheme(monthTheme(currentMonth))

  // Free preview URLs when leaving the page.
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), [])

  const add = (list: FileList | File[] | null | undefined) => {
    const imgs = Array.from(list ?? []).filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return toast(t('home.notPictures'))
    setDone(null)
    setFiles((cur) => {
      const room = MAX_BATCH - cur.length
      if (imgs.length > room) toast(t('home.maxBatch', { n: MAX_BATCH }))
      return [
        ...cur,
        ...imgs.slice(0, Math.max(0, room)).map((file) => {
          const d = toDateInput(new Date(file.lastModified))
          return { key: crypto.randomUUID(), file, url: URL.createObjectURL(file), takenAt: d > today ? today : d }
        }),
      ]
    })
  }
  const addRef = useRef(add)
  addRef.current = add

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length) addRef.current(e.clipboardData.files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const remove = (key: string) =>
    setFiles((cur) => {
      const f = cur.find((x) => x.key === key)
      if (f) URL.revokeObjectURL(f.url)
      return cur.filter((x) => x.key !== key)
    })

  const save = async () => {
    let target = selected
    if (newAlbum) {
      if (!newAlbum.name.trim()) return toast(t('home.nameAlbum'))
      target = createAlbum({ name: newAlbum.name.trim(), emoji: newAlbum.emoji, theme: monthTheme(currentMonth) })
    }
    if (!target) return toast(t('home.createAlbumFirst'))
    setBusy(true)
    const photos = []
    for (const f of files) {
      try {
        photos.push({ blob: await resizeImage(f.file), takenAt: f.takenAt })
      } catch {
        /* skip unreadable file (e.g. HEIC on some browsers) */
      }
    }
    if (photos.length) await addPhotos(photos, target.id, caption.trim())
    files.forEach((f) => URL.revokeObjectURL(f.url))
    writeJSON(LAST_ALBUM_KEY, target.id)
    setAlbumId(target.id)
    setFiles([])
    setCaption('')
    setNewAlbum(null)
    setBusy(false)
    if (photos.length < files.length) toast(t('home.unreadable', { n: files.length - photos.length }))
    if (photos.length) setDone({ count: photos.length, album: target })
  }

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      add(e.dataTransfer.files)
    },
  }

  const chip = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
      active ? 'bg-primary text-primary-ink shadow-soft' : 'bg-surface-2 hover:bg-line'
    }`

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <header className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm font-bold shadow-soft">
          {monthEmoji(currentMonth)} {t('home.today', { name: profile.name, age: babyAge(profile.birthday, today) })}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('home.heroA')}
          <span className="text-primary">{t('home.heroB')}</span>
          {t('home.heroC')}
        </h1>
        <p className="mt-2 text-muted">{t('home.intro')}</p>
      </header>

      <div className="relative mt-10">
        {FLOATERS.map((f) => (
          <motion.span
            key={f.e}
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 text-4xl drop-shadow-sm sm:text-5xl ${f.cls} ${
              files.length ? 'max-sm:hidden' : '' /* phones: don't cover the form */
            }`}
            animate={{ y: [0, -12, 0], rotate: [-6, 6, -6] }}
            transition={{ repeat: Infinity, duration: 3.2, delay: f.d, ease: 'easeInOut' }}
          >
            {f.e}
          </motion.span>
        ))}

        <div className="card relative p-4 shadow-pop sm:p-7">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-10 text-center"
              >
                <motion.span
                  className="text-7xl"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                >
                  🎉
                </motion.span>
                <h2 className="mt-4 font-display text-2xl font-semibold">
                  {t('home.saved', { n: done.count })}
                </h2>
                <p className="mt-1 text-muted">
                  {t('home.tuckedInto')} {done.album.emoji} <b className="text-ink">{albumName(done.album, lang)}</b>
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to={`/albums/${done.album.id}`} className="btn btn-primary">
                    {t('home.viewAlbum')}
                  </Link>
                  <button onClick={() => setDone(null)} className="btn btn-ghost">
                    {t('home.uploadMore')}
                  </button>
                </div>
              </motion.div>
            ) : files.length === 0 ? (
              <motion.label
                key="drop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...dropProps}
                className={`flex cursor-pointer flex-col items-center justify-center gap-5 rounded-[1.75rem] border-[3px] border-dashed px-6 py-14 text-center transition sm:py-20 ${
                  dragging ? 'scale-[1.02] border-primary bg-surface-2' : 'border-line hover:border-primary/60 hover:bg-surface-2/60'
                }`}
              >
                <motion.span
                  animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                  className="relative"
                >
                  <LogoMark size={104} />
                  <span className="absolute -right-3 -bottom-2 grid size-11 place-items-center rounded-full bg-surface text-primary shadow-soft">
                    <ImagePlus className="size-6" />
                  </span>
                </motion.span>
                <span>
                  <span className="block font-display text-2xl font-semibold">{t('home.dropTitle')}</span>
                  <span className="mt-1 block text-sm text-muted">{t('home.dropHint')}</span>
                </span>
                <span className="btn btn-primary px-6 py-3 text-base">
                  <ImagePlus className="size-5" /> {t('home.choose')}
                </span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} />
              </motion.label>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold">
                      {t('home.ready', { n: files.length })}
                    </h2>
                    <button
                      onClick={() => {
                        files.forEach((f) => URL.revokeObjectURL(f.url))
                        setFiles([])
                      }}
                      className="text-sm font-bold text-muted hover:text-primary"
                    >
                      {t('home.clear')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5" {...dropProps}>
                    {files.map((f) => (
                      <motion.div key={f.key} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-1">
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-2">
                          <img src={f.url} alt="" className="size-full object-cover" />
                          <button
                            onClick={() => remove(f.key)}
                            className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/45 text-white hover:bg-black/65 touch:size-8"
                            aria-label={t('home.removePhoto')}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        {/* Readable short date on top; the real (invisible) date field covers it and opens the native picker. */}
                        <label className="relative block truncate rounded-lg py-1 text-center text-[11px] font-bold text-muted hover:text-ink focus-within:text-ink focus-within:ring-2 focus-within:ring-primary touch:py-2">
                          📅 {formatDate(f.takenAt)}
                          <input
                            type="date"
                            value={f.takenAt}
                            max={today}
                            aria-label={t('home.takenOn')}
                            onClick={(e) => {
                              try {
                                e.currentTarget.showPicker?.()
                              } catch {
                                /* older browsers open their own picker */
                              }
                            }}
                            onChange={(e) =>
                              e.target.value &&
                              setFiles((cur) => cur.map((x) => (x.key === f.key ? { ...x, takenAt: e.target.value } : x)))
                            }
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                          />
                        </label>
                      </motion.div>
                    ))}
                    {files.length < MAX_BATCH && (
                      <label
                        className={`grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed text-primary transition hover:bg-surface-2 ${
                          dragging ? 'border-primary bg-surface-2' : 'border-line'
                        }`}
                      >
                        <span className="flex flex-col items-center gap-1 text-xs font-bold">
                          <Plus className="size-6" /> {t('home.addMore')}
                        </span>
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-sm font-extrabold">{t('home.saveTo')}</p>
                  <div className="flex flex-wrap gap-2">
                    {albums.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setAlbumId(a.id)
                          setNewAlbum(null)
                        }}
                        className={chip(!newAlbum && selected?.id === a.id)}
                        aria-pressed={!newAlbum && selected?.id === a.id}
                      >
                        {a.emoji} {albumName(a, lang)}
                      </button>
                    ))}
                    <button
                      onClick={() => setNewAlbum(newAlbum ?? { name: '', emoji: ALBUM_EMOJIS[0] })}
                      className={`${chip(!!newAlbum)} border-2 border-dashed border-primary/50`}
                    >
                      <FolderPlus className="size-4" /> {t('home.newAlbum')}
                    </button>
                  </div>

                  <AnimatePresence>
                    {newAlbum && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <div className="mt-3 space-y-3 rounded-3xl bg-surface-2 p-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-2xl">{newAlbum.emoji}</span>
                            <input
                              className="input bg-surface"
                              placeholder={t('home.newAlbumPlaceholder')}
                              value={newAlbum.name}
                              maxLength={40}
                              autoFocus
                              onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                            />
                          </div>
                          <div className="no-scrollbar flex gap-1 overflow-x-auto">
                            {ALBUM_EMOJIS.map((em) => (
                              <button
                                key={em}
                                onClick={() => setNewAlbum({ ...newAlbum, emoji: em })}
                                className={`grid size-9 shrink-0 place-items-center rounded-xl text-lg transition hover:bg-surface ${
                                  newAlbum.emoji === em ? 'bg-surface ring-2 ring-primary' : ''
                                }`}
                                aria-label={em}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold">{t('home.note')}</span>
                  <input
                    className="input"
                    value={caption}
                    maxLength={200}
                    placeholder={t('home.notePlaceholder', { name: profile.name })}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </label>

                <button onClick={save} disabled={busy} className="btn btn-primary w-full py-3.5 text-base">
                  {busy ? t('common.saving') : t('home.saveN', { n: files.length })}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <section className="card mt-8 flex flex-col gap-4 p-5">
        <div className="min-w-0">
          <p className="font-extrabold">
            {t('home.monthTheme', { month: monthLabel(currentMonth).toLowerCase() })} · {thisMonthTheme.emoji} {tr(thisMonthTheme.name)}
          </p>
          <label className="mt-1 flex cursor-pointer items-center gap-2 py-1 text-sm text-muted touch:py-2.5">
            <input
              type="checkbox"
              checked={followMonth}
              onChange={(e) => setFollowMonth(e.target.checked)}
              className="size-4 shrink-0 accent-[var(--primary)] touch:size-5"
            />
            {t('home.useEverywhere')}
          </label>
        </div>
        <ThemeSwatches value={monthTheme(currentMonth)} onChange={(id) => setMonthTheme(currentMonth, id)} size={34} />
      </section>
    </div>
  )
}
