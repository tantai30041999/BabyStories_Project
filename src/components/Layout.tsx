import { NavLink, Outlet } from 'react-router'
import { Clapperboard, Images, Palette, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { useUI } from '../store/UIContext'
import { useProfile } from '../store/ProfileContext'
import { babyAge, toDateInput } from '../lib/dates'
import { Avatar } from './Avatar'
import { Logo, LogoMark } from './Logo'
import { LanguageSwitch } from './LanguageSwitch'
import { useI18n } from '../i18n'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `group flex shrink-0 items-center gap-4 rounded-2xl px-3 py-3 font-bold transition hover:bg-surface-2 short:py-2 ${
    isActive ? 'bg-surface-2 text-primary' : ''
  }`

function Label({ children }: { children: ReactNode }) {
  return <span className="hidden lg:inline short:lg:hidden">{children}</span>
}

function Sidebar() {
  const { openTheme, openProfile } = useUI()
  const { profile } = useProfile()
  const { t } = useI18n()
  const icon = 'size-6 shrink-0 transition group-hover:scale-110'

  return (
    <aside className="no-scrollbar fixed inset-y-0 left-0 z-30 hidden w-[calc(5rem+env(safe-area-inset-left))] flex-col overflow-y-auto border-r border-line bg-surface/70 py-6 pr-3 pl-[calc(0.75rem+env(safe-area-inset-left))] backdrop-blur-xl short:flex short:py-3 md:flex lg:w-[calc(16rem+env(safe-area-inset-left))] lg:pr-4 lg:pl-[calc(1rem+env(safe-area-inset-left))] short:lg:w-[calc(5rem+env(safe-area-inset-left))]">
      <NavLink to="/" className="mb-8 shrink-0 px-1.5 short:mb-3">
        <span className="hidden lg:block short:lg:hidden">
          <Logo />
        </span>
        <span className="lg:hidden short:lg:block">
          <LogoMark size={40} />
        </span>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1.5 short:gap-0.5">
        <NavLink to="/" end className={navClass}>
          <Upload className={icon} />
          <Label>{t('nav.upload')}</Label>
        </NavLink>
        <NavLink to="/albums" className={navClass}>
          <Images className={icon} />
          <Label>{t('nav.albums')}</Label>
        </NavLink>
        <NavLink to="/studio" className={navClass}>
          <Clapperboard className={icon} />
          <Label>{t('nav.studio')}</Label>
        </NavLink>
        <button onClick={openTheme} className={navClass({ isActive: false })}>
          <Palette className={icon} />
          <Label>{t('nav.themes')}</Label>
        </button>
      </nav>

      <div className="mb-3 hidden shrink-0 lg:block short:lg:hidden">
        <LanguageSwitch />
      </div>
      <div className="mb-3 flex shrink-0 justify-center short:mb-2 lg:hidden short:lg:flex">
        <LanguageSwitch compact />
      </div>

      <button
        onClick={openProfile}
        className="flex shrink-0 items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-surface-2 short:p-1"
        aria-label={t('nav.editProfile')}
      >
        <Avatar size={44} ring />
        <span className="hidden min-w-0 lg:block short:lg:hidden">
          <span className="block truncate font-extrabold">{profile.name}</span>
          <span className="block truncate text-xs text-muted">{babyAge(profile.birthday, toDateInput(new Date()))}</span>
        </span>
      </button>
    </aside>
  )
}

function MobileTopBar() {
  const { openProfile } = useUI()
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/80 px-[max(1rem,env(safe-area-inset-left))] pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur-xl short:hidden md:hidden">
      <NavLink to="/">
        <Logo />
      </NavLink>
      <div className="flex items-center gap-2">
        <LanguageSwitch compact />
        <button onClick={openProfile} aria-label={t('nav.editProfile')}>
          <Avatar size={34} ring />
        </button>
      </div>
    </header>
  )
}

function MobileBottomNav() {
  const { openTheme } = useUI()
  const { t } = useI18n()
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex w-14 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-extrabold transition ${isActive ? 'text-primary' : 'text-ink'}`

  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center justify-around rounded-[1.75rem] border border-line bg-surface/85 px-2 py-1.5 shadow-pop backdrop-blur-xl short:hidden md:hidden">
      <NavLink to="/albums" className={tab}>
        <Images className="size-6" /> {t('nav.albums')}
      </NavLink>
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `grid size-14 -translate-y-4 place-items-center rounded-2xl bg-primary text-primary-ink shadow-pop transition active:scale-90 ${
            isActive ? 'ring-4 ring-surface' : ''
          }`
        }
        aria-label={t('nav.upload')}
      >
        <Upload className="size-7" />
      </NavLink>
      <NavLink to="/studio" className={tab}>
        <Clapperboard className="size-6" /> {t('nav.studioShort')}
      </NavLink>
      <button onClick={openTheme} className={tab({ isActive: false })}>
        <Palette className="size-6" /> {t('nav.themeShort')}
      </button>
    </nav>
  )
}

function BackgroundBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="theme-pattern absolute inset-0" />
      <div className="absolute -top-32 -right-24 size-[28rem] animate-float rounded-full bg-[var(--blob-1)] opacity-70 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 size-[30rem] animate-float rounded-full bg-[var(--blob-2)] opacity-70 blur-3xl [animation-delay:-7s]" />
    </div>
  )
}

export function Layout() {
  return (
    <div className="relative isolate min-h-dvh">
      <BackgroundBlobs />
      <Sidebar />
      <MobileTopBar />
      <main className="overflow-x-clip pr-[env(safe-area-inset-right)] pb-[calc(7rem+env(safe-area-inset-bottom))] short:pb-6 short:pl-[calc(5rem+env(safe-area-inset-left))] md:pb-10 md:pl-[calc(5rem+env(safe-area-inset-left))] lg:pl-[calc(16rem+env(safe-area-inset-left))] short:lg:pl-[calc(5rem+env(safe-area-inset-left))]">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  )
}
