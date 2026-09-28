import type { AgeGroup, MinigamePack, Slang, Word } from '../../data/types'

export interface WordRainPreset {
  fallDurationSec: number
  maxVisibleWords: number
  minLength: number
  maxLength: number
}

export interface WordRainItem {
  id: string
  text: string
  kind: 'standard' | 'slang'
  meaning?: string
  standardForm?: string
}

export interface FallingWord extends WordRainItem {
  dropId: string
  progress: number
  lane: number
}

export interface WordRainPool {
  pack: MinigamePack
  standard: WordRainItem[]
  slang: WordRainItem[]
  slangFallback: boolean
}

export interface SubmissionResult {
  fallingWords: FallingWord[]
  matched: FallingWord | null
  earnedScore: number
  nextCombo: number
}

const PRESETS: Readonly<Record<AgeGroup, WordRainPreset>> = {
  kid: {
    fallDurationSec: 12,
    maxVisibleWords: 4,
    minLength: 1,
    maxLength: 3,
  },
  adult: {
    fallDurationSec: 8,
    maxVisibleWords: 6,
    minLength: 2,
    maxLength: 5,
  },
  senior: {
    fallDurationSec: 16,
    maxVisibleWords: 3,
    minLength: 1,
    maxLength: 3,
  },
}

export function getWordRainPreset(ageGroup: AgeGroup) {
  return PRESETS[ageGroup]
}

export function getAvailablePacks(slangMode: boolean): MinigamePack[] {
  return slangMode ? ['standard', 'slang', 'mixed'] : ['standard']
}

export function getSpeedMultiplier(elapsedSec: number) {
  const increases = Math.floor(Math.max(0, elapsedSec) / 30)
  return Math.min(2.5, 1.1 ** increases)
}

export function getWordScore(text: string) {
  return Array.from(text).length * 10
}

function isAllowedLength(text: string, preset: WordRainPreset) {
  const length = Array.from(text).length
  return (
    !/\s/u.test(text) &&
    length >= preset.minLength &&
    length <= preset.maxLength
  )
}

export function getEligibleStandardWords(words: Word[], ageGroup: AgeGroup) {
  const preset = getWordRainPreset(ageGroup)
  return words
    .filter(
      ({ text, audience }) =>
        audience.includes(ageGroup) && isAllowedLength(text, preset),
    )
    .map<WordRainItem>(({ id, text, meaning }) => ({
      id,
      text,
      kind: 'standard',
      meaning,
    }))
}

export function getEligibleSlang(slang: Slang[], ageGroup: AgeGroup) {
  const preset = getWordRainPreset(ageGroup)
  return slang
    .filter(
      ({ text, status, kidSafe }) =>
        status === 'active' &&
        (ageGroup !== 'kid' || kidSafe) &&
        isAllowedLength(text, preset),
    )
    .map<WordRainItem>(({ id, text, meaning, standardForm }) => ({
      id,
      text,
      kind: 'slang',
      meaning,
      standardForm,
    }))
}

export function createWordRainPool({
  pack,
  ageGroup,
  words,
  slang,
}: {
  pack: MinigamePack
  ageGroup: AgeGroup
  words: Word[]
  slang: Slang[]
}): WordRainPool {
  const standard = getEligibleStandardWords(words, ageGroup)
  const eligibleSlang = getEligibleSlang(slang, ageGroup)
  const slangFallback = pack !== 'standard' && eligibleSlang.length < 5
  const fallbackCount = Math.max(0, 5 - eligibleSlang.length)

  return {
    pack,
    standard,
    slang:
      pack === 'slang' && slangFallback
        ? [...eligibleSlang, ...standard.slice(0, fallbackCount)]
        : eligibleSlang,
    slangFallback,
  }
}

function pickFrom(items: WordRainItem[], random: () => number) {
  if (items.length === 0) {
    return null
  }

  return items[Math.floor(random() * items.length) % items.length]
}

export function pickWordRainItem(pool: WordRainPool, random = Math.random) {
  if (pool.pack === 'standard') {
    return pickFrom(pool.standard, random)
  }

  if (pool.pack === 'slang') {
    return pickFrom(pool.slang, random) ?? pickFrom(pool.standard, random)
  }

  const useSlang = pool.slang.length > 0 && random() < 0.3
  return (
    pickFrom(useSlang ? pool.slang : pool.standard, random) ??
    pickFrom(useSlang ? pool.standard : pool.slang, random)
  )
}

export function advanceFallingWords({
  fallingWords,
  deltaSec,
  elapsedSec,
  fallDurationSec,
}: {
  fallingWords: FallingWord[]
  deltaSec: number
  elapsedSec: number
  fallDurationSec: number
}) {
  const progressDelta =
    (Math.max(0, deltaSec) * getSpeedMultiplier(elapsedSec)) / fallDurationSec
  const advanced = fallingWords.map((word) => ({
    ...word,
    progress: word.progress + progressDelta,
  }))

  return {
    active: advanced.filter(({ progress }) => progress < 1),
    missed: advanced.filter(({ progress }) => progress >= 1),
  }
}

export function submitRainWord(
  fallingWords: FallingWord[],
  input: string,
  currentCombo: number,
): SubmissionResult {
  if (input === '') {
    return {
      fallingWords,
      matched: null,
      earnedScore: 0,
      nextCombo: currentCombo,
    }
  }

  let matchedIndex = -1
  let lowestProgress = -1

  fallingWords.forEach((word, index) => {
    if (word.text === input && word.progress > lowestProgress) {
      matchedIndex = index
      lowestProgress = word.progress
    }
  })

  if (matchedIndex === -1) {
    return {
      fallingWords,
      matched: null,
      earnedScore: 0,
      nextCombo: 0,
    }
  }

  const matched = fallingWords[matchedIndex]
  return {
    fallingWords: fallingWords.filter((_, index) => index !== matchedIndex),
    matched,
    earnedScore: getWordScore(matched.text),
    nextCombo: currentCombo + 1,
  }
}
