import type { ClassSession } from './model'

const SESSION_KEY = 'hangul-typing-game.class-scoreboard'
const SESSION_VERSION = 1

interface StoredClassSession extends ClassSession {
  version: typeof SESSION_VERSION
}

export function loadClassSession(): ClassSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY)
    if (!value) {
      return null
    }

    const parsed = JSON.parse(value) as Partial<StoredClassSession>
    if (
      parsed.version !== SESSION_VERSION ||
      typeof parsed.classCode !== 'string' ||
      !parsed.entries
    ) {
      return null
    }

    return { classCode: parsed.classCode, entries: parsed.entries }
  } catch {
    return null
  }
}

export function saveClassSession(session: ClassSession) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ version: SESSION_VERSION, ...session }),
  )
}

export function clearClassSession() {
  localStorage.removeItem(SESSION_KEY)
}
