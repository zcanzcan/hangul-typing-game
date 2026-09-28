import { describe, expect, it } from 'vitest'

import {
  calculateAccuracy,
  calculateCpm,
  calculatePracticeMetrics,
  calculateScore,
  countKeystrokes,
  hasPassedStage,
} from './metrics'

describe('countKeystrokes', () => {
  it('사과를 자모 기준 5타로 센다', () => {
    expect(countKeystrokes('사과')).toBe(5)
  })

  it('쌍자음은 Shift를 포함해 각각 1타로 센다', () => {
    expect(countKeystrokes('ㄲㄸㅃㅆㅉ')).toBe(5)
    expect(countKeystrokes('까')).toBe(2)
  })

  it.each(['ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'])(
    '겹받침 %s을 2타로 센다',
    (jamo) => {
      expect(countKeystrokes(jamo)).toBe(2)
    },
  )

  it.each(['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'])(
    '겹모음 %s을 2타로 센다',
    (jamo) => {
      expect(countKeystrokes(jamo)).toBe(2)
    },
  )
})

describe('타자 지표', () => {
  it('30초 동안 입력한 50타를 분당 100타로 환산한다', () => {
    expect(calculateCpm(50, 30)).toBe(100)
  })

  it('정확도를 맞은 글자 수 ÷ 제시된 글자 수로 계산한다', () => {
    expect(
      calculateAccuracy({ correctCharacters: 9, presentedCharacters: 10 }),
    ).toBe(90)
  })

  it.each([
    ['position', 64],
    ['word', 76.8],
    ['shortSentence', 96],
    ['longSentence', 115.2],
  ] as const)('%s 단계 보너스로 점수를 계산한다', (mode, expected) => {
    expect(calculateScore(100, 80, mode)).toBeCloseTo(expected)
  })

  it('시간 제한이 있는 연습은 타수, 정확도, 점수를 돌려준다', () => {
    expect(
      calculatePracticeMetrics({
        timeLimit: true,
        keystrokes: 50,
        durationSec: 30,
        correctCharacters: 8,
        presentedCharacters: 10,
        mode: 'word',
      }),
    ).toEqual({
      timeLimit: true,
      cpm: 100,
      accuracy: 80,
      score: 76.80000000000001,
    })
  })

  it('시간 제한 없음 모드는 타수 없이 정확도와 완료 개수만 돌려준다', () => {
    const result = calculatePracticeMetrics({
      timeLimit: false,
      correctCharacters: 8,
      presentedCharacters: 10,
      completedCount: 7,
    })

    expect(result).toEqual({
      timeLimit: false,
      accuracy: 80,
      completedCount: 7,
    })
    expect(result).not.toHaveProperty('cpm')
    expect(result).not.toHaveProperty('score')
  })
})

describe('hasPassedStage', () => {
  it('초등학생은 정확도 85% 이상이면 통과한다', () => {
    expect(hasPassedStage({ ageGroup: 'kid', accuracy: 85 })).toBe(true)
    expect(hasPassedStage({ ageGroup: 'kid', accuracy: 84.9 })).toBe(false)
  })

  it('성인은 정확도 90%와 단계별 타수 목표를 모두 충족해야 한다', () => {
    expect(
      hasPassedStage({
        ageGroup: 'adult',
        accuracy: 90,
        cpm: 200,
        targetCpm: 200,
      }),
    ).toBe(true)
    expect(
      hasPassedStage({
        ageGroup: 'adult',
        accuracy: 89.9,
        cpm: 200,
        targetCpm: 200,
      }),
    ).toBe(false)
    expect(
      hasPassedStage({
        ageGroup: 'adult',
        accuracy: 90,
        cpm: 199,
        targetCpm: 200,
      }),
    ).toBe(false)
  })

  it('어르신은 타수와 관계없이 정확도 80% 이상이면 통과한다', () => {
    expect(hasPassedStage({ ageGroup: 'senior', accuracy: 80 })).toBe(true)
    expect(hasPassedStage({ ageGroup: 'senior', accuracy: 79.9 })).toBe(false)
  })
})
