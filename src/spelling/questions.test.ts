import { describe, expect, it } from 'vitest'

import type { Sentence } from '../data/types'
import { buildSpellingQuestions } from './questions'

describe('헷갈리는 맞춤법 문제', () => {
  it('맞는 문장과 틀린 문장을 번갈아 배치한다', () => {
    const items: Sentence[] = [
      {
        id: '1',
        text: '준비가 돼요.',
        wrongForm: '준비가 되요.',
        kind: 'spelling',
        audience: ['adult'],
      },
      {
        id: '2',
        text: '비가 안 와요.',
        wrongForm: '비가 않 와요.',
        kind: 'spelling',
        audience: ['adult'],
      },
    ]

    expect(buildSpellingQuestions(items).map(({ choices }) => choices)).toEqual(
      [
        ['준비가 돼요.', '준비가 되요.'],
        ['비가 않 와요.', '비가 안 와요.'],
      ],
    )
  })
})
