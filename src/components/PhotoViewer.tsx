import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Download, Trash2, X } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useProfile } from '../store/ProfileContext'
import { useUI } from '../store/UIContext'
import { babyAge, formatDate } from '../lib/dates'
import { saveBlob } from '../lib/canvas'
import type { Post } from '../types'
import { Modal } from './Modal'
import { useI18n } from '../i18n'
import { albumName } from '../lib/albums'

async function download(post: Post) {
  const blob = await (await fetch(post.src)).blob()
  saveBlob(blob, `baby-story-${post.takenAt}.${blob.type.includes('svg') ? 'svg' : 'jpg'}`)
}

export function PhotoViewer({ ids, index, onClose }: { ids: string[]; index: number; onClose: () => void }) {
  const { posts, albums, deletePost, movePost, updateCaption } = useLibrary()
  const { profile } = useProfile()
  const { toast } = useUI()
  const { t, lang } = useI18n()
  const list = ids.map((id) => posts.find((p) => p.id === id)).filter((p): p is Post => !!p)
  const [i, setI] = useState(index)
  const [confirming, setConfirming] = useState(false)
  const post = list[Math.min(i, list.length - 1)]
  const [caption, setCaption] = useState(post?.caption ?? '')

  useEffect(() => {
    if (!post) onClose()
  }, [post, onClose])

  useEffect(() => {
    setCaption(post?.caption ?? '')
    setConfirming(false)
  }, [post?.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
      if (e.key === 'ArrowRight') setI((x) => Math.min(list.length - 1, x + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list.length])

  if (!post) return null
  const pos = list.indexOf(post)
  const saveCaption = () => caption.trim() !== post.caption && updateCaption(post.id, caption.trim())

  return (
    <Modal onClose={onClose} label={t('photo.label')} className="max-w-5xl sm:flex sm:overflow-hidden">
      <div className="relative grid place-items-center bg-surface-2 select-none sm:flex-1">
        <motion.img
          key={post.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          src={post.src}
          alt={post.caption || t('photo.alt')}
          className="max-h-[50dvh] w-full object-contain sm:max-h-[88dvh]"
          draggable={false}
        />
        {pos > 0 && (
          <button
            onClick={() => setI(pos - 1)}
            className="absolute left-3 grid size-9 place-items-center rounded-full bg-white/85 text-[#3b2433] shadow transition hover:scale-110"
            aria-label={t('photo.prev')}
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {pos < list.length - 1 && (
          <button
            onClick={() => setI(pos + 1)}
            className="absolute right-3 grid size-9 place-items-center rounded-full bg-white/85 text-[#3b2433] shadow transition hover:scale-110"
            aria-label={t('photo.next')}
          >
            <ChevronRight className="size-5" />
          </button>
        )}
        <span className="absolute bottom-3 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white">
          {pos + 1} / {list.length}
        </span>
      </div>

      <div className="flex w-full flex-col gap-5 p-5 sm:max-h-[92dvh] sm:w-[340px] sm:shrink-0 sm:overflow-y-auto sm:border-l sm:border-line">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold">{babyAge(profile.birthday, post.takenAt)}</p>
            <p className="text-sm text-muted">{formatDate(post.takenAt)}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 touch:p-2.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label={t('common.close')}>
            <X className="size-5" />
          </button>
        </header>

        <label className="block">
          <span className="mb-1.5 block text-sm font-extrabold">📁 {t('common.album')}</span>
          <select
            className="input"
            value={post.albumId}
            onChange={(e) => {
              movePost(post.id, e.target.value)
              toast(t('photo.moved'))
            }}
          >
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {albumName(a, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-extrabold">{t('photo.note')}</span>
          <textarea
            className="input resize-none"
            rows={3}
            maxLength={200}
            value={caption}
            placeholder={t('photo.notePlaceholder')}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={saveCaption}
          />
        </label>

        <div className="mt-auto space-y-3">
          {confirming ? (
            <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-3 text-sm">
              <span className="flex-1 font-bold">{t('photo.confirmDelete')}</span>
              <button onClick={() => setConfirming(false)} className="btn btn-ghost bg-surface px-3 py-1.5">
                {t('common.keep')}
              </button>
              <button
                onClick={() => {
                  deletePost(post.id)
                  toast(t('photo.deleted'))
                }}
                className="btn btn-primary px-3 py-1.5"
              >
                {t('common.delete')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => download(post)} className="btn btn-ghost flex-1">
                <Download className="size-4" /> {t('photo.download')}
              </button>
              <button onClick={() => setConfirming(true)} className="btn btn-ghost px-3.5" aria-label={t('photo.delete')}>
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
