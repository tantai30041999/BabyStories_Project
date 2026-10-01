import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export function EmptyState({ emoji, title, text, action }: { emoji: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <motion.span
        className="text-6xl"
        animate={{ rotate: [0, -10, 10, 0], y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.span>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
