import { getChoseong } from 'es-hangul'

import type { AgeGroup, Slang } from '../../data/types'

export const SLANG_QUIZ_MIN_ITEMS = 4
export const SLANG_QUIZ_MAX_QUESTIONS = 10

export interface SlangQuizScoreInput {
  remainingSec: number | null
  hintSeen: boolean
  streakBefore: number
}

export interface SlangQuizScoreResult {
  points: number
  nextStreak: number
  comboBonus: number
  speedBonus: number
}

export function getSlangQuizTimeLimit(ageGroup: AgeGroup): number | null {
  if (ageGroup === 'kid') {
    return 20
  }

  return ageGroup === 'adult' ? 10 : null
}

export function getEligibleSlangQuizItems(
  items: readonly Slang[],
  ageGroup: AgeGroup,
) {
  return items.filter(
    ({ status, kidSafe }) =>
      status === 'active' && (ageGroup !== 'kid' || kidSafe),
  )
}

export function canStartSlangQuiz({
  slangMode,
  items,
  ageGroup,
}: {
  slangMode: boolean
  items: readonly Slang[]
  ageGroup: AgeGroup
}) {
  return (
    slangMode &&
    getEligibleSlangQuizItems(items, ageGroup).length >= SLANG_QUIZ_MIN_ITEMS
  )
}

export function buildSlangQuizQuestions(
  items: readonly Slang[],
  ageGroup: AgeGroup,
  random: () => number = Math.random,
) {
  const shuffled = [...getEligibleSlangQuizItems(items, ageGroup)]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }

  return shuffled.slice(0, SLANG_QUIZ_MAX_QUESTIONS)
}

export function normalizeSlangAnswer(value: string) {
  return value.replace(/\s/g, '')
}

export function isCorrectSlangAnswer(input: string, answer: string) {
  return normalizeSlangAnswer(input) === normalizeSlangAnswer(answer)
}

export function getSlangHint(text: string) {
  return getChoseong(text).replace(/\s/g, '')
}

export function maskSlangExample(example: string | undefined, answer: string) {
  if (!example) {
    return undefined
  }

  return example.replaceAll(answer, '○○')
}

export function calculateSlangQuizScore({
  remainingSec,
  hintSeen,
  streakBefore,
}: SlangQuizScoreInput): SlangQuizScoreResult {
  const speedBonus = remainingSec === null ? 0 : Math.max(0, remainingSec) * 5
  const nextStreak = streakBefore + 1
  const comboBonus = nextStreak >= 3 ? 20 : 0
  const hintPenalty = hintSeen ? 30 : 0
  const points = Math.max(50, 100 + speedBonus + comboBonus - hintPenalty)

  return { points, nextStreak, comboBonus, speedBonus }
}
