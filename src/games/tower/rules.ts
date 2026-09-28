import type { AgeGroup, MinigamePack, Slang, Word } from '../../data/types'

export const TOWER_MAX_SHAKES = 3
export const TOWER_RECOVERY_STREAK = 5
export const TOWER_TIMED_DURATION_SEC = 60

export type TowerMode = 'untimed' | 'timed'

export interface TowerItem {
  id: string
  text: string
  kind: 'standard' | 'slang'
  meaning?: string
  example?: string
  standardForm?: string
}

export interface TowerPool {
  pack: MinigamePack
  standard: TowerItem[]
  slang: TowerItem[]
  slangFallback: boolean
}

export interface TowerProgress {
  floor: number
  shakes: number
  streak: number
}

export interface TowerCorrectResult extends TowerProgress {
  points: number
  recovered: boolean
}

export interface TowerMistakeResult extends TowerProgress {
  ended: boolean
}

export function getAvailableTowerPacks(slangMode: boolean): MinigamePack[] {
  return slangMode ? ['standard', 'slang', 'mixed'] : ['standard']
}

function getEligibleStandardWords(words: readonly Word[], ageGroup: AgeGroup) {
  return words
    .filter(
      ({ text, audience }) =>
        audience.includes(ageGroup) && text.trim() !== '' && !/\s/u.test(text),
    )
    .map<TowerItem>(({ id, text, meaning, example }) => ({
      id,
      text,
      kind: 'standard',
      meaning,
      example,
    }))
}

function getEligibleSlang(slang: readonly Slang[], ageGroup: AgeGroup) {
  return slang
    .filter(
      ({ text, status, kidSafe }) =>
        status === 'active' &&
        (ageGroup !== 'kid' || kidSafe) &&
        text.trim() !== '' &&
        !/\s/u.test(text),
    )
    .map<TowerItem>(({ id, text, meaning, example, standardForm }) => ({
      id,
      text,
      kind: 'slang',
      meaning,
      example,
      standardForm,
    }))
}

export function createTowerPool({
  pack,
  ageGroup,
  words,
  slang,
}: {
  pack: MinigamePack
  ageGroup: AgeGroup
  words: readonly Word[]
  slang: readonly Slang[]
}): TowerPool {
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

function pickFrom(
  items: readonly TowerItem[],
  previousItemId: string | null,
  random: () => number,
) {
  const candidates = items.filter(({ id }) => id !== previousItemId)
  const source = candidates.length > 0 ? candidates : items

  if (source.length === 0) {
    return null
  }

  return source[Math.floor(random() * source.length) % source.length]
}

export function pickTowerItem(
  pool: TowerPool,
  previousItemId: string | null = null,
  random: () => number = Math.random,
) {
  if (pool.pack === 'standard') {
    return pickFrom(pool.standard, previousItemId, random)
  }

  if (pool.pack === 'slang') {
    return (
      pickFrom(pool.slang, previousItemId, random) ??
      pickFrom(pool.standard, previousItemId, random)
    )
  }

  const useSlang = pool.slang.length > 0 && random() < 0.3
  return (
    pickFrom(useSlang ? pool.slang : pool.standard, previousItemId, random) ??
    pickFrom(useSlang ? pool.standard : pool.slang, previousItemId, random)
  )
}

export function getTowerBlockScore(text: string, floor: number) {
  const blockPoints = Array.from(text).length * 10
  return blockPoints + (floor > 0 && floor % 10 === 0 ? 50 : 0)
}

export function applyTowerCorrect(
  progress: TowerProgress,
  text: string,
): TowerCorrectResult {
  const floor = progress.floor + 1
  const streak = progress.streak + 1
  const recovered = streak % TOWER_RECOVERY_STREAK === 0 && progress.shakes > 0

  return {
    floor,
    shakes: recovered ? progress.shakes - 1 : progress.shakes,
    streak,
    points: getTowerBlockScore(text, floor),
    recovered,
  }
}

export function applyTowerMistake(progress: TowerProgress): TowerMistakeResult {
  const shakes = Math.min(TOWER_MAX_SHAKES, progress.shakes + 1)

  return {
    floor: progress.floor,
    shakes,
    streak: 0,
    ended: shakes >= TOWER_MAX_SHAKES,
  }
}

export function calculateTimedTowerScore(cpm: number, accuracy: number) {
  return cpm * (accuracy / 100) ** 2 * 1.2
}

export function getTowerScene(floor: number): 'ground' | 'cloud' | 'space' {
  if (floor >= 20) {
    return 'space'
  }

  return floor >= 10 ? 'cloud' : 'ground'
}
