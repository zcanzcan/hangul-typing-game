import { useEffect, useRef, useState } from 'react'
import { removeLastCharacter } from 'es-hangul'

import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import type { Profile, Slang } from '../data/types'
import {
  buildSlangQuizQuestions,
  calculateSlangQuizScore,
  canStartSlangQuiz,
  getSlangHint,
  getSlangQuizTimeLimit,
  isCorrectSlangAnswer,
  maskSlangExample,
} from '../games/slangQuiz'
import {
  handleCompositionEnd,
  handleEnter,
  INITIAL_SUBMISSION_GATE,
  type SubmissionGate,
} from '../games/wordRain/submission'
import { appendJamo } from '../typing/layout'
import { countKeystrokes } from '../typing/metrics'

export interface SlangQuizSummary {
  score: number
  durationSec: number
  correctCount: number
  maxStreak: number
  hintCount: number
  hitKeystrokes: number
  wrongItemIds: string[]
  questionCount: number
}

interface SlangQuizGameScreenProps {
  profile: Profile
  items: Slang[]
  onBack: () => void
  onNeedMore: () => void
  onComplete: (summary: SlangQuizSummary) => void
}

interface Feedback {
  correct: boolean
  message: string
  points: number
}

export function SlangQuizGameScreen({
  profile,
  items,
  onBack,
  onNeedMore,
  onComplete,
}: SlangQuizGameScreenProps) {
  const [questions] = useState(() =>
    buildSlangQuizQuestions(items, profile.ageGroup),
  )
  const timeLimit = getSlangQuizTimeLimit(profile.ageGroup)
  const [startedAt] = useState(() => performance.now())
  const [questionIndex, setQuestionIndex] = useState(0)
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [attemptMessage, setAttemptMessage] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [remainingMs, setRemainingMs] = useState(() =>
    timeLimit === null ? null : timeLimit * 1_000,
  )
  const [hintRequested, setHintRequested] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [hitKeystrokes, setHitKeystrokes] = useState(0)
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([])
  const inputRef = useRef('')
  const submissionGateRef = useRef<SubmissionGate>(INITIAL_SUBMISSION_GATE)

  const question = questions[questionIndex]
  const automaticHint =
    timeLimit !== null &&
    remainingMs !== null &&
    remainingMs <= (timeLimit * 1_000) / 2
  const hintSeen = hintRequested || automaticHint

  useEffect(() => {
    if (feedback || timeLimit === null || !question) {
      return
    }

    const deadline = performance.now() + timeLimit * 1_000
    const timer = window.setInterval(() => {
      setRemainingMs(Math.max(0, deadline - performance.now()))
    }, 100)
    const expiryTimer = window.setTimeout(() => {
      setRemainingMs(0)
      setStreak(0)
      setWrongItemIds((current) => [...current, question.id])
      setFeedback({
        correct: false,
        message: '시간이 끝났어요. 정답을 확인해요.',
        points: 0,
      })
    }, timeLimit * 1_000)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(expiryTimer)
    }
  }, [feedback, question, timeLimit])

  if (
    !canStartSlangQuiz({
      slangMode: profile.settings.slangMode,
      items,
      ageGroup: profile.ageGroup,
    }) ||
    !question
  ) {
    return (
      <PageShell
        title="요즘 말 스피드 퀴즈"
        eyebrow="PIXEL SPEED QUIZ"
        theme="pixel"
        onBack={onBack}
      >
        <section className="pixel-empty-state slang-quiz-empty">
          <span aria-hidden="true">🧩</span>
          <h2>요즘 말이 더 필요해요</h2>
          <p>안전한 요즘 말을 4개 이상 준비하면 퀴즈를 시작할 수 있어요.</p>
          <button
            className="button button--pixel"
            type="button"
            onClick={onNeedMore}
          >
            설정에서 유행어 추가
          </button>
        </section>
      </PageShell>
    )
  }

  function applyInput(value: string) {
    inputRef.current = value
    setInput(value)
  }

  function submitValue(value: string) {
    if (feedback || value.trim() === '') {
      return
    }

    if (isCorrectSlangAnswer(value, question.text)) {
      const result = calculateSlangQuizScore({
        remainingSec:
          remainingMs === null ? null : Math.ceil(remainingMs / 1_000),
        hintSeen,
        streakBefore: streak,
      })
      setScore((current) => current + result.points)
      setStreak(result.nextStreak)
      setMaxStreak((current) => Math.max(current, result.nextStreak))
      setCorrectCount((current) => current + 1)
      setHitKeystrokes((current) => current + countKeystrokes(value))
      if (hintSeen) {
        setHintCount((current) => current + 1)
      }
      setFeedback({
        correct: true,
        message:
          result.comboBonus > 0
            ? `정답! 콤보 보너스 ${result.comboBonus}점까지 받았어요.`
            : '정답이에요!',
        points: result.points,
      })
      return
    }

    if (attempts < 2) {
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setAttemptMessage(
        nextAttempts === 1
          ? '아쉬워요. 두 번 더 입력할 수 있어요.'
          : '아쉬워요. 한 번 더 입력할 수 있어요.',
      )
      applyInput('')
      return
    }

    setStreak(0)
    setWrongItemIds((current) => [...current, question.id])
    setFeedback({
      correct: false,
      message: '다시 두 번 시도했어요. 정답을 확인해요.',
      points: 0,
    })
  }

  function handleSubmitDecision(value: string | null) {
    if (value !== null) {
      submitValue(value)
    }
  }

  function continueGame() {
    if (!feedback) {
      return
    }

    if (questionIndex === questions.length - 1) {
      onComplete({
        score,
        durationSec: Math.max((performance.now() - startedAt) / 1_000, 1),
        correctCount,
        maxStreak,
        hintCount,
        hitKeystrokes,
        wrongItemIds,
        questionCount: questions.length,
      })
      return
    }

    setQuestionIndex((current) => current + 1)
    applyInput('')
    setAttempts(0)
    setAttemptMessage('')
    setFeedback(null)
    setHintRequested(false)
    setRemainingMs(timeLimit === null ? null : timeLimit * 1_000)
    submissionGateRef.current = INITIAL_SUBMISSION_GATE
  }

  const maskedExample = maskSlangExample(question.example, question.text)

  return (
    <PageShell
      title="요즘 말 스피드 퀴즈"
      eyebrow="PIXEL SPEED QUIZ"
      theme="pixel"
      onBack={onBack}
    >
      <div className="slang-quiz-layout">
        <div className="slang-scoreboard" aria-label="스피드 퀴즈 점수판">
          <span>
            점수 <strong>{score}</strong>
          </span>
          <span>
            연속 정답 <strong>{streak}</strong>
          </span>
          <span>
            문제{' '}
            <strong>
              {questionIndex + 1}/{questions.length}
            </strong>
          </span>
          <span>
            남은 시간{' '}
            <strong>
              {remainingMs === null
                ? '제한 없음'
                : `${Math.ceil(remainingMs / 1_000)}초`}
            </strong>
          </span>
        </div>

        <ProgressBar current={questionIndex + 1} total={questions.length} />

        <section
          className="slang-quiz-card"
          aria-labelledby="slang-quiz-meaning"
        >
          <p className="eyebrow">이 뜻에 맞는 요즘 말은?</p>
          <h2 id="slang-quiz-meaning">{question.meaning}</h2>
          {question.standardForm ? (
            <p className="slang-quiz-standard">
              비슷한 표준어 <strong>{question.standardForm}</strong>
            </p>
          ) : null}
          {maskedExample ? (
            <p className="slang-example">예문: {maskedExample}</p>
          ) : null}

          {hintSeen ? (
            <div className="slang-quiz-hint" role="status">
              초성 힌트 <strong>{getSlangHint(question.text)}</strong>
            </div>
          ) : timeLimit === null ? (
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setHintRequested(true)}
            >
              힌트 보기
            </button>
          ) : (
            <p className="slang-quiz-hint-wait">
              시간이 절반 지나면 초성 힌트가 나와요.
            </p>
          )}

          {!feedback ? (
            <form
              className="slang-quiz-input"
              onSubmit={(event) => {
                event.preventDefault()
                submitValue(inputRef.current)
              }}
            >
              <label className="typing-field">
                <span>요즘 말 입력</span>
                <input
                  value={input}
                  onChange={(event) => applyInput(event.target.value)}
                  onCompositionStart={() => {
                    submissionGateRef.current = INITIAL_SUBMISSION_GATE
                  }}
                  onCompositionEnd={(event) => {
                    applyInput(event.currentTarget.value)
                    const decision = handleCompositionEnd(
                      submissionGateRef.current,
                      event.currentTarget.value,
                    )
                    submissionGateRef.current = decision.gate
                    handleSubmitDecision(decision.valueToSubmit)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') {
                      return
                    }

                    event.preventDefault()
                    const decision = handleEnter(
                      submissionGateRef.current,
                      inputRef.current,
                      event.nativeEvent.isComposing,
                    )
                    submissionGateRef.current = decision.gate
                    handleSubmitDecision(decision.valueToSubmit)
                  }}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus={profile.settings.keyboard === 'device'}
                />
              </label>
              <button
                className="button button--pixel"
                type="submit"
                disabled={input.trim() === ''}
              >
                입력 확인
              </button>
            </form>
          ) : (
            <div className="slang-answer-panel" aria-live="polite">
              <div
                className={`pixel-feedback ${feedback.correct ? 'pixel-feedback--correct' : 'pixel-feedback--wrong'}`}
                role="status"
              >
                <strong>
                  {feedback.correct ? `✓ +${feedback.points}점` : '✗ 정답 공개'}
                </strong>
                <span>{feedback.message}</span>
                <span>정답은 “{question.text}”이에요.</span>
              </div>
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
          )}

          <p className="slang-quiz-attempt" role="status" aria-live="polite">
            {attemptMessage || '띄어쓰기는 점수에 영향을 주지 않아요.'}
          </p>
        </section>

        {profile.settings.keyboard === 'app' && !feedback ? (
          <OnScreenKeyboard
            target={question.text}
            input={input}
            onJamo={(jamo) => applyInput(appendJamo(inputRef.current, jamo))}
            onBackspace={() =>
              applyInput(removeLastCharacter(inputRef.current))
            }
            onSubmit={() => submitValue(inputRef.current)}
          />
        ) : null}
      </div>
    </PageShell>
  )
}
