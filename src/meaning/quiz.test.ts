import { describe, expect, it } from 'vitest'

import type { Sentence } from '../data/types'
import { buildMeaningQuestions } from './quiz'

describe('속담 뜻 퀴즈', () => {
  it('정답 하나와 서로 다른 오답으로 네 보기를 만든다', () => {
    const item: Sentence = {
      id: 'p1',
      text: '가는 말이 고와야 오는 말이 곱다.',
      kind: 'proverb',
      meaning: '남에게 좋게 말해야 좋은 말을 듣는다.',
      audience: ['adult'],
    }
    const [question] = buildMeaningQuestions([item])
    expect(question.choices).toHaveLength(4)
    expect(new Set(question.choices).size).toBe(4)
    expect(question.choices).toContain(item.meaning)
  })
})
