import { useEffect, useRef, useState } from 'react'
import { removeLastCharacter } from 'es-hangul'

import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { MinigamePack, Profile } from '../data/types'
import {
  advanceFallingWords,
  getSpeedMultiplier,
  getWordRainPreset,
  handleCompositionEnd,
  handleEnter,
  INITIAL_SUBMISSION_GATE,
  pickWordRainItem,
  submitRainWord,
  type FallingWord,
  type SubmissionGate,
  type WordRainItem,
  type WordRainPool,
} from '../games/wordRain'
import { appendJamo } from '../typing/layout'
import { countKeystrokes } from '../typing/metrics'

export interface WordRainSummary {
  pack: MinigamePack
  durationSec: number
  score: number
  removedCount: number
  missedCount: number
  maxCombo: number
  correctSubmissions: number
  totalSubmissions: number
  hitKeystrokes: number
  missedItemIds: string[]
  slangItems: WordRainItem[]
  slangFallback: boolean
}

interface WordRainGameScreenProps {
  profile: Profile
  pool: WordRainPool
  onBack: () => void
  onComplete: (summary: WordRainSummary) => void
}

interface GameState {
  status: 'running' | 'paused' | 'ended'
  fallingWords: FallingWord[]
  elapsedSec: number
  spawnElapsedSec: number
  score: number
  combo: number
  maxCombo: number
  removedCount: number
  missedCount: number
  correctSubmissions: number
  totalSubmissions: number
  hitKeystrokes: number
  lives: number
  missedItemIds: string[]
  slangItems: WordRainItem[]
}

const PACK_LABELS: Readonly<Record<MinigamePack, string>> = {
  standard: '표준어',
  slang: '요즘 말',
  mixed: '섞어서',
}

function addUniqueSlang(items: WordRainItem[], item: WordRainItem) {
  if (item.kind !== 'slang' || items.some(({ id }) => id === item.id)) {
    return items
  }

  return [...items, item]
}

function createDrop(pool: WordRainPool): FallingWord | null {
  const item = pickWordRainItem(pool)

  if (!item) {
    return null
  }

  return {
    ...item,
    dropId: crypto.randomUUID(),
    progress: 0,
    lane: 10 + Math.random() * 80,
  }
}

function createInitialState(pool: WordRainPool): GameState {
  const firstDrop = createDrop(pool)

  return {
    status: 'running',
    fallingWords: firstDrop ? [firstDrop] : [],
    elapsedSec: 0,
    spawnElapsedSec: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    removedCount: 0,
    missedCount: 0,
    correctSubmissions: 0,
    totalSubmissions: 0,
    hitKeystrokes: 0,
    lives: 3,
    missedItemIds: [],
    slangItems: firstDrop ? addUniqueSlang([], firstDrop) : [],
  }
}

function playPopSound(enabled: boolean) {
  if (!enabled || !('AudioContext' in window)) {
    return
  }

  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.frequency.setValueAtTime(520, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    760,
    audioContext.currentTime + 0.08,
  )
  gain.gain.setValueAtTime(0.08, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)
  oscillator.connect(gain).connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.1)
  oscillator.addEventListener('ended', () => void audioContext.close())
}

