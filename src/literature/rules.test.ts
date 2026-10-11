import { describe, expect, it } from 'vitest'
import { judgePassage, normalizeLiteratureInput, passageMetrics } from './rules'

describe('문학 구절 입력 규칙', () => {
  it('NFC와 CRLF·CR·LF를 정규화하되 띄어쓰기·문장부호를 유지한다', () => {
    expect(normalizeLiteratureInput('가\r\n나\r다\n라')).toBe('가 나 다 라')
    expect(judgePassage('가 나.', '가\n나.', false).complete).toBe(true)
    expect(judgePassage('가 나.', '가  나.', false).complete).toBe(false)
    expect(judgePassage('가 나.', '가 나', false).complete).toBe(false)
    expect(judgePassage('가 나.', ' 가 나. ', false).complete).toBe(false)
  })
  it('조합 중 마지막 글자는 오답 확정하지 않고 정확한 값도 완료하지 않는다', () => {
    const judged = judgePassage('강', '가', true)
    expect(judged.judgments[0].status).toBe('composing')
    expect(judged.correct).toBe(0)
    expect(judged.complete).toBe(false)
    expect(judgePassage('강', '강', true).complete).toBe(false)
    expect(judgePassage('강', '강', false).complete).toBe(true)
    expect(judgePassage('강 나.', '가 나.', true).judgments[0].status).toBe(
      'composing',
    )
  })
  it('중간 수정·삽입·삭제·초과 입력을 위치별로 판단한다', () => {
    expect(judgePassage('가 나.', '가 다.', false).correct).toBe(3)
    expect(judgePassage('가 나.', '가 나.', false).accuracy).toBe(100)
    expect(judgePassage('가 나.', '가 나.!', false).accuracy).toBe(80)
    expect(judgePassage('가 나.', '가.', false).complete).toBe(false)
  })
  it('기존 자소 규칙을 재사용하고 0초·확인 없음에서 무한대/NaN을 내지 않는다', () => {
    expect(passageMetrics(['사과'], 30, 2, 2)).toEqual({
      keystrokes: 5,
      cpm: 10,
      accuracy: 100,
    })
    expect(passageMetrics(['까 닭.'], 60, 3, 5)).toEqual({
      keystrokes: 8,
      cpm: 8,
      accuracy: 60,
    })
    expect(passageMetrics([], 0, 0, 0)).toEqual({
      keystrokes: 0,
      cpm: 0,
      accuracy: 0,
    })
  })
})
