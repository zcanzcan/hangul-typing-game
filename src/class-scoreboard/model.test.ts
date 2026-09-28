import { describe, expect, it } from 'vitest'

import type { StoredRecord } from '../storage/records'
import {
  generateClassCode,
  getBestShareableRecord,
  isValidClassCode,
  normalizeClassCode,
  sortClassScores,
} from './model'

function record(id: string, score: number, playedAt: string): StoredRecord {
  return {
    id,
    profileId: 'profile-1',
    mode: 'word',
    stage: 1,
    cpm: 100,
    accuracy: 95,
    score,
    durationSec: 30,
    isBest: true,
    playedAt,
    timeLimit: true,
    completedCount: 5,
  }
}

describe('반 점수판 모델', () => {
  it('반 코드를 대문자 8자리로 정리한다', () => {
    expect(normalizeClassCode(' abcd-2345 ')).toBe('ABCD2345')
    expect(isValidClassCode('abcd-2345')).toBe(true)
    expect(isValidClassCode('ABCI2345')).toBe(false)
  })

  it('헷갈리는 문자를 제외한 반 코드를 만든다', () => {
    const code = generateClassCode(new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7]))

    expect(code).toBe('ABCDEFGH')
    expect(isValidClassCode(code)).toBe(true)
  })

  it('최고 점수가 같으면 최근 기록을 고른다', () => {
    const best = getBestShareableRecord([
      record('one', 100, '2026-09-20T00:00:00.000Z'),
      record('two', 200, '2026-09-20T00:00:00.000Z'),
      record('three', 200, '2026-09-21T00:00:00.000Z'),
    ])

    expect(best?.id).toBe('three')
  })

  it('점수 내림차순, 먼저 달성한 순서로 정렬한다', () => {
    const sorted = sortClassScores([
      {
        id: 'late',
        classId: 'class',
        nickname: '나중',
        score: 300,
        mode: 'word',
        stage: 1,
        playedAt: '2026-09-22T00:00:00.000Z',
      },
      {
        id: 'low',
        classId: 'class',
        nickname: '낮음',
        score: 200,
        mode: 'word',
        stage: 1,
        playedAt: '2026-09-20T00:00:00.000Z',
      },
      {
        id: 'early',
        classId: 'class',
        nickname: '먼저',
        score: 300,
        mode: 'word',
        stage: 1,
        playedAt: '2026-09-21T00:00:00.000Z',
      },
    ])

    expect(sorted.map(({ id }) => id)).toEqual(['early', 'late', 'low'])
  })
})
