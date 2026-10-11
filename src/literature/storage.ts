import type { LiteratureRecord } from './types'

export const LITERATURE_RECORDS_KEY = 'hangul-typing-game-literature-v1'

function isRecord(value: unknown): value is LiteratureRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as LiteratureRecord
  return (
    ['id', 'profileId', 'workId', 'workVersion', 'title', 'playedAt'].every(
      (key) => typeof item[key as keyof LiteratureRecord] === 'string',
    ) &&
    [
      'durationSec',
      'cpm',
      'keystrokes',
      'accuracy',
      'completedCount',
      'checks',
    ].every((key) => {
      const number = item[key as keyof LiteratureRecord]
      return (
        typeof number === 'number' && Number.isFinite(number) && number >= 0
      )
    }) &&
    item.accuracy <= 100
  )
}

function readAll(): LiteratureRecord[] {
  const raw = localStorage.getItem(LITERATURE_RECORDS_KEY)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed) || !parsed.every(isRecord))
    throw new Error('문학 기록 형식 오류')
  return parsed
}

export function readLiteratureRecords(profileId: string) {
  try {
    return {
      items: readAll()
        .filter((item) => item.profileId === profileId)
        .reverse(),
      error: false,
    }
  } catch {
    return { items: [], error: true }
  }
}

export function saveLiteratureRecord(record: LiteratureRecord) {
  try {
    const items = readAll()
    if (!items.some(({ id }) => id === record.id)) {
      localStorage.setItem(
        LITERATURE_RECORDS_KEY,
        JSON.stringify([...items, record].slice(-100)),
      )
    }
    return true
  } catch {
    return false
  }
}

export function clearLiteratureRecords() {
  localStorage.removeItem(LITERATURE_RECORDS_KEY)
}
