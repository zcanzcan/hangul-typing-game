import { useState } from 'react'
import { removeLastCharacter } from 'es-hangul'

import { MeaningCard } from '../components/MeaningCard'
import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import { ScoreBadge } from '../components/ScoreBadge'
import type { Profile, TypingMode } from '../data/types'
import { buildSpeechText, useKoreanSpeech } from '../speech'
import { appendJamo } from '../typing/layout'
import { countKeystrokes } from '../typing/metrics'
import { judgeTyping } from '../typing/judge'

export interface PracticeItem {
  id: string
  text: string
  meaning?: string
  example?: string
  emoji?: string
  stage?: number
}

export interface PracticeSummary {
  mode: TypingMode
  stage: number
  durationSec: number
  keystrokes: number
  correctCharacters: number
  presentedCharacters: number
  completedCount: number
  wrongItemIds: string[]
  correctItemIds: string[]
  itemLabels: Readonly<Record<string, string>>
}

interface PracticeScreenProps {
  title: string
  eyebrow?: string
  mode: TypingMode
  stage?: number
  profile: Profile
  items: PracticeItem[]
  reviewMode?: boolean
  onBack: () => void
  onComplete: (summary: PracticeSummary) => void
}

interface Feedback {
  correct: boolean
}

export function PracticeScreen({
  title,
  eyebrow,
  mode,
  stage = 1,
  profile,
  items,
  reviewMode = false,
  onBack,
  onComplete,
}: PracticeScreenProps) {
  const [startedAt] = useState(() => performance.now())
  const [elapsedSec, setElapsedSec] = useState(1)
  const [itemIndex, setItemIndex] = useState(0)
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [keystrokes, setKeystrokes] = useState(0)
  const [correctCharacters, setCorrectCharacters] = useState(0)
  const [presentedCharacters, setPresentedCharacters] = useState(0)
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([])
  const [correctItemIds, setCorrectItemIds] = useState<string[]>([])
  const speech = useKoreanSpeech()

  const currentItem = items[itemIndex]
  const judgements = judgeTyping({
    target: currentItem.text,
    input,
    isComposing,
  })
  const liveCorrect = judgements.filter(
    ({ status }) => status === 'correct',
  ).length
  const livePresented = presentedCharacters + currentItem.text.length
  const liveAccuracy =
    livePresented === 0
      ? 0
      : ((correctCharacters + liveCorrect) / livePresented) * 100
  const liveCpm = profile.settings.timeLimit
    ? Math.round(((keystrokes + countKeystrokes(input)) / elapsedSec) * 60)
    : null

  function submitCurrentItem() {
    if (input === '' || isComposing || feedback) {
      return
    }

    const finalJudgements = judgeTyping({
      target: currentItem.text,
      input,
      isComposing: false,
    })
    const matchedCharacters = finalJudgements.filter(
      ({ status }) => status === 'correct',
    ).length
    const isCorrect = input === currentItem.text
    setElapsedSec(Math.max((performance.now() - startedAt) / 1_000, 1))

    setFeedback({ correct: isCorrect })
    setKeystrokes((current) => current + countKeystrokes(input))
    setCorrectCharacters((current) => current + matchedCharacters)
    setPresentedCharacters((current) => current + currentItem.text.length)

    if (isCorrect) {
      setCorrectItemIds((current) => [...current, currentItem.id])
    } else {
      setWrongItemIds((current) => [...current, currentItem.id])
    }
  }

  function goToNextItem() {
    if (!feedback) {
      return
    }

    if (itemIndex < items.length - 1) {
      setItemIndex((current) => current + 1)
      setInput('')
      setFeedback(null)
      return
    }

    onComplete({
      mode,
      stage,
      durationSec: Math.max((performance.now() - startedAt) / 1_000, 1),
      keystrokes,
      correctCharacters,
      presentedCharacters,
      completedCount: items.length,
      wrongItemIds,
      correctItemIds,
      itemLabels: Object.fromEntries(items.map(({ id, text }) => [id, text])),
    })
  }

  const finalSummary = feedback
    ? {
        keystrokes: keystrokes,
        correctCharacters,
        presentedCharacters,
        wrongItemIds,
        correctItemIds,
      }
    : null

  function finishOrContinue() {
    if (itemIndex === items.length - 1 && finalSummary && feedback) {
      onComplete({
        mode,
        stage,
        durationSec: Math.max((performance.now() - startedAt) / 1_000, 1),
        keystrokes: finalSummary.keystrokes,
        correctCharacters: finalSummary.correctCharacters,
        presentedCharacters: finalSummary.presentedCharacters,
        completedCount: items.length,
        wrongItemIds: finalSummary.wrongItemIds,
        correctItemIds: finalSummary.correctItemIds,
        itemLabels: Object.fromEntries(items.map(({ id, text }) => [id, text])),
      })
      return
    }

    goToNextItem()
  }

  return (
    <PageShell
      title={title}
      eyebrow={reviewMode ? '다시 연습' : (eyebrow ?? `${stage}단계`)}
      onBack={onBack}
    >
      <div className="practice-layout">
        <ProgressBar current={itemIndex + 1} total={items.length} />

        <section className="practice-card" aria-labelledby="practice-target">
          {profile.ageGroup === 'kid' && currentItem.emoji ? (
            <span className="practice-card__emoji" aria-hidden="true">
              {currentItem.emoji}
            </span>
          ) : null}
          <p className="eyebrow">아래 글자를 입력해요</p>
          <div
            id="practice-target"
            className="typing-target"
            aria-label={currentItem.text}
          >
            {Array.from(currentItem.text).map((character, index) => {
              const status = judgements[index]?.status ?? 'pending'
              return (
                <span
                  className={`typing-target__character is-${status}`}
                  key={`${character}-${index}`}
                >
                  {character === ' ' ? '␠' : character}
                </span>
              )
            })}
          </div>
          {profile.settings.speech && speech.supported ? (
            <button
              className="button button--ghost speech-button"
              type="button"
              onClick={() => speech.speak(currentItem.text)}
            >
              {speech.speaking ? '🔊 읽는 중' : '🔈 낱말 듣기'}
            </button>
          ) : null}

          <label className="typing-field">
            <span>입력</span>
            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                setElapsedSec(
                  Math.max((performance.now() - startedAt) / 1_000, 1),
                )
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(event) => {
                setIsComposing(false)
                setInput(event.currentTarget.value)
              }}
              disabled={feedback !== null}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus={profile.settings.keyboard === 'device'}
            />
          </label>

          <div className="practice-stats" aria-live="polite">
            {liveCpm === null ? (
              <ScoreBadge label="연습 방식" value="시간 제한 없음" />
            ) : (
              <ScoreBadge label="현재 타수" value={`${liveCpm}타`} />
            )}
            <ScoreBadge
              label="현재 정확도"
              value={`${Math.round(liveAccuracy)}%`}
            />
          </div>

          {feedback ? (
            <div
              className={`feedback ${feedback.correct ? 'feedback--correct' : 'feedback--wrong'}`}
              role="status"
            >
              <strong>
                {feedback.correct
                  ? '✓ 잘했어요!'
                  : '✗ 다시 연습 목록에 담았어요.'}
              </strong>
              <span>정답은 “{currentItem.text}”이에요.</span>
            </div>
          ) : null}

          {mode === 'word' ? (
            <MeaningCard
              word={currentItem.text}
              meaning={currentItem.meaning}
              example={currentItem.example}
              visible={feedback !== null}
              onSpeak={
                profile.settings.speech && speech.supported
                  ? () =>
                      speech.speak(
                        buildSpeechText(
                          currentItem.text,
                          currentItem.meaning,
                          currentItem.example,
                        ),
                      )
                  : undefined
              }
              speaking={speech.speaking}
            />
          ) : null}

          {feedback ? (
            <button
              className="button button--primary button--large"
              type="button"
              onClick={finishOrContinue}
            >
              {itemIndex === items.length - 1 ? '결과 보기' : '다음 문제'}
            </button>
          ) : (
            <button
              className="button button--primary button--large"
              type="button"
              onClick={submitCurrentItem}
              disabled={input === '' || isComposing}
            >
              입력 확인
            </button>
          )}
        </section>

        <OnScreenKeyboard
          target={currentItem.text}
          input={input}
          onJamo={(jamo) => setInput((current) => appendJamo(current, jamo))}
          onBackspace={() =>
            setInput((current) => removeLastCharacter(current))
          }
        />
      </div>
    </PageShell>
  )
}
