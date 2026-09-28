import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import type { Sentence } from '../data/types'
import { countKeystrokes } from '../typing/metrics'
import type { PracticeSummary } from './PracticeScreen'

interface SpellingCorrectionScreenProps {
  items: Sentence[]
  onBack: () => void
  onComplete: (summary: PracticeSummary) => void
}

export function SpellingCorrectionScreen({
  items,
  onBack,
  onComplete,
}: SpellingCorrectionScreenProps) {
  const [startedAt] = useState(() => performance.now())
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [keystrokes, setKeystrokes] = useState(0)
  const [correctCharacters, setCorrectCharacters] = useState(0)
  const [presentedCharacters, setPresentedCharacters] = useState(0)
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([])
  const [correctItemIds, setCorrectItemIds] = useState<string[]>([])
  const item = items[index]

  if (!item) {
    return (
      <PageShell title="틀린 맞춤법 고치기" onBack={onBack}>
        <section className="empty-state">
          <h2>고칠 문장을 준비하고 있어요</h2>
        </section>
      </PageShell>
    )
  }

  function submit() {
    if (!input.trim() || isComposing || feedback !== null) {
      return
    }

    const correct = input.trim() === item.text
    const targetLength = Array.from(item.text).length
    const matches = Array.from(item.text).filter(
      (character, characterIndex) =>
        Array.from(input.trim())[characterIndex] === character,
    ).length
    setFeedback(correct)
    setKeystrokes((value) => value + countKeystrokes(input))
    setCorrectCharacters((value) => value + matches)
    setPresentedCharacters((value) => value + targetLength)
    if (correct) {
      setCorrectItemIds((ids) => [...ids, item.id])
    } else {
      setWrongItemIds((ids) => [...ids, item.id])
    }
  }

  function next() {
    if (index < items.length - 1) {
      setIndex((value) => value + 1)
      setInput('')
      setFeedback(null)
      return
    }

    onComplete({
      mode: 'sentence',
      stage: 4,
      durationSec: Math.max(1, (performance.now() - startedAt) / 1_000),
      keystrokes,
      correctCharacters,
      presentedCharacters,
      completedCount: items.length,
      wrongItemIds,
      correctItemIds,
      itemLabels: Object.fromEntries(items.map(({ id, text }) => [id, text])),
    })
  }

  return (
    <PageShell
      title="틀린 맞춤법 고치기"
      eyebrow="바르게 고쳐 입력해요"
      onBack={onBack}
    >
      <div className="correction-layout">
        <ProgressBar current={index + 1} total={items.length} />
        <section className="correction-card">
          <p className="eyebrow">틀린 문장</p>
          <h2>{item.wrongForm}</h2>
          <label className="field">
            <span>바른 문장</span>
            <textarea
              aria-label="바른 문장"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(event) => {
                setIsComposing(false)
                setInput(event.currentTarget.value)
              }}
              disabled={feedback !== null}
              autoFocus
            />
          </label>
          {feedback !== null ? (
            <div
              className={`feedback ${feedback ? 'feedback--correct' : 'feedback--wrong'}`}
              role="status"
            >
              <strong>
                {feedback ? '✓ 바르게 고쳤어요!' : '✗ 정답을 확인해요.'}
              </strong>
              <span>{item.text}</span>
              <small>{item.meaning}</small>
            </div>
          ) : null}
          <button
            className="button button--primary button--large"
            type="button"
            disabled={!feedback && (!input.trim() || isComposing)}
            onClick={feedback === null ? submit : next}
          >
            {feedback === null
              ? '고치기 확인'
              : index === items.length - 1
                ? '결과 보기'
                : '다음 문장'}
          </button>
        </section>
      </div>
    </PageShell>
  )
}
