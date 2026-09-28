const DAILY_GOAL_KEY = 'hangul-game:daily-goals:v1'
export const DAILY_GOAL_SECONDS = 10 * 60

interface DailyGoalStore {
  version: 1
  profiles: Record<string, Record<string, number>>
}

function loadStore(): DailyGoalStore {
  const value = localStorage.getItem(DAILY_GOAL_KEY)
  if (!value) {
    return { version: 1, profiles: {} }
  }

  try {
    const parsed = JSON.parse(value) as DailyGoalStore
    return parsed.version === 1 && parsed.profiles
      ? parsed
      : { version: 1, profiles: {} }
  } catch {
    return { version: 1, profiles: {} }
  }
}

export function toDateKey(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function recordPracticeTime(
  profileId: string,
  durationSec: number,
  playedAt: string,
) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return
  }

  const store = loadStore()
  const dateKey = toDateKey(playedAt)
  const profileGoals = store.profiles[profileId] ?? {}
  profileGoals[dateKey] = (profileGoals[dateKey] ?? 0) + durationSec
  store.profiles[profileId] = profileGoals
  localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(store))
}

export function getPracticeTime(profileId: string, dateKey = toDateKey()) {
  return loadStore().profiles[profileId]?.[dateKey] ?? 0
}

export function getPracticeCalendar(profileId: string, month: string) {
  const profileGoals = loadStore().profiles[profileId] ?? {}
  return Object.entries(profileGoals)
    .filter(([dateKey]) => dateKey.startsWith(`${month}-`))
    .map(([dateKey, seconds]) => ({
      dateKey,
      seconds,
      completed: seconds >= DAILY_GOAL_SECONDS,
    }))
}
