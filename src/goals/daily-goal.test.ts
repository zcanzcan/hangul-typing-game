import { beforeEach, describe, expect, it } from 'vitest'

import {
  DAILY_GOAL_SECONDS,
  getPracticeCalendar,
  getPracticeTime,
  recordPracticeTime,
} from './daily-goal'

beforeEach(() => localStorage.clear())

describe('하루 10분 목표', () => {
  it('같은 날의 연습 시간을 프로필별로 누적한다', () => {
    recordPracticeTime('p1', 200, '2026-09-29T01:00:00.000Z')
    recordPracticeTime('p1', 400, '2026-09-29T02:00:00.000Z')
    recordPracticeTime('p2', 50, '2026-09-29T02:00:00.000Z')
    expect(getPracticeTime('p1', '2026-09-29')).toBe(600)
    expect(getPracticeTime('p2', '2026-09-29')).toBe(50)
  })

  it('10분을 채운 날에 완료 도장을 표시한다', () => {
    recordPracticeTime('p1', DAILY_GOAL_SECONDS, '2026-09-03T01:00:00.000Z')
    expect(getPracticeCalendar('p1', '2026-09')).toEqual([
      {
        dateKey: '2026-09-03',
        seconds: DAILY_GOAL_SECONDS,
        completed: true,
      },
    ])
  })
})
