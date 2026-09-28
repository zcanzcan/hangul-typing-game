import type { AgeGroup, TypingMode } from '../data/types'
import { AGE_PRESETS } from './profile'

const PROGRESS_KEY = 'hangul-game:progress:v1'

interface Progress {
  version: 1
  completedModes: TypingMode[]
}

function loadProgress(): Progress {
  const storedValue = localStorage.getItem(PROGRESS_KEY)

  if (!storedValue) {
    return { version: 1, completedModes: [] }
  }

  try {
    const progress = JSON.parse(storedValue) as Progress
    return progress.version === 1
      ? progress
      : { version: 1, completedModes: [] }
  } catch {
    return { version: 1, completedModes: [] }
  }
}

export function completeMode(mode: TypingMode) {
  const progress = loadProgress()

  if (!progress.completedModes.includes(mode)) {
    progress.completedModes.push(mode)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  }
}

export function isModeUnlocked(mode: TypingMode, ageGroup: AgeGroup) {
  const progress = loadProgress()
  const preset = AGE_PRESETS[ageGroup]

  if (mode === 'position') {
    return true
  }

  if (mode === 'word') {
    return (
      preset.startMode === 'word' ||
      progress.completedModes.includes('position')
    )
  }

  return progress.completedModes.includes('word')
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY)
}
