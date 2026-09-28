import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { MinigamePack } from '../data/types'
import type { StoredRecord } from '../storage/records'
import type { TowerBlock, TowerEndReason } from './TowerGameScreen'

const PACK_LABELS: Readonly<Record<MinigamePack, string>> = {
  standard: '표준어',
  slang: '요즘 말',
  mixed: '섞어서',
}

export interface TowerResult {
  record: StoredRecord
  difference: number | null
  blocks: TowerBlock[]
  maxStreak: number
  shakes: number
  recoveredCount: number
  endReason: TowerEndReason
}

interface TowerResultScreenProps {
  result: TowerResult
  onMain: () => void
  onReplay: () => void
  onRecords: () => void
  onMistakes: () => void
}

const END_MESSAGES: Readonly<Record<TowerEndReason, string>> = {
  collapsed: '탑이 무너졌지만 쌓은 낱말은 그대로 기억에 남아요.',
  time: '60초 동안 멋진 낱말 탑을 완성했어요.',
  stopped: '원하는 높이에서 탑 쌓기를 잘 마쳤어요.',
}

export function TowerResultScreen({
  result,
  onMain,
  onReplay,
  onRecords,
  onMistakes,
}: TowerResultScreenProps) {
  const { record } = result
  const [selectedBlock, setSelectedBlock] = useState<TowerBlock | null>(null)

  return (
    <PageShell
      title="낱말 탑 결과"
      eyebrow={`${PACK_LABELS[record.pack ?? 'standard']} · ${record.timeLimit ? '60초 도전' : '시간 제한 없음'}`}
      theme="candy"
    >
      <div className="tower-result-layout">
        <section className="celebration tower-celebration">
          <span className="celebration__sticker" aria-hidden="true">
            {result.endReason === 'collapsed' ? '🏚️' : '🏰'}
          </span>
          <h2>{record.completedCount}층까지 쌓았어요!</h2>
          <p>{END_MESSAGES[result.endReason]}</p>
          {record.isBest ? <strong>새 최고 기록이에요!</strong> : null}
          {result.difference !== null && result.difference > 0 ? (
            <p>이전 최고 기록보다 +{Math.round(result.difference)}점</p>
          ) : null}
        </section>

        <section className="result-grid" aria-label="낱말 탑 결과 점수표">
          <ScoreBadge label="완성한 층" value={`${record.completedCount}층`} />
          <ScoreBadge
            label="정확도"
            value={`${Math.round(record.accuracy)}%`}
          />
          <ScoreBadge label="점수" value={`${Math.round(record.score)}점`} />
          <ScoreBadge label="최대 연속" value={`${result.maxStreak}개`} />
          <ScoreBadge label="회복" value={`${result.recoveredCount}번`} />
          <ScoreBadge label="타수" value={`${Math.round(record.cpm)}타`} />
          <ScoreBadge
            label="진행 시간"
            value={`${Math.round(record.durationSec)}초`}
          />
        </section>

        <section className="tower-tour" aria-labelledby="tower-tour-title">
          <p className="eyebrow">MY WORD TOWER</p>
          <h2 id="tower-tour-title">내 탑 둘러보기</h2>
          {result.blocks.length === 0 ? (
            <p>아직 쌓은 블록이 없어요. 한 판 더 도전해 봐요.</p>
          ) : (
            <div className="tower-tour-grid">
              {result.blocks.map((block) => (
                <button
                  type="button"
                  key={block.blockId}
                  className={`tower-block tower-block--${block.kind}`}
                  onClick={() => setSelectedBlock(block)}
                  aria-label={`${block.floor}층 ${block.text} 뜻 보기`}
                >
                  <small>{block.floor}층</small>
                  <strong>{block.text}</strong>
                </button>
              ))}
            </div>
          )}
          {selectedBlock ? (
            <article className="tower-tour-meaning" aria-live="polite">
              <strong>{selectedBlock.text}</strong>
              <p>{selectedBlock.meaning || '뜻을 준비하고 있어요.'}</p>
              {selectedBlock.example ? (
                <small>예: {selectedBlock.example}</small>
              ) : null}
              {selectedBlock.standardForm ? (
                <small>비슷한 표준어: {selectedBlock.standardForm}</small>
              ) : null}
            </article>
          ) : null}
        </section>

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
            className="button button--secondary"
            type="button"
            onClick={onMistakes}
          >
            틀린 낱말 복습
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
