import { useEffect, useMemo, useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { AgeGroup, Profile, Record as PracticeRecord } from '../data/types'
import { getWordStageDefinition, type WordStage } from '../practice/word-stages'
import { buildFamilyStandings } from '../records/family-scoreboard'
import { getProfiles } from '../storage/profile'
import { getAllRecords, type StoredRecord } from '../storage/records'

const MODE_LABELS: Readonly<Record<PracticeRecord['mode'], string>> = {
  position: '자리 연습',
  word: '낱말 연습',
  sentence: '짧은 문장',
  minigame: '낱말 미니게임',
  slang: '유행어 카드게임',
}

const PACK_LABELS = {
  standard: '표준어',
  slang: '요즘 말',
  mixed: '섞어서',
} as const

function getRecordLabel(record: StoredRecord) {
  if (record.mode === 'word' && record.stage >= 1 && record.stage <= 3) {
    const definition = getWordStageDefinition(record.stage as WordStage)
    return `낱말 연습 · ${record.stage}단계 ${definition.title}`
  }

  if (record.mode === 'minigame' && record.game === 'wordRain') {
    return `낱말 비 · ${PACK_LABELS[record.pack ?? 'standard']}`
  }

  if (record.mode === 'minigame' && record.game === 'slangQuiz') {
    return '요즘 말 스피드 퀴즈'
  }

  if (record.mode === 'minigame' && record.game === 'tower') {
    return `낱말 탑 · ${PACK_LABELS[record.pack ?? 'standard']}${record.timeLimit ? ' · 60초' : ''}`
  }

  return MODE_LABELS[record.mode]
}

interface RecordsScreenProps {
  profile: Profile
  onBack: () => void
  onMistakes: () => void
  onAddProfile: (nickname: string, ageGroup: AgeGroup) => Profile
  onSelectProfile: (profileId: string) => void
}

function sortByPlayedAt(records: StoredRecord[]) {
  return [...records].sort((a, b) => b.playedAt.localeCompare(a.playedAt))
}

export function RecordsScreen({
  profile,
  onBack,
  onMistakes,
  onAddProfile,
  onSelectProfile,
}: RecordsScreenProps) {
  const [allRecords, setAllRecords] = useState<StoredRecord[] | null>(null)
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [tab, setTab] = useState<'mine' | 'family'>('mine')
  const [nickname, setNickname] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('kid')
  const [familyMessage, setFamilyMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    void getAllRecords().then((savedRecords) => {
      if (!cancelled) {
        setAllRecords(sortByPlayedAt(savedRecords))
        setProfiles(getProfiles())
      }
    })

    return () => {
      cancelled = true
    }
  }, [profile.id])

  const records = useMemo(
    () => allRecords?.filter(({ profileId }) => profileId === profile.id) ?? [],
    [allRecords, profile.id],
  )
  const standings = useMemo(
    () => buildFamilyStandings(profiles, allRecords ?? []),
    [allRecords, profiles],
  )

  function addFamilyMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedNickname = nickname.trim()

    if (trimmedNickname === '') {
      return
    }

    if (
      profiles.some(
        (member) =>
          member.nickname.toLowerCase() === trimmedNickname.toLowerCase(),
      )
    ) {
      setFamilyMessage('같은 별명이 이미 있어요.')
      return
    }

    const member = onAddProfile(trimmedNickname, ageGroup)
    setProfiles((current) => [...current, member])
    setNickname('')
    setFamilyMessage(`${member.nickname} 가족을 추가했어요.`)
  }

  if (!allRecords) {
    return (
      <PageShell title="점수판" onBack={onBack} theme="pixel">
        <p className="loading-message">기록을 불러오는 중이에요…</p>
      </PageShell>
    )
  }

  const bestRecords = records.filter(({ isBest }) => isBest)
  const gameRecords = records.filter(({ mode }) =>
    ['minigame', 'slang'].includes(mode),
  )
  const timedRecords = records.filter(
    ({ mode, timeLimit }) => !['minigame', 'slang'].includes(mode) && timeLimit,
  )
  const untimedRecords = records.filter(
    ({ mode, timeLimit }) =>
      !['minigame', 'slang'].includes(mode) && !timeLimit,
  )

  return (
    <PageShell
      title="점수판"
      eyebrow={profile.nickname}
      onBack={onBack}
      theme="pixel"
    >
      <div className="records-layout">
        <div
          className="scoreboard-tabs"
          role="tablist"
          aria-label="점수판 종류"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'mine'}
            onClick={() => setTab('mine')}
          >
            내 기록
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'family'}
            onClick={() => setTab('family')}
          >
            가족 점수판
          </button>
        </div>

        {tab === 'mine' ? (
          <section className="scoreboard-panel" role="tabpanel">
            <h2 className="visually-hidden">내 기록</h2>
            {records.length === 0 ? (
              <div className="empty-state">
                <span aria-hidden="true">🏁</span>
                <h3>아직 기록이 없어요</h3>
                <p>연습 한 판을 마치면 여기에 기록이 쌓여요.</p>
              </div>
            ) : (
              <>
                <section className="records-section">
                  <p className="eyebrow">BEST SCORE</p>
                  <h2>모드별 최고 기록</h2>
                  <div className="record-grid">
                    {bestRecords.map((record) => (
                      <article className="record-card" key={record.id}>
                        <strong>{getRecordLabel(record)}</strong>
                        <span>{Math.round(record.accuracy)}% 정확도</span>
                        <b>
                          {record.timeLimit
                            ? `${Math.round(record.score)}점`
                            : `${record.completedCount}개 완료`}
                        </b>
                      </article>
                    ))}
                  </div>
                </section>

                <RecordList
                  title="최근 기록 · 시간 제한 있음"
                  records={timedRecords}
                />
                <RecordList
                  title="최근 기록 · 시간 제한 없음"
                  records={untimedRecords}
                />
                <RecordList title="게임 점수" records={gameRecords} />
              </>
            )}

            <button
              className="button button--pixel"
              type="button"
              onClick={onMistakes}
            >
              틀린 낱말 다시 연습
            </button>
          </section>
        ) : (
          <section className="family-scoreboard" role="tabpanel">
            <div className="family-scoreboard__heading">
              <div>
                <p className="eyebrow">한 기기에서 함께</p>
                <h2>가족 최고 기록</h2>
                <p>각자 별명으로 연습하고 최고 점수와 정확도를 비교해요.</p>
              </div>
            </div>

            <ol className="family-ranking">
              {standings.map((standing, index) => (
                <li
                  className={
                    standing.profile.id === profile.id ? 'is-active' : ''
                  }
                  key={standing.profile.id}
                >
                  <span className="family-ranking__rank">{index + 1}</span>
                  <div>
                    <strong>{standing.profile.nickname}</strong>
                    <small>
                      {AGE_LABELS[standing.profile.ageGroup]} ·{' '}
                      {standing.playCount}판
                    </small>
                  </div>
                  <dl>
                    <div>
                      <dt>최고 점수</dt>
                      <dd>{Math.round(standing.bestScore)}점</dd>
                    </div>
                    <div>
                      <dt>최고 정확도</dt>
                      <dd>{Math.round(standing.bestAccuracy)}%</dd>
                    </div>
                    <div>
                      <dt>최고 타수</dt>
                      <dd>{Math.round(standing.bestCpm)}타</dd>
                    </div>
                  </dl>
                  {standing.profile.id === profile.id ? (
                    <span className="family-ranking__active">현재 사용자</span>
                  ) : (
                    <button
                      className="button button--pixel"
                      type="button"
                      onClick={() => onSelectProfile(standing.profile.id)}
                    >
                      이 별명으로 시작
                    </button>
                  )}
                </li>
              ))}
            </ol>

            <form className="family-add-form" onSubmit={addFamilyMember}>
              <div>
                <p className="eyebrow">NEW PLAYER</p>
                <h2>가족 추가</h2>
                <p>실명 대신 이 기기에서 사용할 별명을 적어 주세요.</p>
              </div>
              <label className="field">
                <span>별명</span>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={12}
                  autoComplete="off"
                  required
                />
              </label>
              <label className="field">
                <span>연령대</span>
                <select
                  aria-label="가족 연령대"
                  value={ageGroup}
                  onChange={(event) =>
                    setAgeGroup(event.target.value as AgeGroup)
                  }
                >
                  {(Object.keys(AGE_LABELS) as AgeGroup[]).map((value) => (
                    <option value={value} key={value}>
                      {AGE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button--pixel" type="submit">
                가족 추가하기
              </button>
              {familyMessage ? <p role="status">{familyMessage}</p> : null}
            </form>
          </section>
        )}
      </div>
    </PageShell>
  )
}

const AGE_LABELS: Readonly<Record<AgeGroup, string>> = {
  kid: '초등학생',
  adult: '성인',
  senior: '어르신',
}

function RecordList({
  title,
  records,
}: {
  title: string
  records: StoredRecord[]
}) {
  if (records.length === 0) {
    return null
  }

  return (
    <section className="records-section">
      <h2>{title}</h2>
      <ol className="record-list">
        {records.slice(0, 8).map((record) => (
          <li key={record.id}>
            <span>{getRecordLabel(record)}</span>
            <strong>
              {['minigame', 'slang'].includes(record.mode)
                ? `${Math.round(record.score)}점`
                : `${Math.round(record.accuracy)}%`}
            </strong>
            <small>
              {new Date(record.playedAt).toLocaleDateString('ko-KR')}
            </small>
          </li>
        ))}
      </ol>
    </section>
  )
}
