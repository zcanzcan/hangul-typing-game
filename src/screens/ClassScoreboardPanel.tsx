import { useEffect, useMemo, useState } from 'react'

import {
  clearClassSession,
  getBestShareableRecord,
  isClassScoreboardConfigured,
  isValidClassCode,
  loadClassSession,
  normalizeClassCode,
  saveClassSession,
  sortClassScores,
  type ClassRoom,
  type ClassScore,
  type ClassSession,
} from '../class-scoreboard'
import type { Profile, Record as PracticeRecord } from '../data/types'
import type { StoredRecord } from '../storage/records'

const MODE_LABELS: Readonly<Record<PracticeRecord['mode'], string>> = {
  position: '자리 연습',
  word: '낱말 연습',
  sentence: '문장 연습',
  minigame: '미니게임',
  slang: '유행어 게임',
}

const loadScoreboardApi = () => import('../class-scoreboard/api')

interface ClassScoreboardPanelProps {
  profile: Profile
  records: StoredRecord[]
}

export function ClassScoreboardPanel({
  profile,
  records,
}: ClassScoreboardPanelProps) {
  const [session, setSession] = useState<ClassSession | null>(() =>
    loadClassSession(),
  )
  const [room, setRoom] = useState<ClassRoom | null>(null)
  const [scores, setScores] = useState<ClassScore[]>([])
  const [joinCode, setJoinCode] = useState(session?.classCode ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(Boolean(session))
  const bestRecord = useMemo(() => getBestShareableRecord(records), [records])
  const standings = useMemo(() => sortClassScores(scores), [scores])
  const sessionClassCode = session?.classCode

  useEffect(() => {
    if (!sessionClassCode || !isClassScoreboardConfigured) {
      return
    }

    let cancelled = false

    void loadScoreboardApi()
      .then(async ({ findClassRoom, getClassScores }) => {
        const foundRoom = await findClassRoom(sessionClassCode)
        if (!foundRoom) {
          clearClassSession()
          if (!cancelled) {
            setSession(null)
            setRoom(null)
            setScores([])
            setError('반 코드가 만료되었거나 존재하지 않아요.')
          }
          return
        }

        const nextScores = await getClassScores(foundRoom)
        if (!cancelled) {
          setRoom(foundRoom)
          setScores(nextScores)
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : '반 점수판을 불러오지 못했어요.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [sessionClassCode])

  async function connect(nextRoom: ClassRoom) {
    const { getClassScores } = await loadScoreboardApi()
    const nextSession: ClassSession = {
      classCode: nextRoom.classCode,
      entries: session?.classCode === nextRoom.classCode ? session.entries : {},
    }
    saveClassSession(nextSession)
    setSession(nextSession)
    setRoom(nextRoom)
    setJoinCode(nextRoom.classCode)
    setScores(await getClassScores(nextRoom))
  }

  async function createRoom() {
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const { createClassRoom } = await loadScoreboardApi()
      const nextRoom = await createClassRoom()
      await connect(nextRoom)
      setMessage(`새 반 ${nextRoom.classCode}을 만들었어요.`)
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '반을 만들지 못했어요.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function joinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedCode = normalizeClassCode(joinCode)

    if (!isValidClassCode(normalizedCode)) {
      setError('반 코드는 숫자와 영문 대문자 8자리예요.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const { findClassRoom } = await loadScoreboardApi()
      const foundRoom = await findClassRoom(normalizedCode)
      if (!foundRoom) {
        setError('반 코드를 찾지 못했어요. 코드를 다시 확인해 주세요.')
        return
      }

      await connect(foundRoom)
      setMessage(`${foundRoom.classCode} 반에 들어왔어요.`)
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '반에 들어가지 못했어요.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function refreshScores() {
    if (!room) {
      return
    }

    setBusy(true)
    setError('')
    try {
      const { getClassScores } = await loadScoreboardApi()
      setScores(await getClassScores(room))
      setMessage('최신 점수를 불러왔어요.')
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '점수를 불러오지 못했어요.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function publishBestScore() {
    if (!room || !session || !bestRecord) {
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { getClassScores, publishClassScore } = await loadScoreboardApi()
      const published = await publishClassScore({
        room,
        nickname: profile.nickname,
        record: bestRecord,
        published: session.entries[bestRecord.id],
      })
      const nextSession = {
        ...session,
        entries: { ...session.entries, [bestRecord.id]: published },
      }
      saveClassSession(nextSession)
      setSession(nextSession)
      setScores(await getClassScores(room))
      setMessage(`${profile.nickname}님의 최고 점수를 올렸어요.`)
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '점수를 올리지 못했어요.',
      )
    } finally {
      setBusy(false)
    }
  }

  function leaveRoom() {
    clearClassSession()
    setSession(null)
    setRoom(null)
    setScores([])
    setJoinCode('')
    setMessage('이 기기에서 반 연결을 해제했어요.')
    setError('')
  }

  if (!isClassScoreboardConfigured) {
    return (
      <section className="class-scoreboard" role="tabpanel">
        <div className="class-scoreboard__notice">
          <span aria-hidden="true">🔌</span>
          <div>
            <h2>반 점수판 연결이 필요해요</h2>
            <p>배포 환경에 Supabase 공개 환경변수를 설정해 주세요.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="class-scoreboard" role="tabpanel">
      {room ? (
        <>
          <div className="class-scoreboard__hero">
            <div>
              <p className="eyebrow">우리 반 코드</p>
              <h2>{room.classCode}</h2>
              <p>
                {new Date(room.expiresAt).toLocaleDateString('ko-KR')}까지
                사용할 수 있어요.
              </p>
            </div>
            <div className="button-row">
              <button
                className="button button--pixel"
                type="button"
                onClick={() => void refreshScores()}
                disabled={busy}
              >
                새로고침
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={leaveRoom}
                disabled={busy}
              >
                다른 반 입력
              </button>
            </div>
          </div>

          <div className="class-scoreboard__share">
            <div>
              <p className="eyebrow">MY BEST</p>
              <h2>
                {bestRecord
                  ? `${Math.round(bestRecord.score)}점 · ${MODE_LABELS[bestRecord.mode]}`
                  : '아직 올릴 기록이 없어요'}
              </h2>
              <p>반에는 별명, 점수, 모드, 단계와 기록 시각만 전송돼요.</p>
            </div>
            <button
              className="button button--pixel"
              type="button"
              onClick={() => void publishBestScore()}
              disabled={busy || !bestRecord}
            >
              최고 점수 올리기
            </button>
          </div>

          {standings.length === 0 ? (
            <div className="empty-state class-scoreboard__empty">
              <span aria-hidden="true">🏫</span>
              <h3>아직 올라온 점수가 없어요</h3>
              <p>첫 번째 점수를 올려 반 점수판을 시작해 보세요.</p>
            </div>
          ) : (
            <ol className="class-ranking">
              {standings.map((standing, index) => (
                <li key={standing.id}>
                  <span className="class-ranking__rank">{index + 1}</span>
                  <div>
                    <strong>{standing.nickname}</strong>
                    <small>
                      {MODE_LABELS[standing.mode]} · {standing.stage}단계
                    </small>
                  </div>
                  <b>{standing.score.toLocaleString('ko-KR')}점</b>
                  <time dateTime={standing.playedAt}>
                    {new Date(standing.playedAt).toLocaleDateString('ko-KR')}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <div className="class-scoreboard__join">
          <div>
            <p className="eyebrow">ONLINE CLASS</p>
            <h2>반 점수판 연결</h2>
            <p>
              선생님이 새 반을 만들거나, 공유받은 8자리 반 코드를 입력해요. 반
              정보는 30일 뒤 만료돼요.
            </p>
          </div>
          <button
            className="button button--pixel"
            type="button"
            onClick={() => void createRoom()}
            disabled={busy}
          >
            새 반 만들기
          </button>
          <form onSubmit={(event) => void joinRoom(event)}>
            <label className="field">
              <span>반 코드</span>
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                maxLength={9}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="ABCD2345"
                aria-describedby="class-code-help"
                required
              />
            </label>
            <small id="class-code-help">영문 대문자와 숫자 8자리</small>
            <button
              className="button button--secondary"
              type="submit"
              disabled={busy}
            >
              반 코드로 들어가기
            </button>
          </form>
        </div>
      )}

      {busy ? <p role="status">반 점수판을 연결하고 있어요…</p> : null}
      {message && !busy ? <p role="status">{message}</p> : null}
      {error ? (
        <p className="feedback feedback--wrong" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
