import { Link, Navigate, useParams } from 'react-router'
import { ArrowLeft, Clapperboard, ImagePlus, LayoutGrid, Pencil, Play } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useProfile } from '../store/ProfileContext'
import { useTheme } from '../store/ThemeContext'
import { useUI } from '../store/UIContext'
import { ageInMonths, babyAge, formatDate } from '../lib/dates'
import { byTakenAsc, monthEmoji, monthLabel } from '../lib/months'
import { PhotoTile } from '../components/PhotoTile'
import { EmptyState } from '../components/EmptyState'
import { ThemeSwatches } from '../components/ThemeSwatches'
import { useI18n } from '../i18n'
import { albumName } from '../lib/albums'

export function AlbumPage({ kind }: { kind: 'album' | 'month' }) {
  const params = useParams()
  const { posts, albums, ready, updateAlbum } = useLibrary()
  const { profile } = useProfile()
  const { monthTheme, setMonthTheme } = useTheme()
  const { openPhoto, openStory, openAlbumForm } = useUI()
  const { t, lang } = useI18n()

  const album = kind === 'album' ? albums.find((a) => a.id === params.id) : undefined
  const month = kind === 'month' ? Number(params.n) : NaN
  if (kind === 'album' && !album) return ready ? <Navigate to="/albums" replace /> : null
  if (kind === 'month' && !Number.isInteger(month)) return <Navigate to="/albums" replace />

  const photos = posts
    .filter((p) => (album ? p.albumId === album.id : ageInMonths(profile.birthday, p.takenAt) === month))
    .sort(byTakenAsc)
  const ids = photos.map((p) => p.id)
  const theme = album ? album.theme : monthTheme(month)
  const setTheme = (id: string) => (album ? updateAlbum(album.id, { theme: id }) : setMonthTheme(month, id))
  const title = album ? albumName(album, lang) : monthLabel(month)
  const emoji = album ? album.emoji : monthEmoji(month)
  const src = album ? `album:${album.id}` : `month:${month}`
  const albumOf = (id: string) => albums.find((a) => a.id === id)

  return (
    <div data-theme={theme} className="relative isolate min-h-dvh bg-linear-to-b from-surface-2 to-bg text-ink">
      <div aria-hidden="true" className="theme-pattern pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <Link to="/albums" className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm font-bold text-muted hover:text-ink touch:py-3">
          <ArrowLeft className="size-4" /> {t('album.all')}
        </Link>

        <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-24 shrink-0 place-items-center rounded-[2rem] bg-surface text-5xl shadow-pop">{emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold tracking-widest text-primary uppercase">{album ? t('album.kicker') : t('album.monthKicker', { name: profile.name })}</p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-muted">
              {t('common.photos', { n: photos.length })}
              {photos.length > 0 && ` · ${formatDate(photos[0].takenAt)} – ${formatDate(photos[photos.length - 1].takenAt)}`}
            </p>
          </div>
          {album && (
            <button onClick={() => openAlbumForm(album.id)} className="btn btn-ghost self-start bg-surface sm:self-center">
              <Pencil className="size-4" /> {t('album.edit')}
            </button>
          )}
        </header>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button disabled={!photos.length} onClick={() => openStory(ids, `${emoji} ${title}`, theme)} className="btn btn-primary">
            <Play className="size-4 fill-current" /> {t('album.play')}
          </button>
          <Link to={`/studio?src=${src}&mode=video`} className="btn btn-ghost bg-surface">
            <Clapperboard className="size-4" /> {t('album.video')}
          </Link>
          <Link to={`/studio?src=${src}&mode=collage`} className="btn btn-ghost bg-surface">
            <LayoutGrid className="size-4" /> {t('album.collage')}
          </Link>
          {album && (
            <Link to={`/?album=${album.id}`} className="btn btn-ghost bg-surface">
              <ImagePlus className="size-4" /> {t('album.addPhotos')}
            </Link>
          )}
        </div>

        <section className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-extrabold">{album ? t('album.themeAlbum') : t('album.themeMonth')}</p>
          <ThemeSwatches value={theme} onChange={setTheme} size={34} />
        </section>

        <div className="mt-8">
          {photos.length === 0 ? (
            <EmptyState
              emoji={emoji}
              title={t('album.empty')}
              text={album ? t('album.emptyAlbum') : t('album.emptyMonth')}
              action={
                <Link to={album ? `/?album=${album.id}` : '/'} className="btn btn-primary">
                  <ImagePlus className="size-5" /> {t('album.upload')}
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
              {photos.map((p, i) => (
                <PhotoTile
                  key={p.id}
                  post={p}
                  onClick={() => openPhoto(ids, i)}
                  badge={album ? undefined : albumOf(p.albumId)?.emoji}
                  label={`${babyAge(profile.birthday, p.takenAt)} · ${formatDate(p.takenAt)}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