export function WordRainGameScreen({
  profile,
  pool,
  onBack,
  onComplete,
}: WordRainGameScreenProps) {
  const preset = getWordRainPreset(profile.ageGroup)
  const spawnIntervalSec = preset.fallDurationSec / preset.maxVisibleWords
  const [game, setGame] = useState(() => createInitialState(pool))
  const gameRef = useRef(game)
  const [input, setInput] = useState('')
  const inputRef = useRef('')
  const submissionGateRef = useRef<SubmissionGate>(INITIAL_SUBMISSION_GATE)
  const [feedback, setFeedback] = useState('')
  const [shakeNonce, setShakeNonce] = useState(0)
  const [popEffect, setPopEffect] = useState<FallingWord | null>(null)
  const popTimerRef = useRef<number | null>(null)
  const [autoPaused, setAutoPaused] = useState(false)
  const completedRef = useRef(false)

  function commitGame(next: GameState) {
    gameRef.current = next
    setGame(next)
  }

  useEffect(() => {
    if (game.status !== 'running') {
      return
    }

    let frame = 0
    let lastFrame = performance.now()

    function tick(now: number) {
      const deltaSec = Math.min((now - lastFrame) / 1_000, 0.1)
      lastFrame = now

      setGame((current) => {
        if (current.status !== 'running') {
          return current
        }

        const elapsedSec = current.elapsedSec + deltaSec
        const advanced = advanceFallingWords({
          fallingWords: current.fallingWords,
          deltaSec,
          elapsedSec,
          fallDurationSec: preset.fallDurationSec,
        })
        let fallingWords = advanced.active
        let spawnElapsedSec = current.spawnElapsedSec + deltaSec
        let slangItems = current.slangItems

        if (
          spawnElapsedSec >= spawnIntervalSec &&
          fallingWords.length < preset.maxVisibleWords
        ) {
          const drop = createDrop(pool)
          if (drop) {
            fallingWords = [...fallingWords, drop]
            slangItems = addUniqueSlang(slangItems, drop)
          }
          spawnElapsedSec %= spawnIntervalSec
        }

        const missedCount = current.missedCount + advanced.missed.length
        const lives = Math.max(0, current.lives - advanced.missed.length)
        const next: GameState = {
          ...current,
          status: lives === 0 ? 'ended' : 'running',
          fallingWords,
          elapsedSec,
          spawnElapsedSec,
          missedCount,
          lives,
          combo: advanced.missed.length > 0 ? 0 : current.combo,
          missedItemIds: [
            ...current.missedItemIds,
            ...advanced.missed.map(({ id }) => id),
          ],
          slangItems,
        }
        gameRef.current = next
        return next
      })

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [game.status, pool, preset, spawnIntervalSec])

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden && gameRef.current.status === 'running') {
        setAutoPaused(true)
        commitGame({ ...gameRef.current, status: 'paused' })
      }
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () =>
      document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [])

  useEffect(() => {
    if (game.status !== 'ended' || completedRef.current) {
      return
    }

    completedRef.current = true
    onComplete({
      pack: pool.pack,
      durationSec: Math.max(game.elapsedSec, 1),
      score: game.score,
      removedCount: game.removedCount,
      missedCount: game.missedCount,
      maxCombo: game.maxCombo,
      correctSubmissions: game.correctSubmissions,
      totalSubmissions: game.totalSubmissions,
      hitKeystrokes: game.hitKeystrokes,
      missedItemIds: game.missedItemIds,
      slangItems: game.slangItems,
      slangFallback: pool.slangFallback,
    })
  }, [game, onComplete, pool.pack, pool.slangFallback])

  useEffect(
    () => () => {
      if (popTimerRef.current !== null) {
        window.clearTimeout(popTimerRef.current)
      }
    },
    [],
  )

  function clearInput() {
    inputRef.current = ''
    setInput('')
  }

  function submitValue(value: string) {
    const submitted = value.trim()
    clearInput()

    if (submitted === '' || gameRef.current.status !== 'running') {
      return
    }

    const current = gameRef.current
    const result = submitRainWord(
      current.fallingWords,
      submitted,
      current.combo,
    )

    if (!result.matched) {
      commitGame({
        ...current,
        combo: result.nextCombo,
        totalSubmissions: current.totalSubmissions + 1,
      })
      setFeedback('화면에 있는 낱말을 다시 살펴봐요.')
      setShakeNonce((nonce) => nonce + 1)
      return
    }

    const next: GameState = {
      ...current,
      fallingWords: result.fallingWords,
      score: current.score + result.earnedScore,
      combo: result.nextCombo,
      maxCombo: Math.max(current.maxCombo, result.nextCombo),
      removedCount: current.removedCount + 1,
      correctSubmissions: current.correctSubmissions + 1,
      totalSubmissions: current.totalSubmissions + 1,
      hitKeystrokes:
        current.hitKeystrokes + countKeystrokes(result.matched.text),
    }
    commitGame(next)
    setFeedback(`“${result.matched.text}” 빗방울을 없앴어요!`)
    setPopEffect(result.matched)
    if (popTimerRef.current !== null) {
      window.clearTimeout(popTimerRef.current)
    }
    popTimerRef.current = window.setTimeout(() => setPopEffect(null), 360)
    playPopSound(profile.settings.sfx)
  }

  function applyInput(nextValue: string) {
    inputRef.current = nextValue
    setInput(nextValue)
  }

  function handleSubmitDecision(valueToSubmit: string | null) {
    if (valueToSubmit !== null) {
      submitValue(valueToSubmit)
    }
  }

  const speed = getSpeedMultiplier(game.elapsedSec)

  return (
    <PageShell
      title="낱말 비"
      eyebrow={`${PACK_LABELS[pool.pack]} 꾸러미`}
      onBack={onBack}
      theme={pool.pack === 'standard' ? 'candy' : 'pixel'}
    >
      <div className="word-rain-layout">
        <section className="word-rain-scoreboard" aria-label="게임 점수판">
          <ScoreBadge label="점수" value={`${game.score}점`} />
          <ScoreBadge label="콤보" value={`${game.combo}`} />
          <ScoreBadge
            label="속도"
            value={`${speed.toFixed(speed === 1 ? 0 : 1)}배`}
          />
          <div
            className="word-rain-lives"
            aria-label={`남은 새싹 ${game.lives}개`}
          >
            {Array.from({ length: 3 }, (_, index) => (
              <span key={index} aria-hidden="true">
                {index < game.lives ? '🌱' : '🥀'}
              </span>
            ))}
          </div>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => {
              setAutoPaused(false)
              commitGame({
                ...gameRef.current,
                status:
                  gameRef.current.status === 'running' ? 'paused' : 'running',
              })
            }}
          >
            {game.status === 'paused' ? '▶ 계속하기' : 'Ⅱ 일시정지'}
          </button>
        </section>

        {pool.slangFallback ? (
          <p className="word-rain-notice" role="status">
            요즘 말이 부족해서 표준어를 섞었어요.
          </p>
        ) : null}

        <section className="word-rain-board" aria-label="떨어지는 낱말">
          <div className="word-rain-sky">
            {game.fallingWords.map((word) => (
              <span
                className={`rain-word rain-word--${word.kind}`}
                key={word.dropId}
                style={{
                  left: `${word.lane}%`,
                  top: `${word.progress * 88}%`,
                }}
              >
                {word.text}
              </span>
            ))}
            {popEffect ? (
              <span
                className="word-rain-pop"
                style={{
                  left: `${popEffect.lane}%`,
                  top: `${popEffect.progress * 88}%`,
                }}
                aria-hidden="true"
              >
                <i>●</i>
                <i>●</i>
                <i>●</i>
                <i>●</i>
              </span>
            ) : null}
            {game.status === 'paused' ? (
              <div className="word-rain-pause" role="status">
                <span aria-hidden="true">☂️</span>
                <strong>
                  {autoPaused
                    ? '다른 화면을 보는 동안 멈췄어요.'
                    : '잠깐 쉬고 있어요.'}
                </strong>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => {
                    setAutoPaused(false)
                    commitGame({ ...gameRef.current, status: 'running' })
                  }}
                >
                  계속하기
                </button>
              </div>
            ) : null}
          </div>
          <div className="word-rain-ground" aria-hidden="true">
            새싹을 지키는 바닥
          </div>
        </section>

        <form
          className={`word-rain-input ${shakeNonce ? 'word-rain-input--shake' : ''}`}
          key={shakeNonce}
          onSubmit={(event) => {
            event.preventDefault()
            submitValue(inputRef.current)
          }}
        >
          <label className="typing-field">
            <span>내리는 낱말 입력</span>
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
              disabled={game.status !== 'running'}
            />
          </label>
          <button
            className="button button--primary"
            type="submit"
            disabled={game.status !== 'running' || input === ''}
          >
            입력 확인
          </button>
        </form>

        <p className="word-rain-feedback" role="status" aria-live="polite">
          {feedback || '낱말을 입력하고 Enter를 눌러요.'}
        </p>

        {profile.settings.keyboard === 'app' ? (
          <OnScreenKeyboard
            target=""
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
