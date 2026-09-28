import { useState } from 'react'

import { MeaningCard } from '../components/MeaningCard'
import { PageShell } from '../components/PageShell'
import type { StoredRecord } from '../storage/records'
import type { WordChainSummary } from './WordChainGameScreen'

export interface WordChainResult {
  summary: WordChainSummary
  record: StoredRecord | null
  difference: number | null
}

interface WordChainResultScreenProps {
  result: WordChainResult
  onMain: () => void
  onReplay: () => void
  onRecords: () => void
}

export function WordChainResultScreen({
  result,
  onMain,
  onReplay,
  onRecords,
}: WordChainResultScreenProps) {
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const selectedWord = result.summary.chain.find(
    ({ id }) => id === selectedWordId,
  )
  const winner = result.summary.players.find(
    ({ id }) => id === result.summary.winnerId,
  )

  return (
    <PageShell title="끝말잇기 결과" eyebrow="말꼬리 완성" theme="candy">
      <div className="word-chain-result">
        <section className="word-chain-winner">
          <span aria-hidden="true">🏆</span>
          <div>
            <p className="eyebrow">WINNER</p>
            <h2>
              {winner ? `${winner.nickname}님이 이겼어요!` : '멋진 승부였어요!'}
            </h2>
            <p>
              {result.summary.chain.length}개 낱말을 이어 하나의 사슬을
              만들었어요.
            </p>
          </div>
        </section>

        <section className="word-chain-result-grid" aria-label="참가자 결과">
          {[...result.summary.players]
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <article key={player.id}>
                <strong>{player.nickname}</strong>
                <b>{player.score}점</b>
                <span>
                  {player.acceptedCount}개 연결 · 실패 {player.failures}회
                </span>
              </article>
            ))}
        </section>

        {result.record?.isBest ? (
          <p className="word-chain-best">
            🎉 내 최고 기록을 새로 썼어요
            {result.difference !== null ? ` · +${result.difference}점` : ''}
          </p>
        ) : null}

        <section className="word-chain-review">
          <h2>이번 판 낱말 사슬</h2>
          <div>
            {result.summary.chain.map((word, index) => (
              <button
                type="button"
                key={`${word.id}-${index}`}
                onClick={() => setSelectedWordId(word.id)}
              >
                {word.text}
              </button>
            ))}
          </div>
          {selectedWord ? (
            <MeaningCard
              word={selectedWord.text}
              meaning={selectedWord.meaning}
              example={selectedWord.example}
              visible
            />
          ) : null}
        </section>

        <div className="button-row">
          <button
            className="button button--primary"
            type="button"
            onClick={onReplay}
          >
            같은 구성으로 다시 하기
          </button>
          <button
            className="button button--secondary"
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
