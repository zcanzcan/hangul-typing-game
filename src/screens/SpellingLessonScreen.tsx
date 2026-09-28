import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import type { Sentence } from '../data/types'
import { buildSpellingQuestions } from '../spelling'

export interface SpellingLessonSummary {
  correctCount: number
  questionCount: number
  durationSec: number
  wrongItemIds: string[]
  itemLabels: Readonly<Record<string, string>>
}

interface SpellingLessonScreenProps {
  items: Sentence[]
  onBack: () => void
  onComplete: (summary: SpellingLessonSummary) => void
}

export function SpellingLessonScreen({
  items,
  onBack,
  onComplete,
}: SpellingLessonScreenProps) {
  const [questions] = useState(() => buildSpellingQuestions(items))
  const [startedAt] = useState(() => performance.now())
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([])
  const question = questions[index]

  if (!question) {
    return (
      <PageShell title="헷갈리는 맞춤법" onBack={onBack}>
        <section className="empty-state">
          <h2>맞춤법 문제를 준비하고 있어요</h2>
        </section>
      </PageShell>
    )
  }

  const correct = selected === question.sentence.text

  function choose(choice: string) {
    if (selected) {
      return
    }

    setSelected(choice)
    if (choice === question.sentence.text) {
      setCorrectCount((count) => count + 1)
    } else {
      setWrongItemIds((ids) => [...ids, question.sentence.id])
    }
  }

  function continueLesson() {
    if (index < questions.length - 1) {
      setIndex((current) => current + 1)
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
      title="헷갈리는 맞춤법"
      eyebrow="어느 문장이 맞을까요?"
      onBack={onBack}
    >
      <div className="spelling-lesson">
        <ProgressBar current={index + 1} total={questions.length} />
        <section className="spelling-card">
          <span className="spelling-card__icon" aria-hidden="true">
            ✍️
          </span>
          <h2>맞게 쓴 문장을 골라 주세요</h2>
          <div className="spelling-choices">
            {question.choices.map((choice) => (
              <button
                className={
                  selected
                    ? choice === question.sentence.text
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
            <div
              className={`feedback ${correct ? 'feedback--correct' : 'feedback--wrong'}`}
              role="status"
            >
              <strong>
                {correct ? '✓ 맞았어요!' : '✗ 올바른 표현을 확인해요.'}
              </strong>
              <span>{question.sentence.meaning}</span>
              <b>정답: {question.sentence.text}</b>
            </div>
          ) : null}

          {selected ? (
            <button
              className="button button--primary button--large"
              type="button"
              onClick={continueLesson}
            >
              {index === questions.length - 1 ? '결과 보기' : '다음 문제'}
            </button>
          ) : null}
        </section>
      </div>
    </PageShell>
  )
}
