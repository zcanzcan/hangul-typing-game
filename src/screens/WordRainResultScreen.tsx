import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { MinigamePack } from '../data/types'
import type { WordRainItem } from '../games/wordRain'
import type { StoredRecord } from '../storage/records'

const PACK_LABELS: Readonly<Record<MinigamePack, string>> = {
  standard: '표준어',
  slang: '요즘 말',
  mixed: '섞어서',
}

export interface WordRainResult {
  record: StoredRecord
  difference: number | null
  removedCount: number
  missedCount: number
  maxCombo: number
  slangItems: WordRainItem[]
}

interface WordRainResultScreenProps {
  result: WordRainResult
  onMain: () => void
  onReplay: () => void
  onRecords: () => void
}

export function WordRainResultScreen({
  result,
  onMain,
  onReplay,
  onRecords,
}: WordRainResultScreenProps) {
  const { record } = result
  const pack = record.pack ?? 'standard'

  return (
    <PageShell title="낱말 비 결과" eyebrow={PACK_LABELS[pack]}>
      <div className="result-layout">
        <section className="celebration" aria-live="polite">
          <span className="celebration__sticker" aria-hidden="true">
            {record.isBest ? '🌟' : '🌱'}
          </span>
          <p className="eyebrow">
            {record.isBest ? '새 스티커를 받았어요' : '새싹 지키기 완료'}
          </p>
          <h2>{record.isBest ? '최고 기록 갱신!' : '비를 잘 막았어요!'}</h2>
          <p>
            {result.difference === null
              ? '첫 낱말 비 기록을 남겼어요.'
              : `이전 최고 기록보다 ${Math.round(result.difference)}점 높아요.`}
          </p>
        </section>

        <section className="result-card" aria-label="낱말 비 지표">
          <ScoreBadge label="점수" value={`${Math.round(record.score)}점`} />
          <ScoreBadge label="없앤 낱말" value={`${result.removedCount}개`} />
          <ScoreBadge label="놓친 낱말" value={`${result.missedCount}개`} />
          <ScoreBadge label="최대 콤보" value={`${result.maxCombo}`} />
          <ScoreBadge label="타수" value={`${Math.round(record.cpm)}타`} />
          <ScoreBadge
            label="정확도"
            value={`${Math.round(record.accuracy)}%`}
          />
          <ScoreBadge
            label="버틴 시간"
            value={`${Math.round(record.durationSec)}초`}
          />
        </section>

        {result.slangItems.length > 0 ? (
          <section className="word-rain-slang-results">
            <p className="eyebrow">오늘 내린 요즘 말</p>
            <h2>표준어와 함께 익혀요</h2>
            <div className="word-rain-slang-grid">
              {result.slangItems.map((item) => (
                <article key={item.id}>
                  <strong>{item.text}</strong>
                  <p>{item.meaning}</p>
                  {item.standardForm ? (
                    <small>비슷한 표준어: {item.standardForm}</small>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="button-row">
          <button
            className="button button--primary"
            type="button"
            onClick={onReplay}
          >
            한 판 더
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
