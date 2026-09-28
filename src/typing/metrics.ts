import { disassemble } from 'es-hangul'

export type PracticeMode =
  'position' | 'word' | 'shortSentence' | 'longSentence'

export type AgeGroup = 'kid' | 'adult' | 'senior'

export const STAGE_BONUS: Readonly<Record<PracticeMode, number>> = {
  position: 1,
  word: 1.2,
  shortSentence: 1.5,
  longSentence: 1.8,
}

export interface AccuracyInput {
  correctCharacters: number
  presentedCharacters: number
}

export interface TimedPracticeInput extends AccuracyInput {
  timeLimit: true
  keystrokes: number
  durationSec: number
  mode: PracticeMode
}

export interface UntimedPracticeInput extends AccuracyInput {
  timeLimit: false
  completedCount: number
}

export interface TimedPracticeMetrics {
  timeLimit: true
  cpm: number
  accuracy: number
  score: number
}

export interface UntimedPracticeMetrics {
  timeLimit: false
  accuracy: number
  completedCount: number
}

export type PracticeMetrics = TimedPracticeMetrics | UntimedPracticeMetrics

export type StagePassInput =
  | { ageGroup: 'kid'; accuracy: number }
  | { ageGroup: 'senior'; accuracy: number }
  | {
      ageGroup: 'adult'
      accuracy: number
      cpm: number
      targetCpm: number
    }

function assertNonNegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name}은(는) 0 이상의 유한한 수여야 합니다.`)
  }
}

export function countKeystrokes(text: string) {
  return Array.from(disassemble(text)).length
}

export function calculateCpm(keystrokes: number, durationSec: number) {
  assertNonNegative(keystrokes, '타수')

  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new RangeError('연습 시간은 0보다 큰 유한한 수여야 합니다.')
  }

  return (keystrokes / durationSec) * 60
}

export function calculateAccuracy({
  correctCharacters,
  presentedCharacters,
}: AccuracyInput) {
  assertNonNegative(correctCharacters, '맞게 입력한 글자 수')
  assertNonNegative(presentedCharacters, '제시된 글자 수')

  if (correctCharacters > presentedCharacters) {
    throw new RangeError(
      '맞게 입력한 글자 수는 제시된 글자 수보다 클 수 없습니다.',
    )
  }

  if (presentedCharacters === 0) {
    return 0
  }

  return (correctCharacters / presentedCharacters) * 100
}

export function calculateScore(
  cpm: number,
  accuracy: number,
  mode: PracticeMode,
) {
  assertNonNegative(cpm, '분당 타수')

  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
    throw new RangeError('정확도는 0 이상 100 이하의 수여야 합니다.')
  }

  return cpm * (accuracy / 100) ** 2 * STAGE_BONUS[mode]
}

export function hasPassedStage(input: StagePassInput) {
  if (input.ageGroup === 'kid') {
    return input.accuracy >= 85
  }

  if (input.ageGroup === 'senior') {
    return input.accuracy >= 80
  }

  return input.accuracy >= 90 && input.cpm >= input.targetCpm
}

export function calculatePracticeMetrics(
  input: TimedPracticeInput | UntimedPracticeInput,
): PracticeMetrics {
  const accuracy = calculateAccuracy(input)

  if (!input.timeLimit) {
    assertNonNegative(input.completedCount, '완료 개수')

    return {
      timeLimit: false,
      accuracy,
      completedCount: input.completedCount,
    }
  }

  const cpm = calculateCpm(input.keystrokes, input.durationSec)

  return {
    timeLimit: true,
    cpm,
    accuracy,
    score: calculateScore(cpm, accuracy, input.mode),
  }
}
