import { useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { FolderPlus } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useProfile } from '../store/ProfileContext'
import { useTheme } from '../store/ThemeContext'
import { useUI } from '../store/UIContext'
import { byTakenAsc, groupByMonth, monthEmoji, monthLabel } from '../lib/months'
import { getTheme } from '../lib/themes'
import type { Post } from '../types'
import { useI18n } from '../i18n'
import { albumName } from '../lib/albums'

function Mosaic({ posts, emoji }: { posts: Post[]; emoji: string }) {
  const four = posts.slice(-4)
  if (four.length === 0)
    return <div className="grid aspect-square place-items-center rounded-2xl bg-surface-2 text-5xl">{emoji}</div>
  if (four.length < 4)
    return <img src={four[four.length - 1].src} alt="" className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
  return (
    <div className="grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-2xl">
      {four.map((p) => (
        <img key={p.id} src={p.src} alt="" className="size-full object-cover" loading="lazy" />
      ))}
    </div>
  )
}

function Card({ to, theme, posts, emoji, title, i }: { to: string; theme: string; posts: Post[]; emoji: string; title: string; i: number }) {
  const { t, tr } = useI18n()
  const th = getTheme(theme)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
      <Link
        to={to}
        data-theme={theme}
        className="group block rounded-[1.75rem] border border-line bg-surface p-2.5 text-ink shadow-soft transition hover:-translate-y-1 hover:shadow-pop"
      >
        <div className="relative">
          <Mosaic posts={posts} emoji={emoji} />
          <span className="absolute -bottom-3 left-3 grid size-10 place-items-center rounded-full border-4 border-surface bg-surface-2 text-lg">
            {emoji}
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 px-1.5 pt-5 pb-1">
          <div className="min-w-0">
            <p className="truncate font-extrabold">{title}</p>
            <p className="text-xs text-muted">
              {t('common.photos', { n: posts.length })}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs" title={t('albums.themeOf', { theme: tr(th.name) })}>
            {th.emoji}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export function Albums() {
  const { posts, albums } = useLibrary()
  const { profile } = useProfile()
  const { monthTheme } = useTheme()
  const { openAlbumForm } = useUI()
  const { t, lang } = useI18n()
  const months = useMemo(() => groupByMonth(posts, profile.birthday), [posts, profile.birthday])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t('albums.title')}</h1>
          <p className="mt-1 text-muted">{t('albums.intro', { name: profile.name })}</p>
        </div>
        <button onClick={() => openAlbumForm()} className="btn btn-primary">
          <FolderPlus className="size-5" /> {t('albums.new')}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="mb-1 font-display text-xl font-semibold">{t('albums.byMonth')}</h2>
        <p className="mb-4 text-sm text-muted">{t('albums.byMonthHint')}</p>
        {months.length === 0 ? (
          <p className="card p-6 text-center text-muted">{t('albums.noMonths')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {months.map((g, i) => (
              <Card
                key={g.month}
                i={i}
                to={`/months/${g.month}`}
                theme={monthTheme(g.month)}
                posts={g.posts}
                emoji={monthEmoji(g.month)}
                title={monthLabel(g.month)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold">{t('albums.mine')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((a, i) => (
            <Card
              key={a.id}
              i={i}
              to={`/albums/${a.id}`}
              theme={a.theme}
              posts={posts.filter((p) => p.albumId === a.id).sort(byTakenAsc)}
              emoji={a.emoji}
              title={albumName(a, lang)}
            />
          ))}
          <button
            onClick={() => openAlbumForm()}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[1.75rem] border-2 border-dashed border-line text-primary transition hover:border-primary hover:bg-surface"
          >
            <FolderPlus className="size-8" />
            <span className="text-sm font-extrabold">{t('albums.create')}</span>
          </button>
        </div>
      </section>
    </div>
  )
}
