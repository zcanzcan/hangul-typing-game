import { describe, expect, it } from 'vitest'

import { judgeTyping } from './judge'

describe('judgeTyping', () => {
  it('입력이 끝난 글자를 위치별로 판정한다', () => {
    expect(
      judgeTyping({ target: '사과', input: '사가', isComposing: false }),
    ).toEqual([
      { index: 0, expected: '사', actual: '사', status: 'correct' },
      { index: 1, expected: '과', actual: '가', status: 'incorrect' },
    ])
  })

  it('제시어보다 긴 입력은 틀린 글자로 판정한다', () => {
    expect(
      judgeTyping({ target: '가', input: '가나', isComposing: false }),
    ).toEqual([
      { index: 0, expected: '가', actual: '가', status: 'correct' },
      { index: 1, expected: '', actual: '나', status: 'incorrect' },
    ])
  })

  it('강을 입력하는 중인 가는 자모 접두사가 맞는 조합 중 글자다', () => {
    expect(
      judgeTyping({ target: '강', input: '가', isComposing: true }),
    ).toEqual([
      {
        index: 0,
        expected: '강',
        actual: '가',
        status: 'composing',
        isPrefixMatch: true,
      },
    ])
  })

  it('조합 중인 마지막 글자는 접두사가 달라도 틀림으로 확정하지 않는다', () => {
    expect(
      judgeTyping({ target: '강', input: '나', isComposing: true }),
    ).toEqual([
      {
        index: 0,
        expected: '강',
        actual: '나',
        status: 'composing',
        isPrefixMatch: false,
      },
    ])
  })

  it('조합 중에는 마지막 글자만 보류하고 앞 글자는 확정 판정한다', () => {
    expect(
      judgeTyping({ target: '사과', input: '사고', isComposing: true }),
    ).toEqual([
      { index: 0, expected: '사', actual: '사', status: 'correct' },
      {
        index: 1,
        expected: '과',
        actual: '고',
        status: 'composing',
        isPrefixMatch: true,
      },
    ])
  })
})
