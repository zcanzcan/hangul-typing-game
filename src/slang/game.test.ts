import { describe, expect, it } from 'vitest'

import type { Slang } from '../data/types'
import { buildSlangQuestions, calculateSlangScore } from './game'

const officialSlang: Slang = {
  id: 'official',
  text: '갓생',
  meaning: '부지런하고 알차게 사는 삶.',
  addedAt: '2026-09-28',
  status: 'active',
  kidSafe: true,
  origin: 'official',
}

describe('유행어 카드게임 점수', () => {
  it('뜻 정답에 100점, 정확한 입력에 50점을 더한다', () => {
    expect(
      calculateSlangScore({
        meaningCorrect: true,
        typingCorrect: true,
        streakBefore: 0,
      }),
    ).toEqual({ points: 150, nextStreak: 1, comboBonus: 0 })
  })

  it('뜻 오답은 0점이고 연속 정답을 초기화한다', () => {
    expect(
      calculateSlangScore({
        meaningCorrect: false,
        typingCorrect: false,
        streakBefore: 4,
      }),
    ).toEqual({ points: 0, nextStreak: 0, comboBonus: 0 })
  })

  it('3연속 정답부터 문제당 20점 콤보를 더한다', () => {
    expect(
      calculateSlangScore({
        meaningCorrect: true,
        typingCorrect: false,
        streakBefore: 2,
      }),
    ).toEqual({ points: 120, nextStreak: 3, comboBonus: 20 })
  })
})

describe('유행어 문제 만들기', () => {
  it('한 판에 10문제를 만들고 사용자 추가 항목을 먼저 넣는다', () => {
    const customSlang = {
      ...officialSlang,
      id: 'custom',
      text: '내유행어',
      meaning: '직접 추가한 뜻.',
      origin: 'custom' as const,
    }
    const questions = buildSlangQuestions(
      [officialSlang, customSlang],
      10,
      () => 0.5,
    )

    expect(questions).toHaveLength(10)
    expect(questions[0].slang).toEqual(customSlang)
    expect(questions.every(({ choices }) => choices.length === 4)).toBe(true)
  })
})
