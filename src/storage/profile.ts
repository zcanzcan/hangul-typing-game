import type { AgeGroup, FontSize, Profile } from '../data/types'

const PROFILE_KEY = 'hangul-game:profile:v1'

interface StoredProfile {
  version: 1
  profile: Profile
}

export interface AgePreset {
  fontSize: FontSize
  timeLimit: boolean
  speech: boolean
  startMode: 'position' | 'word'
}

export const AGE_PRESETS: Readonly<Record<AgeGroup, AgePreset>> = {
  kid: {
    fontSize: 'normal',
    timeLimit: true,
    speech: true,
    startMode: 'position',
  },
  adult: {
    fontSize: 'normal',
    timeLimit: true,
    speech: false,
    startMode: 'word',
  },
  senior: {
    fontSize: 'large',
    timeLimit: false,
    speech: true,
    startMode: 'position',
  },
}

export function createProfile(nickname: string, ageGroup: AgeGroup): Profile {
  const preset = AGE_PRESETS[ageGroup]

  return {
    id: crypto.randomUUID(),
    nickname: nickname.trim(),
    ageGroup,
    settings: {
      fontSize: preset.fontSize,
      timeLimit: preset.timeLimit,
      speech: preset.speech,
      sfx: true,
      slangMode: false,
      keyboard: 'device',
    },
    createdAt: new Date().toISOString(),
  }
}

export function loadProfile(): Profile | null {
  const storedValue = localStorage.getItem(PROFILE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const storedProfile = JSON.parse(storedValue) as StoredProfile
    return storedProfile.version === 1 ? storedProfile.profile : null
  } catch {
    return null
  }
}

export function saveProfile(profile: Profile) {
  const storedProfile: StoredProfile = { version: 1, profile }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(storedProfile))
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

export function applyAgePreset(profile: Profile, ageGroup: AgeGroup): Profile {
  const preset = AGE_PRESETS[ageGroup]

  return {
    ...profile,
    ageGroup,
    settings: {
      ...profile.settings,
      fontSize: preset.fontSize,
      timeLimit: preset.timeLimit,
      speech: preset.speech,
    },
  }
}
