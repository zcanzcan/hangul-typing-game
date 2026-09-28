import type { AgeGroup, TypingMode } from '../data/types'
import type { WordStage } from '../practice/word-stages'
import { AGE_PRESETS } from './profile'

const PROGRESS_KEY = 'hangul-game:progress:v1'

interface Progress {
  version: 1
  completedModes: TypingMode[]
  completedWordStages?: WordStage[]
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

function getCompletedWordStages(progress: Progress) {
  if (progress.completedWordStages) {
    return progress.completedWordStages
  }

  return progress.completedModes.includes('word')
    ? ([1, 2, 3] satisfies WordStage[])
    : []
}

export function completeWordStage(stage: WordStage) {
  const progress = loadProgress()
  const completedWordStages = getCompletedWordStages(progress)

  if (!completedWordStages.includes(stage)) {
    completedWordStages.push(stage)
  }

  progress.completedWordStages = completedWordStages

  if (stage === 3 && !progress.completedModes.includes('word')) {
    progress.completedModes.push('word')
  }

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

export function isWordStageUnlocked(stage: WordStage) {
  if (stage === 1) {
    return true
  }

  const completedWordStages = getCompletedWordStages(loadProgress())
  return completedWordStages.includes((stage - 1) as WordStage)
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
