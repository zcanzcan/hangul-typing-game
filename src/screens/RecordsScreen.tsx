import { useEffect, useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { Profile, TypingMode } from '../data/types'
import { getRecords, type StoredRecord } from '../storage/records'

const MODE_LABELS: Readonly<Record<TypingMode, string>> = {
  position: '자리 연습',
  word: '낱말 연습',
  sentence: '짧은 문장',
}

interface RecordsScreenProps {
  profile: Profile
  onBack: () => void
  onMistakes: () => void
}

function sortByPlayedAt(records: StoredRecord[]) {
  return [...records].sort((a, b) => b.playedAt.localeCompare(a.playedAt))
}

export function RecordsScreen({
  profile,
  onBack,
  onMistakes,
}: RecordsScreenProps) {
  const [records, setRecords] = useState<StoredRecord[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void getRecords(profile.id).then((savedRecords) => {
      if (!cancelled) {
        setRecords(sortByPlayedAt(savedRecords))
      }
    })

    return () => {
      cancelled = true
    }
  }, [profile.id])

  if (!records) {
    return (
      <PageShell title="내 기록" onBack={onBack} theme="pixel">
        <p className="loading-message">기록을 불러오는 중이에요…</p>
      </PageShell>
    )
  }

  const bestRecords = records.filter(({ isBest }) => isBest)
  const timedRecords = records.filter(({ timeLimit }) => timeLimit)
  const untimedRecords = records.filter(({ timeLimit }) => !timeLimit)

  return (
    <PageShell
      title="내 기록"
      eyebrow={profile.nickname}
      onBack={onBack}
      theme="pixel"
    >
      <div className="records-layout">
        {records.length === 0 ? (
          <section className="empty-state">
            <span aria-hidden="true">🏁</span>
            <h2>아직 기록이 없어요</h2>
            <p>연습 한 판을 마치면 여기에 기록이 쌓여요.</p>
          </section>
        ) : (
          <>
            <section className="records-section">
              <p className="eyebrow">BEST SCORE</p>
              <h2>모드별 최고 기록</h2>
              <div className="record-grid">
                {bestRecords.map((record) => (
                  <article className="record-card" key={record.id}>
                    <strong>{MODE_LABELS[record.mode as TypingMode]}</strong>
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
          </>
        )}

        <button
          className="button button--pixel"
          type="button"
          onClick={onMistakes}
        >
          틀린 낱말 다시 연습
        </button>
      </div>
    </PageShell>
  )
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
            <span>{MODE_LABELS[record.mode as TypingMode]}</span>
            <strong>{Math.round(record.accuracy)}%</strong>
            <small>
              {new Date(record.playedAt).toLocaleDateString('ko-KR')}
            </small>
          </li>
        ))}
      </ol>
    </section>
  )
}
