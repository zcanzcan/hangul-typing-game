import type { StoredRecord } from '../storage/records'

const CLASS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CLASS_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

export interface ClassRoom {
  id: string
  classCode: string
  expiresAt: string
}

export interface ClassScore {
  id: string
  classId: string
  nickname: string
  score: number
  mode: StoredRecord['mode']
  stage: number
  playedAt: string
}

export interface PublishedEntry {
  scoreId: string
  editorToken: string
}

export interface ClassSession {
  classCode: string
  entries: Record<string, PublishedEntry>
}

export function normalizeClassCode(value: string) {
  return value.replace(/[\s-]+/g, '').toUpperCase()
}

export function isValidClassCode(value: string) {
  return CLASS_CODE_PATTERN.test(normalizeClassCode(value))
}

export function generateClassCode(randomValues?: Uint32Array) {
  const values = randomValues ?? crypto.getRandomValues(new Uint32Array(8))

  if (values.length < 8) {
    throw new Error('반 코드를 만들 난수 값이 부족합니다.')
  }

  return Array.from(values.slice(0, 8), (value) =>
    CLASS_CODE_ALPHABET.charAt(value % CLASS_CODE_ALPHABET.length),
  ).join('')
}

export function getBestShareableRecord(records: StoredRecord[]) {
  return records.reduce<StoredRecord | null>((best, record) => {
    if (!best) {
      return record
    }

    if (record.score !== best.score) {
      return record.score > best.score ? record : best
    }

    return record.playedAt > best.playedAt ? record : best
  }, null)
}

export function sortClassScores(scores: ClassScore[]) {
  return [...scores].sort(
    (left, right) =>
      right.score - left.score || left.playedAt.localeCompare(right.playedAt),
  )
}
