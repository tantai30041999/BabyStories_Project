import { Languages } from 'lucide-react'
import { LANGS, useI18n } from '../i18n'

/** EN ⇄ VI. `compact` = one round button that flips the language (phones, narrow sidebar). */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n()

  if (compact) {
    const next = LANGS.find((l) => l.id !== lang)!
    return (
      <button
        onClick={() => setLang(next.id)}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full touch:h-10 border border-line bg-surface px-3 text-xs font-extrabold transition hover:bg-surface-2"
        aria-label={`${t('lang.switch')}: ${next.name}`}
        title={next.name}
      >
        <Languages className="size-4" />
        {LANGS.find((l) => l.id === lang)!.label}
      </button>
    )
  }

  return (
    <div role="group" aria-label={t('lang.switch')} className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
      <Languages className="mx-1.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          lang={l.id}
          className={`flex-1 rounded-full px-2 py-1.5 text-xs touch:py-2.5 font-extrabold whitespace-nowrap transition ${
            lang === l.id ? 'bg-primary text-primary-ink shadow-soft' : 'text-muted hover:text-ink'
          }`}
        >
          {l.name}
        </button>
      ))}
    </div>
  )
}
