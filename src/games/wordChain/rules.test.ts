import { describe, expect, it } from 'vitest'

import type { Word } from '../../data/types'
import {
  applyChainFailure,
  getAllowedStartCharacters,
  validateChainWord,
} from './rules'

function word(id: string, text: string): Word {
  return {
    id,
    text,
    meaning: `${text}의 뜻`,
    level: 1,
    audience: ['kid', 'adult', 'senior'],
  }
}

describe('끝말잇기 규칙', () => {
  it('앞 낱말의 끝 글자로 시작하는 낱말을 인정한다', () => {
    const words = [word('1', '사과'), word('2', '과자'), word('3', '자동차')]
    expect(
      validateChainWord({
        input: '과자',
        previousWord: '사과',
        words,
        usedWordIds: new Set(['1']),
        ageGroup: 'adult',
      }).code,
    ).toBe('ok')
  })

  it.each([
    ['자녀', '여'],
    ['경력', '역'],
    ['쾌락', '낙'],
    ['권력', '역'],
  ])('두음 법칙과 받침을 적용한다: %s → %s', (previous, expected) => {
    expect(getAllowedStartCharacters(previous)).toContain(expected)
  })

  it('이미 나온 말, 목록 밖 말, 한 글자 말을 거절한다', () => {
    const words = [word('1', '사과'), word('2', '과자')]
    const base = { previousWord: '사과', words, ageGroup: 'adult' as const }
    expect(
      validateChainWord({ ...base, input: '과자', usedWordIds: new Set(['2']) })
        .code,
    ).toBe('already-used')
    expect(
      validateChainWord({ ...base, input: '과일', usedWordIds: new Set() })
        .code,
    ).toBe('not-in-list')
    expect(
      validateChainWord({ ...base, input: '과', usedWordIds: new Set() }).code,
    ).toBe('too-short')
  })

  it('세 번 틀리면 탈락한다', () => {
    expect(applyChainFailure(1)).toEqual({ failures: 2, eliminated: false })
    expect(applyChainFailure(2)).toEqual({ failures: 3, eliminated: true })
  })

  it('초등학생 판에서는 이을 수 없는 낱말을 막는다', () => {
    const words = [word('1', '사과'), word('2', '과녁')]
    expect(
      validateChainWord({
        input: '과녁',
        previousWord: '사과',
        words,
        usedWordIds: new Set(['1']),
        ageGroup: 'kid',
      }).code,
    ).toBe('dead-end')
  })
})
