import { motion } from 'motion/react'
import { Check, X } from 'lucide-react'
import { THEME_GROUPS, THEMES } from '../lib/themes'
import { monthEmoji, monthLabel } from '../lib/months'
import { useTheme } from '../store/ThemeContext'
import { useProfile } from '../store/ProfileContext'
import { Modal } from './Modal'
import { useI18n } from '../i18n'

export function ThemeModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme, followMonth, setFollowMonth, currentMonth } = useTheme()
  const { profile } = useProfile()
  const { t, tr } = useI18n()

  return (
    <Modal onClose={onClose} label={t('theme.label')} className="max-w-3xl">
      <header className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t('theme.title')}</h2>
          <p className="mt-1 text-sm text-muted">{t('theme.intro')}</p>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 touch:p-2.5 hover:bg-surface-2" aria-label={t('common.close')}>
          <X className="size-5" />
        </button>
      </header>

      <label className="mx-6 mt-5 flex cursor-pointer items-center gap-4 rounded-3xl bg-surface-2 p-4">
        <span className="text-3xl">{monthEmoji(currentMonth)}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">{t('theme.follow', { name: profile.name })}</span>
          <span className="block text-xs text-muted">
            {t('theme.followHint', { name: profile.name, month: monthLabel(currentMonth).toLowerCase() })}
            {followMonth ? t('theme.followOn') : '.'}
          </span>
        </span>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={followMonth}
          onChange={(e) => setFollowMonth(e.target.checked)}
        />
        <span className="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-primary after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
      </label>

      <div className="space-y-6 p-6">
        {THEME_GROUPS.map((g) => (
          <section key={g.id}>
            <h3 className="mb-2.5 text-sm font-extrabold tracking-wide text-muted uppercase">{t(g.label)}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEMES.filter((th) => th.group === g.id).map((th, i) => {
                const [primary, accent, soft] = th.swatches
                const active = theme === th.id
                return (
                  <motion.button
                    key={th.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setTheme(th.id)}
                    data-theme={th.id}
                    className={`relative overflow-hidden rounded-3xl bg-surface p-2.5 text-left text-ink transition ${
                      active ? 'shadow-pop ring-3 ring-primary' : 'shadow-soft'
                    }`}
                    style={{ border: 'var(--card-border)' }}
                    aria-pressed={active}
                  >
                    <div className="relative h-16 overflow-hidden rounded-2xl" style={{ background: soft }}>
                      <div className="theme-pattern absolute inset-0" />
                      <span className="absolute -top-4 -left-3 size-14 rounded-full" style={{ background: primary }} />
                      <span className="absolute -right-2 -bottom-5 size-12 rounded-full" style={{ background: accent }} />
                      <span className="absolute inset-0 grid place-items-center text-2xl">{th.emoji}</span>
                    </div>
                    <p className="mt-2 font-display text-[15px] leading-tight">{tr(th.name)}</p>
                    <p className="text-xs text-muted">{tr(th.tagline)}</p>
                    {active && (
                      <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-primary text-primary-ink">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  )
}
