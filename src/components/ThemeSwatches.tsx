import { THEMES } from '../lib/themes'
import { useI18n } from '../i18n'

interface Props {
  value: string
  onChange: (id: string) => void
  size?: number
}

/** A row of round theme buttons: gradient of the theme's colors + its emoji. */
export function ThemeSwatches({ value, onChange, size = 40 }: Props) {
  const { t, tr } = useI18n()
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('common.theme')}>
      {THEMES.map((th) => (
        <button
          key={th.id}
          type="button"
          role="radio"
          aria-checked={value === th.id}
          aria-label={tr(th.name)}
          title={tr(th.name)}
          onClick={() => onChange(th.id)}
          className={`grid shrink-0 place-items-center rounded-full transition hover:scale-110 ${
            value === th.id ? 'ring-3 ring-primary ring-offset-2 ring-offset-surface' : ''
          }`}
          style={{
            width: size,
            height: size,
            fontSize: size * 0.45,
            background: `linear-gradient(135deg, ${th.swatches[0]}, ${th.swatches[1]})`,
          }}
        >
          {th.emoji}
        </button>
      ))}
    </div>
  )
}
