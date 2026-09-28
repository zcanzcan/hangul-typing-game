import { describe, expect, it } from 'vitest'

import type { Word } from '../data/types'
import { getDailyWord, getLocalDateKey } from './daily-word'

const words: Word[] = [
  {
    id: 'kid',
    text: '나무',
    meaning: '식물',
    level: 1,
    audience: ['kid'],
  },
  {
    id: 'adult',
    text: '경력',
    meaning: '경험',
    level: 3,
    audience: ['adult'],
  },
]

describe('오늘의 낱말', () => {
  it('같은 날짜와 연령대에는 같은 낱말을 고른다', () => {
    expect(getDailyWord(words, 'kid', '2026-09-29')).toEqual(
      getDailyWord(words, 'kid', '2026-09-29'),
    )
  })

  it('프로필 연령대에 맞는 낱말만 고른다', () => {
    expect(getDailyWord(words, 'adult', '2026-09-29')?.id).toBe('adult')
  })

  it('현지 날짜를 YYYY-MM-DD로 만든다', () => {
    expect(getLocalDateKey(new Date(2026, 8, 9))).toBe('2026-09-09')
  })
})
