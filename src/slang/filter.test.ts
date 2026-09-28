import { describe, expect, it } from 'vitest'

import {
  containsBlockedExpression,
  normalizeForBlocklist,
  validateSlangFields,
} from './filter'

describe('유행어 금칙어 필터', () => {
  const blockedPatterns = ['ㅅㅂ', '나쁜말']

  it('띄어쓰기와 특수문자를 제거하고 자모로 정규화한다', () => {
    expect(normalizeForBlocklist(' ㅅ. ㅂ! ')).toBe('ㅅㅂ')
    expect(normalizeForBlocklist('나쁜 말')).toBe(
      normalizeForBlocklist('나쁜말'),
    )
  })

  it('자모 사이에 특수문자를 넣어도 금칙어를 찾는다', () => {
    expect(
      containsBlockedExpression('오늘은 ㅅ.ㅂ 같은 표현', blockedPatterns),
    ).toBe(true)
  })

  it('낱말, 뜻, 예문 중 하나라도 걸리면 저장을 막는다', () => {
    expect(
      validateSlangFields(
        ['좋은말', '평범한 뜻', '나쁜-말 예문'],
        blockedPatterns,
      ),
    ).toBe(false)
    expect(
      validateSlangFields(
        ['좋은말', '평범한 뜻', '즐거운 예문'],
        blockedPatterns,
      ),
    ).toBe(true)
  })
})
