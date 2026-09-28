import { createClient } from '@supabase/supabase-js'

import type { StoredRecord } from '../storage/records'
import { supabaseKey, supabaseUrl } from './config'
import {
  generateClassCode,
  normalizeClassCode,
  type ClassRoom,
  type ClassScore,
  type PublishedEntry,
} from './model'

function scoreboardClient(classCode: string, editorToken?: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-typing-class-code': normalizeClassCode(classCode),
        ...(editorToken ? { 'x-typing-editor-token': editorToken } : undefined),
      },
    },
  })
}

function mapRoom(row: {
  id: string
  class_code: string
  expires_at: string
}): ClassRoom {
  return {
    id: row.id,
    classCode: row.class_code,
    expiresAt: row.expires_at,
  }
}

function mapScore(row: {
  id: string
  class_id: string
  nickname: string
  score: number
  mode: StoredRecord['mode']
  stage: number
  played_at: string
}): ClassScore {
  return {
    id: row.id,
    classId: row.class_id,
    nickname: row.nickname,
    score: row.score,
    mode: row.mode,
    stage: row.stage,
    playedAt: row.played_at,
  }
}

export async function createClassRoom() {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const classCode = generateClassCode()
    const { data, error } = await scoreboardClient(classCode)
      .from('typing_game_classes')
      .insert({ class_code: classCode })
      .select('id, class_code, expires_at')
      .single()

    if (!error && data) {
      return mapRoom(data)
    }

    if (error?.code !== '23505') {
      throw new Error('반을 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  throw new Error('새 반 코드를 만들지 못했어요. 다시 시도해 주세요.')
}

export async function findClassRoom(classCode: string) {
  const normalizedCode = normalizeClassCode(classCode)
  const { data, error } = await scoreboardClient(normalizedCode)
    .from('typing_game_classes')
    .select('id, class_code, expires_at')
    .eq('class_code', normalizedCode)
    .maybeSingle()

  if (error) {
    throw new Error('반을 찾는 중 문제가 생겼어요. 다시 시도해 주세요.')
  }

  return data ? mapRoom(data) : null
}

export async function getClassScores(room: ClassRoom) {
  const { data, error } = await scoreboardClient(room.classCode)
    .from('typing_game_scores')
    .select('id, class_id, nickname, score, mode, stage, played_at')
    .eq('class_id', room.id)
    .order('score', { ascending: false })
    .order('played_at', { ascending: true })
    .limit(100)

  if (error) {
    throw new Error('반 점수판을 불러오지 못했어요.')
  }

  return (data ?? []).map(mapScore)
}

interface PublishScoreInput {
  room: ClassRoom
  nickname: string
  record: StoredRecord
  published?: PublishedEntry
}

export async function publishClassScore({
  room,
  nickname,
  record,
  published,
}: PublishScoreInput): Promise<PublishedEntry> {
  const editorToken = published?.editorToken ?? crypto.randomUUID()
  const client = scoreboardClient(room.classCode, editorToken)
  const values = {
    nickname: nickname.trim(),
    score: Math.max(0, Math.round(record.score)),
    mode: record.mode,
    stage: record.stage,
    played_at: record.playedAt,
  }

  if (published) {
    const { data, error } = await client
      .from('typing_game_scores')
      .update(values)
      .eq('id', published.scoreId)
      .eq('class_id', room.id)
      .select('id')
      .maybeSingle()

    if (error) {
      throw new Error('점수를 수정하지 못했어요.')
    }

    if (data) {
      return published
    }
  }

  const { data, error } = await client
    .from('typing_game_scores')
    .insert({ class_id: room.id, ...values })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('점수를 올리지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  return { scoreId: data.id, editorToken }
}
