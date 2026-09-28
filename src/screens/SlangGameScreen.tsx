import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import type { AgeGroup, Slang } from '../data/types'
import { buildSlangQuestions, calculateSlangScore } from '../slang/game'

export interface SlangGameSummary {
  score: number
  correctMeaningCount: number
  typingCorrectCount: number
  durationSec: number
}

interface SlangGameScreenProps {
  items: Slang[]
  ageGroup: AgeGroup
  onBack: () => void
  onComplete: (summary: SlangGameSummary) => void
}

type Phase = 'meaning' | 'typing' | 'feedback'

export function SlangGameScreen({
  items,
  ageGroup,
  onBack,
  onComplete,
}: SlangGameScreenProps) {
  const [questions] = useState(() =>
    buildSlangQuestions(items, 10, Math.random, ageGroup),
  )
  const [startedAt] = useState(() => performance.now())
  const [questionIndex, setQuestionIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('meaning')
  const [selectedMeaning, setSelectedMeaning] = useState('')
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctMeaningCount, setCorrectMeaningCount] = useState(0)
  const [typingCorrectCount, setTypingCorrectCount] = useState(0)
  const [lastAward, setLastAward] = useState(0)
  const [lastTypingCorrect, setLastTypingCorrect] = useState<boolean | null>(
    null,
  )

  const question = questions[questionIndex]

  if (!question) {
    return (
      <PageShell title="유행어 카드게임" theme="pixel" onBack={onBack}>
        <section className="pixel-empty-state">
          <h2>게임에 필요한 유행어가 없어요</h2>
          <p>설정에서 유행어를 추가한 뒤 다시 시작해 주세요.</p>
        </section>
      </PageShell>
    )
  }

  function chooseMeaning(choice: string) {
    if (phase !== 'meaning') {
      return
    }

    setSelectedMeaning(choice)
    const meaningCorrect = choice === question.slang.meaning
    const result = calculateSlangScore({
      meaningCorrect,
      typingCorrect: false,
      streakBefore: streak,
    })

    setScore((current) => current + result.points)
    setStreak(result.nextStreak)
    setLastAward(result.points)

    if (meaningCorrect) {
      setCorrectMeaningCount((current) => current + 1)
      setPhase('typing')
      return
    }

    setLastTypingCorrect(null)
    setPhase('feedback')
  }

  function submitTyping() {
    if (phase !== 'typing' || input === '' || isComposing) {
      return
    }

    const typingCorrect = input === question.slang.text
    setLastTypingCorrect(typingCorrect)

    if (typingCorrect) {
      setScore((current) => current + 50)
      setTypingCorrectCount((current) => current + 1)
      setLastAward((current) => current + 50)
    }

    setPhase('feedback')
  }

  function continueGame() {
    if (questionIndex === questions.length - 1) {
      onComplete({
        score,
        correctMeaningCount,
        typingCorrectCount,
        durationSec: Math.max((performance.now() - startedAt) / 1_000, 1),
      })
      return
    }

    setQuestionIndex((current) => current + 1)
    setPhase('meaning')
    setSelectedMeaning('')
    setInput('')
    setLastAward(0)
    setLastTypingCorrect(null)
  }

  const meaningCorrect = selectedMeaning === question.slang.meaning

  return (
    <PageShell
      title="유행어 카드게임"
      eyebrow="PIXEL WORD QUEST"
      theme="pixel"
      onBack={onBack}
    >
      <div className="slang-game-layout">
        <div className="slang-scoreboard" aria-label="게임 점수판">
          <span>
            점수 <strong>{score}</strong>
          </span>
          <span>
            연속 정답 <strong>{streak}</strong>
          </span>
          <span>
            문제 <strong>{questionIndex + 1}/10</strong>
          </span>
        </div>

        <ProgressBar current={questionIndex + 1} total={questions.length} />

        <section className="slang-card" aria-labelledby="slang-word">
          <p className="eyebrow">이 말은 무슨 뜻일까요?</p>
          <h2 id="slang-word">{question.slang.text}</h2>
          <p className="slang-source-line">
            등록 {question.slang.addedAt}
            {question.slang.popularFrom
              ? ` · 유행 시작 ${question.slang.popularFrom}`
              : ''}
            {' · '}
            {question.slang.source ? (
              <a href={question.slang.source} target="_blank" rel="noreferrer">
                출처 보기
              </a>
            ) : question.slang.origin === 'custom' ? (
              '직접 추가'
            ) : (
              '앱 검수 목록'
            )}
          </p>

          <div className="slang-choices">
            {question.choices.map((choice, index) => {
              const isSelected = selectedMeaning === choice
              const isAnswer = choice === question.slang.meaning
              const stateClass =
                phase === 'meaning'
                  ? ''
                  : isAnswer
                    ? 'is-correct'
                    : isSelected
                      ? 'is-wrong'
                      : ''

              return (
                <button
                  className={stateClass}
                  type="button"
                  key={choice}
                  disabled={phase !== 'meaning'}
                  onClick={() => chooseMeaning(choice)}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  {choice}
                </button>
              )
            })}
          </div>

          {phase === 'typing' ? (
            <form
              className="slang-typing"
              onSubmit={(event) => {
                event.preventDefault()
                submitTyping()
              }}
            >
              <div
                className="pixel-feedback pixel-feedback--correct"
                role="status"
              >
                <strong>✓ 뜻 정답! +{lastAward}점</strong>
                <span>이제 유행어를 한 번 정확히 입력해요.</span>
              </div>
              <label>
                <span>유행어 입력</span>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(event) => {
                    setIsComposing(false)
                    setInput(event.currentTarget.value)
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
              </label>
              <button className="button button--pixel" type="submit">
                입력 확인
              </button>
            </form>
          ) : null}

          {phase === 'feedback' ? (
            <div className="slang-answer-panel" aria-live="polite">
              <div
                className={`pixel-feedback ${meaningCorrect ? 'pixel-feedback--correct' : 'pixel-feedback--wrong'}`}
                role="status"
              >
                <strong>
                  {meaningCorrect ? `✓ +${lastAward}점` : '✗ 이번 문제는 0점'}
                </strong>
                <span>{question.slang.meaning}</span>
                {lastTypingCorrect === false ? (
                  <span>정확한 입력은 “{question.slang.text}”이에요.</span>
                ) : null}
              </div>
              {question.slang.example ? (
                <p className="slang-example">예문: {question.slang.example}</p>
              ) : null}
              <button
                className="button button--pixel"
                type="button"
                onClick={continueGame}
              >
                {questionIndex === questions.length - 1
                  ? '결과 보기'
                  : '다음 문제'}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </PageShell>
  )
}
