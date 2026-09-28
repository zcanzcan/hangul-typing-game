import { describe, expect, it } from 'vitest'

import type { Slang, Word } from '../../data/types'
import {
  applyTowerCorrect,
  applyTowerMistake,
  calculateTimedTowerScore,
  createTowerPool,
  getTowerBlockScore,
  getTowerScene,
  pickTowerItem,
} from './rules'

const words: Word[] = [
  {
    id: 'word-1',
    text: '나무',
    meaning: '줄기와 가지가 있는 식물.',
    level: 1,
    audience: ['kid', 'adult', 'senior'],
  },
  {
    id: 'word-2',
    text: '구름',
    meaning: '하늘에 떠 있는 작은 물방울.',
    level: 1,
    audience: ['kid', 'adult', 'senior'],
  },
]

const slang: Slang[] = [
  {
    id: 'slang-safe',
    text: '갓생',
    meaning: '부지런한 생활.',
    addedAt: '2026-01-01',
    status: 'active',
    kidSafe: true,
    origin: 'official',
  },
  {
    id: 'slang-adult',
    text: '어른말',
    meaning: '성인용 시험 낱말.',
    addedAt: '2026-01-01',
    status: 'active',
    kidSafe: false,
    origin: 'official',
  },
]

describe('낱말 탑 규칙', () => {
  it('블록은 글자 수마다 10점이다', () => {
    expect(getTowerBlockScore('나무', 1)).toBe(20)
  })

  it('10층마다 50점 보너스를 더한다', () => {
    expect(getTowerBlockScore('구름', 10)).toBe(70)
    expect(getTowerBlockScore('구름', 11)).toBe(20)
  })

  it('흔들림이 3번 쌓이면 게임이 끝난다', () => {
    const first = applyTowerMistake({ floor: 4, shakes: 0, streak: 2 })
    const second = applyTowerMistake(first)
    const third = applyTowerMistake(second)

    expect(first).toMatchObject({ shakes: 1, streak: 0, ended: false })
    expect(second.ended).toBe(false)
    expect(third).toMatchObject({ shakes: 3, ended: true })
  })

  it('5연속 정답이면 흔들림을 한 번 회복한다', () => {
    const result = applyTowerCorrect({ floor: 4, shakes: 2, streak: 4 }, '나무')

    expect(result).toMatchObject({ floor: 5, shakes: 1, streak: 5 })
    expect(result.recovered).toBe(true)
  })

  it('초등학생 꾸러미에서는 안전한 요즘 말만 사용한다', () => {
    const pool = createTowerPool({
      pack: 'mixed',
      ageGroup: 'kid',
      words,
      slang,
    })

    expect(pool.slang.map(({ id }) => id)).toEqual(['slang-safe'])
  })

  it('가능하면 바로 앞에 나온 낱말을 다시 고르지 않는다', () => {
    const pool = createTowerPool({
      pack: 'standard',
      ageGroup: 'adult',
      words,
      slang,
    })

    expect(pickTowerItem(pool, 'word-1', () => 0)?.id).toBe('word-2')
  })

  it('60초 도전 점수와 10층별 배경을 계산한다', () => {
    expect(calculateTimedTowerScore(100, 80)).toBeCloseTo(76.8)
    expect(getTowerScene(9)).toBe('ground')
    expect(getTowerScene(10)).toBe('cloud')
    expect(getTowerScene(20)).toBe('space')
  })
})
