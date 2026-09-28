import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { TypingMode } from '../data/types'
import type { StoredRecord } from '../storage/records'

const MODE_LABELS: Readonly<Record<TypingMode, string>> = {
  position: '자리 연습',
  word: '낱말 연습',
  sentence: '짧은 문장 연습',
}

export interface PracticeResult {
  record: StoredRecord
  difference: number | null
  passed: boolean
  wrongLabels: string[]
}

interface ResultScreenProps {
  result: PracticeResult
  onMain: () => void
  onRecords: () => void
  onMistakes: () => void
}

export function ResultScreen({
  result,
  onMain,
  onRecords,
  onMistakes,
}: ResultScreenProps) {
  const { record } = result

  return (
    <PageShell
      title="연습 결과"
      eyebrow={MODE_LABELS[record.mode as TypingMode]}
    >
      <div className="result-layout">
        {record.isBest ? (
          <section className="celebration" aria-live="polite">
            <div className="confetti" aria-hidden="true">
              <span>●</span>
              <span>◆</span>
              <span>★</span>
              <span>●</span>
              <span>◆</span>
            </div>
            <span className="celebration__sticker" aria-hidden="true">
              🌟
            </span>
            <p className="eyebrow">새 스티커를 받았어요</p>
            <h2>최고 기록 갱신!</h2>
            <p>
              {result.difference === null
                ? '첫 기록을 멋지게 완성했어요.'
                : `이전 최고 기록보다 ${Math.round(result.difference)}점 높아요.`}
            </p>
          </section>
        ) : (
          <section className="celebration celebration--calm">
            <span className="celebration__sticker" aria-hidden="true">
              🙌
            </span>
            <h2>끝까지 해냈어요!</h2>
            <p>조금씩 연습하면 기록이 더 좋아질 거예요.</p>
          </section>
        )}

        <section className="result-card" aria-label="연습 지표">
          <ScoreBadge
            label="정확도"
            value={`${Math.round(record.accuracy)}%`}
          />
          {record.timeLimit ? (
            <>
              <ScoreBadge label="타수" value={`${Math.round(record.cpm)}타`} />
              <ScoreBadge
                label="점수"
                value={`${Math.round(record.score)}점`}
              />
            </>
          ) : (
            <ScoreBadge
              label="완료 개수"
              value={`${record.completedCount}개`}
            />
          )}
        </section>

        <section className="result-card result-card--message">
          <h2>
            {result.passed
              ? '✓ 다음 단계가 열렸어요!'
              : '한 번 더 연습해 볼까요?'}
          </h2>
          <p>
            {result.passed
              ? '메인 화면에서 다음 연습을 시작할 수 있어요.'
              : '정확도 기준을 넘으면 다음 단계가 열려요.'}
          </p>
        </section>

        {result.wrongLabels.length > 0 ? (
          <section className="mistake-summary">
            <h2>틀린 낱말과 문장</h2>
            <ul>
              {result.wrongLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <button
              className="button button--secondary"
              type="button"
              onClick={onMistakes}
            >
              다시 연습하기
            </button>
          </section>
        ) : null}

        <div className="button-row">
          <button
            className="button button--primary"
            type="button"
            onClick={onRecords}
          >
            내 기록 보기
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={onMain}
          >
            메인으로
          </button>
        </div>
      </div>
    </PageShell>
  )
}
