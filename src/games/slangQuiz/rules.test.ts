import { describe, expect, it } from 'vitest'

import type { Slang } from '../../data/types'
import {
  buildSlangQuizQuestions,
  calculateSlangQuizScore,
  canStartSlangQuiz,
  getEligibleSlangQuizItems,
  getSlangHint,
  getSlangQuizTimeLimit,
  isCorrectSlangAnswer,
  maskSlangExample,
} from './rules'

const makeSlang = (id: string, overrides: Partial<Slang> = {}): Slang => ({
  id,
  text: `유행어${id}`,
  meaning: `뜻${id}`,
  addedAt: '2026-09-28',
  status: 'active',
  kidSafe: true,
  origin: 'official',
  ...overrides,
})

const items = [1, 2, 3, 4, 5].map((id) => makeSlang(String(id)))

describe('요즘 말 스피드 퀴즈 규칙', () => {
  it('연령별 제한 시간을 적용한다', () => {
    expect(getSlangQuizTimeLimit('kid')).toBe(20)
    expect(getSlangQuizTimeLimit('adult')).toBe(10)
    expect(getSlangQuizTimeLimit('senior')).toBeNull()
  })

  it('정답 100점과 빠르기 보너스를 계산한다', () => {
    expect(
      calculateSlangQuizScore({
        remainingSec: 7,
        hintSeen: false,
        streakBefore: 0,
      }),
    ).toEqual({ points: 135, nextStreak: 1, comboBonus: 0, speedBonus: 35 })
  })

  it('힌트 점수 30점을 빼되 정답 점수는 최소 50점이다', () => {
    expect(
      calculateSlangQuizScore({
        remainingSec: -20,
        hintSeen: true,
        streakBefore: 0,
      }).points,
    ).toBe(70)
  })

  it('3연속 정답부터 20점 콤보를 더한다', () => {
    expect(
      calculateSlangQuizScore({
        remainingSec: null,
        hintSeen: false,
        streakBefore: 2,
      }),
    ).toEqual({ points: 120, nextStreak: 3, comboBonus: 20, speedBonus: 0 })
  })

  it('띄어쓰기를 무시하고 답을 비교한다', () => {
    expect(isCorrectSlangAnswer('알잘 딱깔센', '알잘딱깔센')).toBe(true)
    expect(isCorrectSlangAnswer('알잘딱', '알잘딱깔센')).toBe(false)
  })

  it('유행어 모드가 꺼져 있거나 안전한 말이 4개 미만이면 시작하지 않는다', () => {
    expect(
      canStartSlangQuiz({ slangMode: false, items, ageGroup: 'adult' }),
    ).toBe(false)
    expect(
      canStartSlangQuiz({
        slangMode: true,
        items: items.slice(0, 3),
        ageGroup: 'adult',
      }),
    ).toBe(false)
  })

  it('초등학생은 kidSafe인 활성 유행어만 사용한다', () => {
    const filtered = getEligibleSlangQuizItems(
      [
        ...items,
        makeSlang('unsafe', { kidSafe: false }),
        makeSlang('archived', { status: 'archived' }),
      ],
      'kid',
    )

    expect(filtered.map(({ id }) => id)).toEqual(['1', '2', '3', '4', '5'])
    expect(buildSlangQuizQuestions(items, 'adult', () => 0)).toHaveLength(5)
  })

  it('초성 힌트와 정답을 가린 예문을 만든다', () => {
    expect(getSlangHint('갓생')).toBe('ㄱㅅ')
    expect(maskSlangExample('오늘은 갓생을 살 거야.', '갓생')).toBe(
      '오늘은 ○○을 살 거야.',
    )
  })
})
