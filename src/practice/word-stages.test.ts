import { describe, expect, it } from 'vitest'

import type { Word } from '../data/types'
import { getWordStageDefinition, getWordStageItems } from './word-stages'

const words: Word[] = [
  {
    id: 'level-1',
    text: '나무',
    meaning: '나무',
    level: 1,
    audience: ['kid', 'adult', 'senior'],
  },
  {
    id: 'level-2',
    text: '학교',
    meaning: '학교',
    level: 2,
    audience: ['kid', 'adult', 'senior'],
  },
  {
    id: 'level-3-kid',
    text: '까치',
    meaning: '까치',
    level: 3,
    audience: ['kid'],
  },
  {
    id: 'level-3-adult',
    text: '닭',
    meaning: '닭',
    level: 3,
    audience: ['adult', 'senior'],
  },
  {
    id: 'level-4',
    text: '어려운말',
    meaning: '어려운 말',
    level: 4,
    audience: ['adult'],
  },
]

describe('word stages', () => {
  it('단계와 연령대가 모두 맞는 낱말만 고른다', () => {
    expect(getWordStageItems(words, 'kid', 3).map(({ id }) => id)).toEqual([
      'level-3-kid',
    ])
    expect(getWordStageItems(words, 'adult', 3).map(({ id }) => id)).toEqual([
      'level-3-adult',
    ])
  })

  it('어려운 4단계 낱말을 T-6 세 단계에 섞지 않는다', () => {
    expect(getWordStageItems(words, 'adult', 3)).not.toContainEqual(
      expect.objectContaining({ id: 'level-4' }),
    )
  })

  it('1단계부터 받침, 쌍자음·겹받침 순서로 안내한다', () => {
    expect(
      [1, 2, 3].map(
        (stage) => getWordStageDefinition(stage as 1 | 2 | 3).title,
      ),
    ).toEqual(['받침 없는 글자', '받침 연습', '쌍자음·겹받침'])
  })
})
