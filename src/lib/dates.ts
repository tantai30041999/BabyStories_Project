import { locale, translate } from '../i18n'

const DAY = 86_400_000

export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const daysAgo = (n: number) => toDateInput(new Date(Date.now() - n * DAY))

/** Whole months between birthday and date; -1 when before birth. */
export function ageInMonths(birthday: string, on: string) {
  const b = parseDate(birthday)
  const d = parseDate(on)
  if (d < b) return -1
  let months = (d.getFullYear() - b.getFullYear()) * 12 + d.getMonth() - b.getMonth()
  if (d.getDate() < b.getDate()) months--
  return months
}

export function babyAge(birthday: string, on: string) {
  const days = Math.round((parseDate(on).getTime() - parseDate(birthday).getTime()) / DAY)
  if (days < 0) return translate('age.beforeBirth')
  if (days === 0) return translate('age.birthDay')
  if (days < 14) return translate('age.days', { n: days })
  if (days < 60) return translate('age.weeks', { n: Math.floor(days / 7) })
  const months = ageInMonths(birthday, on)
  if (months < 12) return translate('age.months', { n: months })
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? translate('age.yearsMonths', { y, m }) : translate('age.years', { y })
}

export const formatDate = (s: string) =>
  new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric', year: 'numeric' }).format(parseDate(s))
