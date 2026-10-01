import { useState, type FormEvent } from 'react'
import { Camera, X } from 'lucide-react'
import { useProfile } from '../store/ProfileContext'
import { useUI } from '../store/UIContext'
import { makeAvatar } from '../lib/image'
import { toDateInput } from '../lib/dates'
import { Modal } from './Modal'
import { useI18n } from '../i18n'

export function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useProfile()
  const { toast } = useUI()
  const { t } = useI18n()
  const [draft, setDraft] = useState(profile)

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const onAvatar = async (file?: File) => {
    if (!file) return
    try {
      set('avatar', await makeAvatar(file))
    } catch {
      toast(t('profile.badPhoto'))
    }
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    updateProfile({ ...draft, name: draft.name.trim() || t('profile.defaultBaby'), parentName: draft.parentName.trim() || t('profile.defaultParent') })
    toast(t('profile.updated'))
    onClose()
  }

  return (
    <Modal onClose={onClose} label={t('profile.label')} className="max-w-md">
      <form onSubmit={save}>
        <header className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-2xl font-semibold">{t('profile.title')}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 touch:p-2.5 hover:bg-surface-2" aria-label={t('common.close')}>
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <label className="group relative size-24 shrink-0 cursor-pointer overflow-hidden rounded-full story-ring p-[3px]">
              <span className="block size-full overflow-hidden rounded-full bg-surface-2">
                {draft.avatar ? (
                  <img src={draft.avatar} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-4xl">👶</span>
                )}
              </span>
              <span className="absolute inset-[3px] grid place-items-center rounded-full bg-black/35 text-white opacity-0 transition group-hover:opacity-100">
                <Camera className="size-6" />
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onAvatar(e.target.files?.[0])} />
            </label>
            <div className="space-y-1.5 text-sm">
              <p className="font-bold">{t('profile.photo')}</p>
              <p className="text-muted">{t('profile.photoHint')}</p>
              {draft.avatar && (
                <button type="button" onClick={() => set('avatar', undefined)} className="font-bold text-primary">
                  {t('profile.removePhoto')}
                </button>
              )}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold">{t('profile.name')}</span>
            <input className="input" value={draft.name} maxLength={40} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold">{t('profile.birthday')}</span>
            <input
              type="date"
              className="input"
              value={draft.birthday}
              max={toDateInput(new Date())}
              onChange={(e) => e.target.value && set('birthday', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold">{t('profile.parent')}</span>
            <input
              className="input"
              value={draft.parentName}
              maxLength={30}
              placeholder={t('profile.parentPlaceholder')}
              onChange={(e) => set('parentName', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold">{t('profile.bio')}</span>
            <textarea
              className="input resize-none"
              rows={3}
              maxLength={150}
              value={draft.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </label>
        </div>

        <div className="flex gap-3 border-t border-line p-4">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary flex-1">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
