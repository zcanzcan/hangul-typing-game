import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import type { Sentence } from '../data/types'
import { buildMeaningQuestions } from '../meaning'

export interface MeaningQuizSummary {
  correctCount: number
  questionCount: number
  durationSec: number
  wrongItemIds: string[]
  itemLabels: Readonly<Record<string, string>>
}

interface MeaningQuizScreenProps {
  items: Sentence[]
  onBack: () => void
  onComplete: (summary: MeaningQuizSummary) => void
}

export function MeaningQuizScreen({
  items,
  onBack,
  onComplete,
}: MeaningQuizScreenProps) {
  const [questions] = useState(() => buildMeaningQuestions(items))
  const [startedAt] = useState(() => performance.now())
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([])
  const question = questions[index]

  if (!question) {
    return (
      <PageShell title="속담·사자성어 뜻 퀴즈" onBack={onBack}>
        <section className="empty-state">
          <h2>뜻 문제를 준비하고 있어요</h2>
        </section>
      </PageShell>
    )
  }

  function choose(choice: string) {
    if (selected) return
    setSelected(choice)
    if (choice === question.sentence.meaning) {
      setCorrectCount((count) => count + 1)
    } else {
      setWrongItemIds((ids) => [...ids, question.sentence.id])
    }
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1)
      setSelected('')
      return
    }
    onComplete({
      correctCount,
      questionCount: questions.length,
      durationSec: Math.max(1, (performance.now() - startedAt) / 1_000),
      wrongItemIds,
      itemLabels: Object.fromEntries(
        questions.map(({ sentence }) => [sentence.id, sentence.text]),
      ),
    })
  }

  return (
    <PageShell
      title="속담·사자성어 뜻 퀴즈"
      eyebrow="뜻을 찾아요"
      onBack={onBack}
    >
      <div className="meaning-quiz-layout">
        <ProgressBar current={index + 1} total={questions.length} />
        <section className="meaning-quiz-card">
          <span aria-hidden="true">💡</span>
          <h2>{question.sentence.text}</h2>
          <div className="meaning-quiz-choices">
            {question.choices.map((choice) => (
              <button
                className={
                  selected
                    ? choice === question.sentence.meaning
                      ? 'is-correct'
                      : choice === selected
                        ? 'is-wrong'
                        : ''
                    : ''
                }
                type="button"
                key={choice}
                disabled={Boolean(selected)}
                onClick={() => choose(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
          {selected ? (
            <div className="feedback" role="status">
              <strong>
                {selected === question.sentence.meaning
                  ? '✓ 뜻을 맞혔어요!'
                  : '정답 뜻을 확인해요.'}
              </strong>
              <span>{question.sentence.meaning}</span>
            </div>
          ) : null}
          {selected ? (
            <button
              className="button button--primary button--large"
              type="button"
              onClick={next}
            >
              {index === questions.length - 1 ? '결과 보기' : '다음 문제'}
            </button>
          ) : null}
        </section>
      </div>
    </PageShell>
  )
}
