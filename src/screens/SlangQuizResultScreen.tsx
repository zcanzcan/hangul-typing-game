import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { StoredRecord } from '../storage/records'

export interface SlangQuizResult {
  record: StoredRecord
  difference: number | null
  correctCount: number
  questionCount: number
  maxStreak: number
  hintCount: number
}

interface SlangQuizResultScreenProps {
  result: SlangQuizResult
  onMain: () => void
  onReplay: () => void
  onRecords: () => void
  onMistakes: () => void
}

export function SlangQuizResultScreen({
  result,
  onMain,
  onReplay,
  onRecords,
  onMistakes,
}: SlangQuizResultScreenProps) {
  const { record } = result

  return (
    <PageShell
      title="요즘 말 스피드 퀴즈 결과"
      eyebrow="PIXEL SPEED QUIZ"
      theme="pixel"
    >
      <div className="slang-result-layout">
        <section className="pixel-celebration" aria-live="polite">
          <span aria-hidden="true">{record.isBest ? '🏆' : '⚡'}</span>
          <h2>{record.isBest ? '최고 기록 갱신!' : '퀴즈 도전 완료!'}</h2>
          <p>
            {result.difference === null
              ? '첫 스피드 퀴즈 기록을 남겼어요.'
              : `이전 최고 기록보다 ${Math.round(result.difference)}점 높아요.`}
          </p>
        </section>

        <section className="result-card" aria-label="스피드 퀴즈 지표">
          <ScoreBadge label="점수" value={`${Math.round(record.score)}점`} />
          <ScoreBadge
            label="정답"
            value={`${result.correctCount}/${result.questionCount}`}
          />
          <ScoreBadge
            label="정확도"
            value={`${Math.round(record.accuracy)}%`}
          />
          <ScoreBadge label="최대 콤보" value={`${result.maxStreak}`} />
          <ScoreBadge label="힌트 사용" value={`${result.hintCount}개`} />
          <ScoreBadge label="타수" value={`${Math.round(record.cpm)}타`} />
        </section>

        <div className="button-row">
          <button
            className="button button--pixel"
            type="button"
            onClick={onReplay}
          >
            한 판 더
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={onMistakes}
          >
            틀린 유행어 복습
          </button>
          <button
            className="button button--secondary"
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
