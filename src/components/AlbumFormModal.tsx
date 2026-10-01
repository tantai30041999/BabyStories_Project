import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { X } from 'lucide-react'
import { useLibrary } from '../store/LibraryContext'
import { useTheme } from '../store/ThemeContext'
import { useUI } from '../store/UIContext'
import { ALBUM_EMOJIS } from '../lib/albums'
import { Modal } from './Modal'
import { ThemeSwatches } from './ThemeSwatches'
import { useI18n } from '../i18n'

export function AlbumFormModal({ id, onClose }: { id?: string; onClose: () => void }) {
  const { albums, posts, createAlbum, updateAlbum, deleteAlbum } = useLibrary()
  const { theme } = useTheme()
  const { toast } = useUI()
  const { t } = useI18n()
  const navigate = useNavigate()
  const existing = albums.find((a) => a.id === id)
  const [name, setName] = useState(existing?.name ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? ALBUM_EMOJIS[0])
  const [albumTheme, setAlbumTheme] = useState(existing?.theme ?? theme)
  const [confirming, setConfirming] = useState(false)
  const count = posts.filter((p) => p.albumId === id).length

  const save = (e: FormEvent) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    if (existing) {
      updateAlbum(existing.id, { name: clean, emoji, theme: albumTheme })
      toast(t('albumForm.updated'))
    } else {
      const a = createAlbum({ name: clean, emoji, theme: albumTheme })
      toast(t('albumForm.created', { name: clean }))
      navigate(`/albums/${a.id}`)
    }
    onClose()
  }

  return (
    <Modal onClose={onClose} label={existing ? t('albumForm.edit') : t('albumForm.new')} className="max-w-md">
      <form onSubmit={save} data-theme={albumTheme} className="bg-surface text-ink">
        <header className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-2xl font-semibold">{existing ? t('albumForm.edit') : t('albumForm.new')} {emoji}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 touch:p-2.5 hover:bg-surface-2" aria-label={t('common.close')}>
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-5 p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold">{t('albumForm.name')}</span>
            <input
              className="input"
              value={name}
              maxLength={40}
              placeholder={t('albumForm.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-extrabold">{t('albumForm.icon')}</p>
            <div className="grid grid-cols-8 gap-1.5">
              {ALBUM_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`grid aspect-square place-items-center rounded-xl text-xl transition hover:bg-surface-2 ${
                    emoji === em ? 'bg-surface-2 ring-2 ring-primary' : ''
                  }`}
                  aria-label={em}
                  aria-pressed={emoji === em}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-extrabold">{t('albumForm.theme')}</p>
            <ThemeSwatches value={albumTheme} onChange={setAlbumTheme} size={36} />
          </div>

          {existing &&
            (confirming ? (
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-3 text-sm">
                <span className="flex-1 font-bold">
                  {t('albumForm.confirmDelete', { n: count })}
                </span>
                <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost bg-surface px-3 py-1.5">
                  {t('common.keep')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAlbum(existing.id)
                    toast(t('albumForm.deleted'))
                    onClose()
                    navigate('/albums')
                  }}
                  className="btn btn-primary px-3 py-1.5"
                >
                  {t('common.delete')}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-sm font-bold text-primary">
                {t('albumForm.deleteLink')}
              </button>
            ))}
        </div>

        <div className="flex gap-3 border-t border-line p-4">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            {t('common.cancel')}
          </button>
          <button disabled={!name.trim()} className="btn btn-primary flex-1">
            {existing ? t('common.save') : t('albumForm.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
