export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="20" fill="var(--primary)" />
      <circle cx="52" cy="12" r="14" fill="var(--accent)" opacity=".55" />
      <path d="M18 43a9 9 0 0 1 2-17.8A12 12 0 0 1 43 24a9.5 9.5 0 0 1 3 19Z" fill="#fff" />
      <circle cx="27" cy="34" r="2.3" fill="#3b2433" />
      <circle cx="37" cy="34" r="2.3" fill="#3b2433" />
      <path d="M28.5 38.5q3.5 3 7 0" stroke="#3b2433" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="23.5" cy="38" r="2.2" fill="var(--primary)" opacity=".5" />
      <circle cx="40.5" cy="38" r="2.2" fill="var(--primary)" opacity=".5" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.45rem] leading-none font-semibold tracking-tight">
          Baby<span className="text-primary">Stories</span>
        </span>
      )}
    </span>
  )
}
