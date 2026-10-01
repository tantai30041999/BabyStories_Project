import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { BabyProfile } from '../types'
import { daysAgo } from '../lib/dates'
import { DEFAULT_BIRTHDAY_DAYS_AGO } from '../lib/seed'
import { readJSON, writeJSON } from '../lib/storage'

const KEY = 'bs:profile'

const DEFAULT_PROFILE: BabyProfile = {
  name: 'Baby Bean',
  parentName: 'Mommy',
  birthday: daysAgo(DEFAULT_BIRTHDAY_DAYS_AGO),
  bio: 'Tiny human, big dreams 🌙 Collecting giggles, milk moustaches & first-evers.',
}

interface ProfileCtx {
  profile: BabyProfile
  updateProfile: (p: BabyProfile) => void
}

const Ctx = createContext<ProfileCtx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BabyProfile>(() => ({ ...DEFAULT_PROFILE, ...readJSON(KEY, {}) }))

  const updateProfile = useCallback((p: BabyProfile) => {
    setProfile(p)
    writeJSON(KEY, p)
  }, [])

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile])
  return <Ctx value={value}>{children}</Ctx>
}

export function useProfile() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
