import { describe, expect, it } from 'vitest'

import collection from '../../public/data/words.json'
import {
  getEligibleChainWords,
  validateChainWord,
} from '../games/wordChain/rules'
import { createWordRainPool, pickWordRainItem } from '../games/wordRain/rules'
import { createTowerPool } from '../games/tower/rules'
import { getWordStageItems } from '../practice/word-stages'
import type { AgeGroup, WordCollection } from './types'

const { items: words } = collection as WordCollection

describe('배포 사전 데이터와 게임 연결', () => {
  it('중복 없이 출처를 보존하고 사전 예문을 포함하지 않는다', () => {
    expect(words).toHaveLength(51)
    expect(new Set(words.map(({ id }) => id)).size).toBe(words.length)
    expect(new Set(words.map(({ text }) => text)).size).toBe(words.length)
    for (const word of words) {
      expect(word.meaning.trim()).not.toBe('')
      expect(word.example).toBeUndefined()
      expect(word.source).toBe('국립국어원 한국어기초사전')
      const provenance = word.provenance!
      expect(provenance.license).toBe('CC-BY-SA-2.0-KR')
      expect(provenance.sense).toBeGreaterThan(0)
      expect(new URL(provenance.url).hostname).toBe('krdict.korean.go.kr')
      expect(new URL(provenance.url).searchParams.get('ParaWordNo')).toBe(
        provenance.entryId,
      )
      expect(provenance.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it.each<AgeGroup>(['kid', 'adult', 'senior'])(
    '%s의 모든 낱말 단계와 두 미니게임에 뜻풀이가 전달된다',
    (ageGroup) => {
      for (const stage of [1, 2, 3] as const) {
        expect(getWordStageItems(words, ageGroup, stage)).toHaveLength(5)
      }
      const eligible = words.filter(({ audience }) =>
        audience.includes(ageGroup),
      )
      const rain = createWordRainPool({
        pack: 'standard',
        ageGroup,
        words,
        slang: [],
      })
      const tower = createTowerPool({
        pack: 'standard',
        ageGroup,
        words,
        slang: [],
      })
      expect(rain.standard.length).toBeGreaterThan(0)
      expect(tower.standard).toHaveLength(eligible.length)
      const item = pickWordRainItem(rain, () => 0)!
      expect(item.meaning).toBe(words.find(({ id }) => id === item.id)!.meaning)
      for (const item of tower.standard) {
        expect(item.meaning).toBe(
          words.find(({ id }) => id === item.id)!.meaning,
        )
      }
    },
  )

  it('기존 끝말잇기 연결과 ID를 유지한다', () => {
    const candidates = getEligibleChainWords(words, 'kid')
    const used = new Set([words.find(({ text }) => text === '사과')!.id])
    let previousWord = '사과'
    for (const input of [
      '과자',
      '자동차',
      '차표',
      '표정',
      '정보',
      '보리',
      '리본',
      '본보기',
    ]) {
      const result = validateChainWord({
        input,
        previousWord,
        words: candidates,
        usedWordIds: used,
        ageGroup: 'kid',
      })
      expect(result.code).toBe('ok')
      expect(result.word?.provenance).toBeDefined()
      used.add(result.word!.id)
      previousWord = input
    }
  })
})
