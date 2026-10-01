import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { THEMES, defaultMonthTheme } from '../lib/themes'
import { ageInMonths, toDateInput } from '../lib/dates'
import { readJSON, writeJSON } from '../lib/storage'
import { useProfile } from './ProfileContext'

const THEME_KEY = 'bs:theme'
const FOLLOW_KEY = 'bs:followMonth'
const MONTHS_KEY = 'bs:monthThemes'

interface ThemeCtx {
  /** the theme the whole site is using right now */
  theme: string
  /** true → site theme = theme of baby's current month */
  followMonth: boolean
  setFollowMonth: (v: boolean) => void
  /** pick the site theme (in follow mode this re-themes the current month) */
  setTheme: (id: string) => void
  currentMonth: number
  monthTheme: (month: number) => string
  setMonthTheme: (month: number, id: string) => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const [fixed, setFixed] = useState(() => {
    const saved = readJSON<string | null>(THEME_KEY, null)
    if (saved && THEMES.some((t) => t.id === saved)) return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'thunder' : 'hero'
  })
  const [followMonth, setFollow] = useState(() => readJSON(FOLLOW_KEY, false))
  const [monthThemes, setMonthThemes] = useState<Record<string, string>>(() => readJSON(MONTHS_KEY, {}))

  const currentMonth = ageInMonths(profile.birthday, toDateInput(new Date()))
  const monthTheme = useCallback((m: number) => monthThemes[m] ?? defaultMonthTheme(m), [monthThemes])
  const theme = followMonth ? monthTheme(currentMonth) : fixed

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // tint the phone browser's address / status bar to match
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  }, [theme])

  const setMonthTheme = useCallback((m: number, id: string) => {
    setMonthThemes((all) => {
      const next = { ...all, [m]: id }
      writeJSON(MONTHS_KEY, next)
      return next
    })
  }, [])

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      followMonth,
      currentMonth,
      monthTheme,
      setMonthTheme,
      setFollowMonth: (v) => {
        setFollow(v)
        writeJSON(FOLLOW_KEY, v)
      },
      setTheme: (id) => {
        if (followMonth) return setMonthTheme(currentMonth, id)
        setFixed(id)
        writeJSON(THEME_KEY, id)
      },
    }),
    [theme, followMonth, currentMonth, monthTheme, setMonthTheme],
  )

  return <Ctx value={value}>{children}</Ctx>
}

export function useTheme() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
