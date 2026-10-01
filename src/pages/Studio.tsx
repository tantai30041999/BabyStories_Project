import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, Clapperboard, LayoutGrid } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useProfile } from '../store/ProfileContext'
import { useTheme } from '../store/ThemeContext'
import { ageInMonths, formatDate } from '../lib/dates'
import { byTakenAsc, groupByMonth, monthEmoji, monthLabel } from '../lib/months'
import { ensureFonts, loadPhotos, type LoadedPhoto } from '../lib/canvas'
import { VideoStudio } from '../components/studio/VideoStudio'
import { CollageStudio } from '../components/studio/CollageStudio'
import { EmptyState } from '../components/EmptyState'
import type { Post } from '../types'
import { useI18n } from '../i18n'
import { albumName } from '../lib/albums'

type Mode = 'video' | 'collage'

function useLoadedPhotos(posts: Post[], birthday: string) {
  // lang: age/date labels are baked into the loaded photos
  const { lang } = useI18n()
  const [loaded, setLoaded] = useState<LoadedPhoto[] | null>(null)
  const key = posts.map((p) => p.id).join()
  useEffect(() => {
    let alive = true
    Promise.all([loadPhotos(posts, birthday), ensureFonts()]).then(([l]) => alive && setLoaded(l))
    return () => {
      alive = false
    }
  }, [key, birthday, lang])
  return loaded
}

export function Studio() {
  const [params, setParams] = useSearchParams()
  const { posts, albums } = useLibrary()
  const { profile } = useProfile()
  const { theme, monthTheme } = useTheme()
  const { t, lang } = useI18n()
  const src = params.get('src') ?? 'all'
  const mode: Mode = params.get('mode') === 'collage' ? 'collage' : 'video'
  const months = useMemo(() => groupByMonth(posts, profile.birthday), [posts, profile.birthday])

  const source = useMemo(() => {
    const [kind, arg] = src.split(':')
    if (kind === 'album') {
      const a = albums.find((x) => x.id === arg)
      if (a)
        return {
          posts: posts.filter((p) => p.albumId === a.id).sort(byTakenAsc),
          defaults: { title: `${albumName(a, lang)} ${a.emoji}`, subtitle: t('studio.albumSubtitle', { name: profile.name }), theme: a.theme },
          albumId: a.id,
        }
    }
    if (kind === 'month' && Number.isInteger(Number(arg))) {
      const m = Number(arg)
      const list = posts.filter((p) => ageInMonths(profile.birthday, p.takenAt) === m).sort(byTakenAsc)
      return {
        posts: list,
        defaults: { title: `${profile.name} · ${monthLabel(m)} ${monthEmoji(m)}`, subtitle: t('studio.moments', { n: list.length }), theme: monthTheme(m) },
        albumId: undefined,
      }
    }
    const all = [...posts].sort(byTakenAsc)
    return {
      posts: all,
      defaults: {
        title: t('studio.storyOf', { name: profile.name }),
        subtitle: all.length ? `${formatDate(all[0].takenAt)} – ${formatDate(all[all.length - 1].takenAt)}` : '',
        theme,
      },
      albumId: undefined,
    }
  }, [src, posts, albums, profile, monthTheme, theme, t, lang])

  const setParam = (k: string, v: string) =>
    setParams((p) => {
      p.set(k, v)
      return p
    })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t('studio.title')}</h1>
      <p className="mt-1 text-muted">{t('studio.intro')}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select value={src} onChange={(e) => setParam('src', e.target.value)} className="input sm:max-w-xs" aria-label={t('studio.from')}>
          <option value="all">{t('studio.allPhotos', { n: posts.length })}</option>
          <optgroup label={t('studio.byMonth')}>
            {months.map((g) => (
              <option key={g.month} value={`month:${g.month}`}>
                {monthEmoji(g.month)} {monthLabel(g.month)} ({g.posts.length})
              </option>
            ))}
          </optgroup>
          <optgroup label={t('studio.albums')}>
            {albums.map((a) => (
              <option key={a.id} value={`album:${a.id}`}>
                {a.emoji} {albumName(a, lang)} ({posts.filter((p) => p.albumId === a.id).length})
              </option>
            ))}
          </optgroup>
        </select>
        <div className="flex rounded-2xl bg-surface p-1 shadow-soft">
          {(
            [
              ['video', t('studio.video'), Clapperboard],
              ['collage', t('studio.collage'), LayoutGrid],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              onClick={() => setParam('mode', m)}
              aria-pressed={mode === m}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                mode === m ? 'bg-primary text-primary-ink shadow-soft' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {source.posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState emoji="📷" title={t('studio.empty')} text={t('studio.emptyHint')} />
        </div>
      ) : (
        <Workspace key={`${src}-${lang}`} mode={mode} source={source} birthday={profile.birthday} babyName={profile.name} />
      )}
    </div>
  )
}

function Workspace({
  mode,
  source,
  birthday,
  babyName,
}: {
  mode: Mode
  source: { posts: Post[]; defaults: { title: string; subtitle: string; theme: string }; albumId?: string }
  birthday: string
  babyName: string
}) {
  const { t } = useI18n()
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set())
  const chosen = source.posts.filter((p) => !excluded.has(p.id))
  const loaded = useLoadedPhotos(chosen, birthday)

  const toggle = (id: string) =>
    setExcluded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-3 text-sm">
          <p className="font-extrabold">
            {t('studio.chosen', { a: chosen.length, b: source.posts.length })}
          </p>
          <button onClick={() => setExcluded(new Set())} className="-my-2 px-1 py-2 font-bold text-primary touch:py-3">
            {t('common.all')}
          </button>
          <button onClick={() => setExcluded(new Set(source.posts.map((p) => p.id)))} className="-my-2 px-1 py-2 font-bold text-muted hover:text-ink touch:py-3">
            {t('common.none')}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
          {source.posts.map((p) => {
            const on = !excluded.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                aria-label={on ? t('studio.remove') : t('studio.add')}
                className={`relative size-16 shrink-0 overflow-hidden rounded-2xl transition sm:size-20 ${
                  on ? 'ring-3 ring-primary' : 'opacity-40 grayscale hover:opacity-70'
                }`}
              >
                <img src={p.src} alt="" className="size-full object-cover" loading="lazy" />
                {on && (
                  <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-ink">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-6">
        {mode === 'video' ? (
          <VideoStudio photos={loaded} defaults={source.defaults} babyName={babyName} />
        ) : (
          <CollageStudio photos={loaded} defaults={source.defaults} babyName={babyName} albumId={source.albumId} />
        )}
      </div>
    </>
  )
}
