import { useProfile } from '../store/ProfileContext'

interface Props {
  size?: number
  ring?: boolean
  className?: string
}

export function Avatar({ size = 40, ring = false, className = '' }: Props) {
  const { profile } = useProfile()

  const inner = profile.avatar ? (
    <img src={profile.avatar} alt={profile.name} className="size-full rounded-full object-cover" draggable={false} />
  ) : (
    <div
      className="grid size-full place-items-center rounded-full bg-linear-to-br from-surface-2 to-line"
      style={{ fontSize: size * 0.48 }}
      aria-label={profile.name}
    >
      👶
    </div>
  )

  return (
    <div
      className={`shrink-0 rounded-full ${ring ? 'story-ring p-[2.5px]' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {ring ? <div className="size-full rounded-full bg-surface p-[2px]">{inner}</div> : inner}
    </div>
  )
}
