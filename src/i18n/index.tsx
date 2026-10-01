import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readJSON, writeJSON } from '../lib/storage'
import { en, vi, type MessageKey } from './messages'

export type Lang = 'en' | 'vi'
/** A piece of text that exists in both languages (theme names, album presets…). */
export type Localized = Record<Lang, string>

export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'vi', label: 'VI', name: 'Tiếng Việt' },
]

const KEY = 'bs:lang'
const DICTS = { en, vi }

function initialLang(): Lang {
  const saved = readJSON<Lang | null>(KEY, null)
  if (saved === 'en' || saved === 'vi') return saved
  return navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

// Module-level copy so plain functions (dates, canvas renderers) can translate too.
let current: Lang = initialLang()
document.documentElement.lang = current

export const getLang = () => current
export const locale = () => (current === 'vi' ? 'vi-VN' : 'en')

export function translate(key: MessageKey, vars: Record<string, string | number> = {}) {
  const msg = DICTS[current][key] ?? en[key]
  return typeof msg === 'function' ? msg(vars) : msg
}

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: typeof translate
  /** pick the current language from a Localized value */
  tr: (l: Localized) => string
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current)

  useEffect(() => {
    current = lang
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    current = l
    writeJSON(KEY, l)
    setLangState(l)
  }, [])

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      // new function identity per language so memoized consumers recompute
      t: (key, vars) => translate(key, vars),
      tr: (l) => l[lang],
    }),
    [lang, setLang],
  )

  return <Ctx value={value}>{children}</Ctx>
}

export function useI18n() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
