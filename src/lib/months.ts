import type { Post } from '../types'
import { ageInMonths } from './dates'
import { translate } from '../i18n'

export const byTakenAsc = (a: Post, b: Post) => a.takenAt.localeCompare(b.takenAt) || a.createdAt - b.createdAt

export function monthLabel(m: number) {
  if (m < 0) return translate('month.bump')
  if (m === 0) return translate('month.first')
  if (m < 12) return translate('age.months', { n: m })
  const y = Math.floor(m / 12)
  return m % 12 ? translate('age.yearsMonths', { y, m: m % 12 }) : translate('age.years', { y })
}

const MONTH_EMOJI = ['🐣', '🍼', '😊', '🧸', '🌼', '🥄', '🐢', '🎈', '🌈', '🦆', '🐻', '🌟']
export const monthEmoji = (m: number) => (m < 0 ? '🤰' : m > 0 && m % 12 === 0 ? '🎂' : MONTH_EMOJI[m % 12])

export interface MonthGroup {
  month: number
  /** oldest → newest */
  posts: Post[]
}

/** Photos bucketed by baby's age in months, newest month first. */
export function groupByMonth(posts: Post[], birthday: string): MonthGroup[] {
  const map = new Map<number, Post[]>()
  for (const p of posts) {
    const m = ageInMonths(birthday, p.takenAt)
    map.set(m, [...(map.get(m) ?? []), p])
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([month, items]) => ({ month, posts: items.sort(byTakenAsc) }))
}
