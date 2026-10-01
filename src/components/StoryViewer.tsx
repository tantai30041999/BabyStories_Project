import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useProfile } from '../store/ProfileContext'
import { babyAge, formatDate } from '../lib/dates'
import type { Post } from '../types'
import { useI18n } from '../i18n'

const DURATION = 4000

/** Full-screen, tap-through slideshow of a set of photos. */
export function StoryViewer({ ids, title, theme, onClose }: { ids: string[]; title: string; theme: string; onClose: () => void }) {
  const { posts } = useLibrary()
  const { profile } = useProfile()
  const { t } = useI18n()
  const list = ids.map((id) => posts.find((p) => p.id === id)).filter((p): p is Post => !!p)

  const [i, setI] = useState(0)
  const [restart, setRestart] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const downAt = useRef(0)
  const post = list[i]

  const go = useCallback(
    (dir: 1 | -1) => {
      if (dir === 1) {
        if (i < list.length - 1) setI(i + 1)
        else onClose()
      } else if (i > 0) setI(i - 1)
      else setRestart((r) => r + 1)
    },
    [i, list.length, onClose],
  )
  const goRef = useRef(go)
  goRef.current = go

  const setPause = (v: boolean) => {
    pausedRef.current = v
    setPaused(v)
  }

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let p = 0
    const tick = (t: number) => {
      if (!pausedRef.current) p += (t - last) / DURATION
      last = t
      if (p >= 1) return goRef.current(1)
      setProgress(p)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [i, restart])

  useEffect(() => {
    if (!post) onClose()
  }, [post, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goRef.current(1)
      else if (e.key === 'ArrowLeft') goRef.current(-1)
      else if (e.key === ' ') {
        e.preventDefault()
        setPause(!pausedRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!post) return null

  return (
    <motion.div
      data-theme={theme}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/95 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 hidden rounded-full p-2 text-ink hover:bg-surface-2 sm:block"
        aria-label={t('story.close')}
      >
        <X className="size-7" />
      </button>

      <button
        onClick={() => go(-1)}
        className="mr-6 hidden size-11 place-items-center rounded-full bg-surface text-ink shadow-soft transition hover:scale-110 sm:grid"
        aria-label={t('story.prev')}
      >
        <ChevronLeft className="size-6" />
      </button>

      <motion.div
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 30 }}
        className="relative h-dvh w-full overflow-hidden bg-surface-2 shadow-pop sm:aspect-[9/16] sm:h-[min(92dvh,780px)] sm:w-auto sm:rounded-[2rem]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={post.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <img src={post.src} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl" />
            <img src={post.src} alt={post.caption || title} className="relative size-full object-contain" draggable={false} />
          </motion.div>
        </AnimatePresence>

        <div
          className="absolute inset-0 z-10 select-none"
          onPointerDown={() => {
            downAt.current = performance.now()
            setPause(true)
          }}
          onPointerUp={(e) => {
            setPause(false)
            if (performance.now() - downAt.current < 250) {
              const rect = e.currentTarget.getBoundingClientRect()
              go(e.clientX - rect.left < rect.width / 3 ? -1 : 1)
            }
          }}
          onPointerLeave={() => pausedRef.current && setPause(false)}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/50 to-transparent p-3 pb-10 text-white">
          <div className="flex gap-1">
            {list.map((p, idx) => (
              <div key={p.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                <div className="h-full rounded-full bg-white" style={{ width: `${idx < i ? 100 : idx === i ? progress * 100 : 0}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-extrabold">{title}</p>
              <p className="truncate text-xs text-white/85">
                {formatDate(post.takenAt)} · {babyAge(profile.birthday, post.takenAt)}
              </p>
            </div>
            {paused && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{t('story.paused')}</span>}
            <button onClick={onClose} className="pointer-events-auto rounded-full p-1.5 touch:p-2.5 hover:bg-white/15 sm:hidden" aria-label={t('story.close')}>
              <X className="size-6" />
            </button>
          </div>
        </div>

        {post.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/60 to-transparent p-5 pt-16 text-white">
            <p className="line-clamp-3 text-base leading-relaxed font-bold drop-shadow">{post.caption}</p>
          </div>
        )}
      </motion.div>

      <button
        onClick={() => go(1)}
        className="ml-6 hidden size-11 place-items-center rounded-full bg-surface text-ink shadow-soft transition hover:scale-110 sm:grid"
        aria-label={t('story.next')}
      >
        <ChevronRight className="size-6" />
      </button>
    </motion.div>
  )
}
