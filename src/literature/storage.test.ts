import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearLiteratureRecords,
  LITERATURE_RECORDS_KEY,
  readLiteratureRecords,
  saveLiteratureRecord,
} from './storage'
import type { LiteratureRecord } from './types'

const record: LiteratureRecord = {
  id: 'one',
  profileId: 'p1',
  workId: 'w1',
  workVersion: '1',
  title: '테스트',
  playedAt: '2026-10-10T00:00:00Z',
  durationSec: 30,
  cpm: 10,
  keystrokes: 5,
  accuracy: 100,
  completedCount: 1,
  checks: 1,
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('문학 로컬 기록', () => {
  it('중복 완료 저장은 한 번만 하고 프로필별로 분리한다', () => {
    expect(saveLiteratureRecord(record)).toBe(true)
    expect(saveLiteratureRecord(record)).toBe(true)
    expect(readLiteratureRecords('p1').items).toHaveLength(1)
    expect(readLiteratureRecords('p2').items).toHaveLength(0)
  })
  it('최근 100회를 보관하고 기록 초기화는 다른 게임의 데이터를 보존한다', () => {
    localStorage.setItem('existing-game', 'preserve')
    for (let i = 0; i < 105; i++)
      saveLiteratureRecord({ ...record, id: String(i) })
    expect(readLiteratureRecords('p1').items).toHaveLength(100)
    expect(readLiteratureRecords('p1').items[0].id).toBe('104')
    clearLiteratureRecords()
    expect(readLiteratureRecords('p1').items).toHaveLength(0)
    expect(localStorage.getItem('existing-game')).toBe('preserve')
  })
  it('손상된 JSON/레코드를 덮어쓰지 않고 오류를 알린다', () => {
    for (const raw of ['bad json', '{}', '[{"id":"bad"}]']) {
      localStorage.setItem(LITERATURE_RECORDS_KEY, raw)
      expect(readLiteratureRecords('p1').error).toBe(true)
      expect(saveLiteratureRecord(record)).toBe(false)
      expect(localStorage.getItem(LITERATURE_RECORDS_KEY)).toBe(raw)
    }
  })
  it('읽기 차단·용량 초과에서 실패를 반환하고 재시도할 수 있다', () => {
    const read = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })
    expect(readLiteratureRecords('p1').error).toBe(true)
    expect(saveLiteratureRecord(record)).toBe(false)
    read.mockRestore()
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })
    expect(saveLiteratureRecord(record)).toBe(false)
    write.mockRestore()
    expect(saveLiteratureRecord(record)).toBe(true)
  })
})
