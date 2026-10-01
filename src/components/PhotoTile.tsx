import type { Post } from '../types'

interface Props {
  post: Post
  onClick: () => void
  badge?: string
  label?: string
  className?: string
}

export function PhotoTile({ post, onClick, badge, label, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`group relative block aspect-square overflow-hidden rounded-2xl bg-surface-2 shadow-soft ${className}`}
      aria-label={post.caption || label || 'Open photo'}
    >
      <img
        src={post.src}
        alt=""
        className="size-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
        draggable={false}
      />
      {badge && (
        <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-white/85 text-sm backdrop-blur">
          {badge}
        </span>
      )}
      {label && (
        <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/85 px-2.5 py-1 text-left text-[11px] font-extrabold text-[#3b2433] opacity-0 backdrop-blur transition group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  )
}
