import type { AgeGroup, FontSize, Profile } from '../data/types'

const PROFILE_KEY = 'hangul-game:profile:v1'
const PROFILES_KEY = 'hangul-game:profiles:v1'

interface StoredProfile {
  version: 1
  profile: Profile
}

interface StoredProfiles {
  version: 1
  activeProfileId: string
  profiles: Profile[]
}

export interface AgePreset {
  fontSize: FontSize
  timeLimit: boolean
  speech: boolean
  startMode: 'position' | 'word'
  minigameSpeed: 'slow' | 'normal' | 'fast'
}

export const AGE_PRESETS: Readonly<Record<AgeGroup, AgePreset>> = {
  kid: {
    fontSize: 'normal',
    timeLimit: true,
    speech: true,
    startMode: 'position',
    minigameSpeed: 'slow',
  },
  adult: {
    fontSize: 'normal',
    timeLimit: true,
    speech: false,
    startMode: 'word',
    minigameSpeed: 'normal',
  },
  senior: {
    fontSize: 'large',
    timeLimit: false,
    speech: true,
    startMode: 'position',
    minigameSpeed: 'slow',
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
      minigameSpeed: preset.minigameSpeed,
    },
    createdAt: new Date().toISOString(),
  }
}

export function loadProfile(): Profile | null {
  const registry = loadProfileRegistry()
  const activeProfile = registry?.profiles.find(
    ({ id }) => id === registry.activeProfileId,
  )

  if (activeProfile) {
    return activeProfile
  }

  const storedValue = localStorage.getItem(PROFILE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const storedProfile = JSON.parse(storedValue) as StoredProfile
    if (storedProfile.version !== 1) {
      return null
    }

    saveProfile(storedProfile.profile)
    return storedProfile.profile
  } catch {
    return null
  }
}

export function saveProfile(profile: Profile) {
  const registry = loadProfileRegistry()
  const profiles = registry?.profiles ?? []
  const existingIndex = profiles.findIndex(({ id }) => id === profile.id)
  const nextProfiles = [...profiles]

  if (existingIndex >= 0) {
    nextProfiles[existingIndex] = profile
  } else {
    nextProfiles.push(profile)
  }

  saveProfileRegistry({
    version: 1,
    activeProfileId: profile.id,
    profiles: nextProfiles,
  })

  const storedProfile: StoredProfile = { version: 1, profile }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(storedProfile))
}

export function addProfile(profile: Profile) {
  const registry = loadProfileRegistry()

  if (!registry) {
    saveProfile(profile)
    return
  }

  if (registry.profiles.some(({ id }) => id === profile.id)) {
    return
  }

  saveProfileRegistry({
    ...registry,
    profiles: [...registry.profiles, profile],
  })
}

export function getProfiles(): Profile[] {
  const registry = loadProfileRegistry()

  if (registry) {
    return registry.profiles
  }

  const activeProfile = loadProfile()
  return activeProfile ? [activeProfile] : []
}

export function activateProfile(profileId: string): Profile | null {
  const registry = loadProfileRegistry()
  const profile = registry?.profiles.find(({ id }) => id === profileId)

  if (!registry || !profile) {
    return null
  }

  saveProfileRegistry({ ...registry, activeProfileId: profile.id })
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ version: 1, profile } satisfies StoredProfile),
  )
  return profile
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(PROFILES_KEY)
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
      minigameSpeed: preset.minigameSpeed,
    },
  }
}

function loadProfileRegistry(): StoredProfiles | null {
  const storedValue = localStorage.getItem(PROFILES_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const registry = JSON.parse(storedValue) as StoredProfiles
    return registry.version === 1 && Array.isArray(registry.profiles)
      ? registry
      : null
  } catch {
    return null
  }
}

function saveProfileRegistry(registry: StoredProfiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(registry))
}
