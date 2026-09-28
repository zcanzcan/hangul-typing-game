import { describe, expect, it } from 'vitest'

import { buildSpeechText, findKoreanVoice } from './korean-speech'

function voice(lang: string, localService = false) {
  return { lang, localService } as SpeechSynthesisVoice
}

describe('한국어 읽어주기', () => {
  it('기기 안의 한국어 목소리를 먼저 고른다', () => {
    const remote = voice('ko-KR')
    const local = voice('ko_KR', true)
    expect(findKoreanVoice([voice('en-US', true), remote, local])).toBe(local)
  })

  it('한국어 목소리가 없으면 지원하지 않는 것으로 본다', () => {
    expect(findKoreanVoice([voice('en-US')])).toBeNull()
  })

  it('낱말과 뜻과 예문을 자연스러운 문장으로 잇는다', () => {
    expect(
      buildSpeechText('사과', '사과나무의 열매', '빨간 사과를 먹었다.'),
    ).toBe('사과. 사과나무의 열매. 예문. 빨간 사과를 먹었다.')
  })
})
