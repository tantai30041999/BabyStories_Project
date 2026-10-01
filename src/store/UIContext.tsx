import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PhotoViewer } from '../components/PhotoViewer'
import { StoryViewer } from '../components/StoryViewer'
import { ThemeModal } from '../components/ThemeModal'
import { EditProfileModal } from '../components/EditProfileModal'
import { AlbumFormModal } from '../components/AlbumFormModal'

type ModalState =
  | { type: 'photo'; ids: string[]; index: number }
  | { type: 'story'; ids: string[]; title: string; theme: string }
  | { type: 'theme' }
  | { type: 'profile' }
  | { type: 'album'; id?: string }
  | null

interface UICtx {
  openPhoto: (ids: string[], index: number) => void
  openStory: (ids: string[], title: string, theme: string) => void
  openTheme: () => void
  openProfile: () => void
  openAlbumForm: (id?: string) => void
  close: () => void
  toast: (msg: string) => void
}

const Ctx = createContext<UICtx | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null)
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string } | null>(null)
  const toastTimer = useRef<number>(undefined)

  const close = useCallback(() => setModal(null), [])

  const toast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current)
    setToastMsg({ id: Date.now(), text })
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const value = useMemo<UICtx>(
    () => ({
      openPhoto: (ids, index) => setModal({ type: 'photo', ids, index }),
      openStory: (ids, title, theme) => setModal({ type: 'story', ids, title, theme }),
      openTheme: () => setModal({ type: 'theme' }),
      openProfile: () => setModal({ type: 'profile' }),
      openAlbumForm: (id) => setModal({ type: 'album', id }),
      close,
      toast,
    }),
    [close, toast],
  )

  return (
    <Ctx value={value}>
      {children}
      <AnimatePresence>
        {modal?.type === 'photo' && <PhotoViewer key="photo" ids={modal.ids} index={modal.index} onClose={close} />}
        {modal?.type === 'story' && (
          <StoryViewer key="story" ids={modal.ids} title={modal.title} theme={modal.theme} onClose={close} />
        )}
        {modal?.type === 'theme' && <ThemeModal key="theme" onClose={close} />}
        {modal?.type === 'profile' && <EditProfileModal key="profile" onClose={close} />}
        {modal?.type === 'album' && <AlbumFormModal key="album" id={modal.id} onClose={close} />}
      </AnimatePresence>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 short:bottom-4 md:bottom-8">
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              key={toastMsg.id}
              initial={{ y: 24, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.95 }}
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-bg shadow-pop"
              role="status"
            >
              {toastMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx>
  )
}

export function useUI() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}
