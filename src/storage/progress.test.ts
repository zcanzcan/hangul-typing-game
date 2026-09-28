import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearProgress,
  completeWordStage,
  isModeUnlocked,
  isWordStageUnlocked,
} from './progress'

describe('word stage progress', () => {
  beforeEach(() => {
    clearProgress()
  })

  it('1단계만 처음부터 열리고 통과한 순서대로 다음 단계가 열린다', () => {
    expect(isWordStageUnlocked(1)).toBe(true)
    expect(isWordStageUnlocked(2)).toBe(false)
    expect(isWordStageUnlocked(3)).toBe(false)

    completeWordStage(1)
    expect(isWordStageUnlocked(2)).toBe(true)
    expect(isWordStageUnlocked(3)).toBe(false)

    completeWordStage(2)
    expect(isWordStageUnlocked(3)).toBe(true)
  })

  it('3단계를 통과해야 문장 연습이 열린다', () => {
    completeWordStage(1)
    completeWordStage(2)
    expect(isModeUnlocked('sentence', 'adult')).toBe(false)

    completeWordStage(3)
    expect(isModeUnlocked('sentence', 'adult')).toBe(true)
  })

  it('기존 낱말 연습 완료 기록은 세 단계를 모두 통과한 것으로 이어 쓴다', () => {
    localStorage.setItem(
      'hangul-game:progress:v1',
      JSON.stringify({ version: 1, completedModes: ['word'] }),
    )

    expect(isWordStageUnlocked(2)).toBe(true)
    expect(isWordStageUnlocked(3)).toBe(true)
    expect(isModeUnlocked('sentence', 'adult')).toBe(true)
  })
})
