import { describe, expect, it } from 'vitest'

import type { Slang, Word } from '../../data/types'
import {
  createWordRainPool,
  getAvailablePacks,
  getEligibleSlang,
  getSpeedMultiplier,
  getWordScore,
  submitRainWord,
  type FallingWord,
} from './rules'
import {
  handleCompositionEnd,
  handleEnter,
  INITIAL_SUBMISSION_GATE,
} from './submission'

function falling(dropId: string, text: string, progress: number): FallingWord {
  return {
    dropId,
    id: `word-${dropId}`,
    text,
    progress,
    lane: 50,
    kind: 'standard',
  }
}

const standardWords: Word[] = [
  {
    id: 'word-1',
    text: '사과',
    meaning: '열매',
    level: 1,
    audience: ['kid', 'adult', 'senior'],
  },
  {
    id: 'word-2',
    text: '나무',
    meaning: '식물',
    level: 1,
    audience: ['kid', 'adult', 'senior'],
  },
]

const slangWords: Slang[] = [
  {
    id: 'safe',
    text: '갓생',
    meaning: '부지런한 삶',
    addedAt: '2026-01-01',
    status: 'active',
    kidSafe: true,
    origin: 'official',
  },
  {
    id: 'adult-only',
    text: '어른말',
    meaning: '어른용',
    addedAt: '2026-01-01',
    status: 'active',
    kidSafe: false,
    origin: 'official',
  },
]

describe('낱말 비 규칙', () => {
  it('글자 수만큼 점수를 주고 틀리면 콤보를 끊는다', () => {
    expect(getWordScore('갓생')).toBe(20)
    expect(
      submitRainWord([falling('1', '갓생', 0.3)], '없는말', 4),
    ).toMatchObject({
      earnedScore: 0,
      nextCombo: 0,
    })
  })

  it('같은 낱말이 둘이면 가장 아래 것을 없앤다', () => {
    const result = submitRainWord(
      [falling('high', '사과', 0.2), falling('low', '사과', 0.8)],
      '사과',
      1,
    )

    expect(result.matched?.dropId).toBe('low')
    expect(result.fallingWords.map(({ dropId }) => dropId)).toEqual(['high'])
    expect(result.nextCombo).toBe(2)
  })

  it('초등학생 꾸러미에서는 kidSafe가 아닌 유행어를 뺀다', () => {
    expect(getEligibleSlang(slangWords, 'kid').map(({ id }) => id)).toEqual([
      'safe',
    ])
  })

  it('유행어 모드가 꺼져 있으면 표준어 꾸러미만 제공한다', () => {
    expect(getAvailablePacks(false)).toEqual(['standard'])
    expect(getAvailablePacks(true)).toEqual(['standard', 'slang', 'mixed'])
  })

  it('요즘 말이 5개 미만이면 표준어를 채운다', () => {
    const pool = createWordRainPool({
      pack: 'slang',
      ageGroup: 'adult',
      words: standardWords,
      slang: slangWords,
    })

    expect(pool.slangFallback).toBe(true)
    expect(pool.slang.some(({ kind }) => kind === 'standard')).toBe(true)
  })

  it('30초마다 10% 빨라지고 2.5배에서 멈춘다', () => {
    expect(getSpeedMultiplier(29)).toBe(1)
    expect(getSpeedMultiplier(30)).toBeCloseTo(1.1)
    expect(getSpeedMultiplier(60)).toBeCloseTo(1.21)
    expect(getSpeedMultiplier(3_000)).toBe(2.5)
  })

  it('조합 중 Enter는 조합이 끝난 값으로 한 번만 제출한다', () => {
    const composing = handleEnter(INITIAL_SUBMISSION_GATE, '가', true)
    expect(composing.valueToSubmit).toBeNull()

    const ended = handleCompositionEnd(composing.gate, '강')
    expect(ended.valueToSubmit).toBe('강')

    const duplicate = handleEnter(ended.gate, '', false)
    expect(duplicate.valueToSubmit).toBeNull()
  })

  it('빈 입력칸의 Enter를 무시한다', () => {
    expect(
      handleEnter(INITIAL_SUBMISSION_GATE, '', false).valueToSubmit,
    ).toBeNull()
  })
})
