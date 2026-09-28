import { createStore, del, get, set } from 'idb-keyval'

import type { Record } from '../data/types'
import { recordPracticeTime } from '../goals'

const recordStore = createStore('hangul-typing-game-records', 'records')
const RECORDS_KEY = 'items'

export interface StoredRecord extends Record {
  timeLimit: boolean
  completedCount: number
}

export interface SaveRecordResult {
  record: StoredRecord
  previousBest: number | null
  difference: number | null
}

export async function getAllRecords() {
  return (await get<StoredRecord[]>(RECORDS_KEY, recordStore)) ?? []
}

function getRecordValue(record: StoredRecord) {
  return record.timeLimit
    ? record.score
    : record.accuracy * 1_000 + record.completedCount
}

export async function getRecords(profileId: string) {
  const records = await getAllRecords()
  return records.filter((record) => record.profileId === profileId)
}

export async function savePracticeRecord(
  nextRecord: Omit<StoredRecord, 'isBest'>,
): Promise<SaveRecordResult> {
  const records = await getAllRecords()
  const sameStageRecords = records.filter(
    (record) =>
      record.profileId === nextRecord.profileId &&
      record.mode === nextRecord.mode &&
      record.stage === nextRecord.stage &&
      record.game === nextRecord.game &&
      record.pack === nextRecord.pack &&
      record.timeLimit === nextRecord.timeLimit,
  )
  const previousBestRecord = sameStageRecords.reduce<StoredRecord | null>(
    (best, record) =>
      !best || getRecordValue(record) > getRecordValue(best) ? record : best,
    null,
  )
  const isBest =
    previousBestRecord === null ||
    getRecordValue({ ...nextRecord, isBest: false }) >
      getRecordValue(previousBestRecord)

  const record: StoredRecord = { ...nextRecord, isBest }
  const updatedRecords = isBest
    ? records.map((savedRecord) =>
        sameStageRecords.some(({ id }) => id === savedRecord.id)
          ? { ...savedRecord, isBest: false }
          : savedRecord,
      )
    : records

  updatedRecords.push(record)
  await set(RECORDS_KEY, updatedRecords, recordStore)
  recordPracticeTime(record.profileId, record.durationSec, record.playedAt)

  const previousBest = previousBestRecord?.score ?? null

  return {
    record,
    previousBest,
    difference:
      isBest && previousBest !== null ? record.score - previousBest : null,
  }
}

export async function clearRecords() {
  await del(RECORDS_KEY, recordStore)
}
