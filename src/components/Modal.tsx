import { useEffect, type ReactNode } from 'react'
import { motion } from 'motion/react'

interface Props {
  onClose: () => void
  children: ReactNode
  label: string
  className?: string
}

/** Bottom sheet on phones, centered bubbly card on larger screens. */
export function Modal({ onClose, children, label, className = '' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2a1830]/45 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 48, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 32, scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[2rem] bg-surface pb-[env(safe-area-inset-bottom)] text-ink shadow-pop sm:rounded-[2rem] sm:pb-0 ${className}`}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
