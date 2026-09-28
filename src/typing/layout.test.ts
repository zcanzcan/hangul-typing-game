import { describe, expect, it } from 'vitest'

import { appendJamo, composeJamo, getKeySequence } from './layout'

describe('getKeySequence', () => {
  it('강을 두벌식 ㄱ(r), ㅏ(k), ㅇ(d) 키 목록으로 바꾼다', () => {
    expect(getKeySequence('강')).toEqual([
      { jamo: 'ㄱ', key: 'r', shift: false },
      { jamo: 'ㅏ', key: 'k', shift: false },
      { jamo: 'ㅇ', key: 'd', shift: false },
    ])
  })

  it.each([
    ['ㄲ', 'r'],
    ['ㄸ', 'e'],
    ['ㅃ', 'q'],
    ['ㅆ', 't'],
    ['ㅉ', 'w'],
  ])('%s은 Shift + %s 키로 표시한다', (jamo, key) => {
    expect(getKeySequence(jamo)).toEqual([{ jamo, key, shift: true }])
  })

  it('겹모음과 겹받침을 실제로 누르는 기본 자모 키로 펼친다', () => {
    expect(getKeySequence('과')).toEqual([
      { jamo: 'ㄱ', key: 'r', shift: false },
      { jamo: 'ㅗ', key: 'h', shift: false },
      { jamo: 'ㅏ', key: 'k', shift: false },
    ])
    expect(getKeySequence('값')).toEqual([
      { jamo: 'ㄱ', key: 'r', shift: false },
      { jamo: 'ㅏ', key: 'k', shift: false },
      { jamo: 'ㅂ', key: 'q', shift: false },
      { jamo: 'ㅅ', key: 't', shift: false },
    ])
  })
})

describe('화면 키보드 한글 조합', () => {
  it('ㄱ, ㅏ, ㅇ을 한 번에 조합하면 강이 된다', () => {
    expect(composeJamo(['ㄱ', 'ㅏ', 'ㅇ'])).toBe('강')
  })

  it('키를 누를 때마다 현재 입력에 자모를 이어 조합한다', () => {
    const result = ['ㄱ', 'ㅏ', 'ㅇ'].reduce(appendJamo, '')

    expect(result).toBe('강')
  })
})
