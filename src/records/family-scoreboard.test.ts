import { describe, expect, it } from 'vitest'

import type { Profile } from '../data/types'
import type { StoredRecord } from '../storage/records'
import { buildFamilyStandings } from './family-scoreboard'

function profile(id: string, nickname: string): Profile {
  return {
    id,
    nickname,
    ageGroup: 'adult',
    settings: {
      fontSize: 'normal',
      timeLimit: true,
      speech: false,
      sfx: true,
      slangMode: false,
      keyboard: 'device',
    },
    createdAt: `2026-09-2${id}`,
  }
}

function record(
  id: string,
  profileId: string,
  score: number,
  accuracy: number,
): StoredRecord {
  return {
    id,
    profileId,
    mode: 'word',
    stage: 1,
    cpm: score / 10,
    accuracy,
    score,
    durationSec: 30,
    isBest: true,
    playedAt: '2026-09-28T00:00:00.000Z',
    timeLimit: true,
    completedCount: 5,
  }
}

describe('buildFamilyStandings', () => {
  it('가족별 최고 점수와 기록 수를 계산해 높은 점수순으로 정렬한다', () => {
    const standings = buildFamilyStandings(
      [profile('1', '봄'), profile('2', '별')],
      [
        record('r1', '1', 300, 90),
        record('r2', '1', 500, 95),
        record('r3', '2', 700, 88),
      ],
    )

    expect(standings.map(({ profile: item }) => item.nickname)).toEqual([
      '별',
      '봄',
    ])
    expect(standings[1]).toMatchObject({
      bestScore: 500,
      bestAccuracy: 95,
      bestCpm: 50,
      playCount: 2,
    })
  })

  it('기록이 없는 새 가족도 0점으로 보여준다', () => {
    expect(buildFamilyStandings([profile('1', '새싹')], [])[0]).toMatchObject({
      bestScore: 0,
      bestAccuracy: 0,
      bestCpm: 0,
      playCount: 0,
    })
  })
})
