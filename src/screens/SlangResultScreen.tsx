import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { StoredRecord } from '../storage/records'

export interface SlangGameResult {
  record: StoredRecord
  difference: number | null
  correctMeaningCount: number
  typingCorrectCount: number
}

interface SlangResultScreenProps {
  result: SlangGameResult
  onMain: () => void
  onReplay: () => void
  onRecords: () => void
}

export function SlangResultScreen({
  result,
  onMain,
  onReplay,
  onRecords,
}: SlangResultScreenProps) {
  return (
    <PageShell title="유행어 게임 결과" eyebrow="GAME CLEAR" theme="pixel">
      <div className="slang-result-layout">
        <section className="pixel-result-hero" aria-live="polite">
          <span aria-hidden="true">{result.record.isBest ? '🏆' : '🕹️'}</span>
          <p className="eyebrow">
            {result.record.isBest ? 'NEW HIGH SCORE' : 'SCORE BOARD'}
          </p>
          <h2>{Math.round(result.record.score)}점</h2>
          <p>
            {result.difference === null
              ? '첫 유행어 게임 기록을 만들었어요!'
              : result.record.isBest
                ? `이전 최고 기록보다 ${Math.round(result.difference)}점 높아요.`
                : '다음 판에는 최고 기록에 도전해 보세요.'}
          </p>
        </section>

        <section className="pixel-result-stats" aria-label="유행어 게임 지표">
          <ScoreBadge
            label="뜻 정답"
            value={`${result.correctMeaningCount}/10`}
          />
          <ScoreBadge
            label="입력 성공"
            value={`${result.typingCorrectCount}개`}
          />
          <ScoreBadge
            label="정확도"
            value={`${Math.round(result.record.accuracy)}%`}
          />
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
            className="button button--pixel"
            type="button"
            onClick={onRecords}
          >
            점수판 보기
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
