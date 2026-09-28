import { useEffect, useRef, useState } from 'react'
import { removeLastCharacter } from 'es-hangul'

import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { PageShell } from '../components/PageShell'
import { ScoreBadge } from '../components/ScoreBadge'
import type { MinigamePack, Profile } from '../data/types'
import {
  applyTowerCorrect,
  applyTowerMistake,
  calculateTimedTowerScore,
  getTowerScene,
  pickTowerItem,
  TOWER_MAX_SHAKES,
  TOWER_TIMED_DURATION_SEC,
  type TowerItem,
  type TowerMode,
  type TowerPool,
} from '../games/tower'
import {
  handleCompositionEnd,
  handleEnter,
  INITIAL_SUBMISSION_GATE,
  type SubmissionGate,
} from '../games/wordRain/submission'
import { appendJamo } from '../typing/layout'
import { countKeystrokes } from '../typing/metrics'

export interface TowerBlock extends TowerItem {
  blockId: string
  floor: number
}

export type TowerEndReason = 'collapsed' | 'time' | 'stopped'

export interface TowerSummary {
  pack: MinigamePack
  timeLimit: boolean
  durationSec: number
  score: number
  floor: number
  shakes: number
  maxStreak: number
  recoveredCount: number
  correctSubmissions: number
  totalSubmissions: number
  hitKeystrokes: number
  wrongItemIds: string[]
  blocks: TowerBlock[]
  endReason: TowerEndReason
  slangFallback: boolean
}

interface TowerGameScreenProps {
  profile: Profile
  pool: TowerPool
  mode: TowerMode
  onBack: () => void
  onComplete: (summary: TowerSummary) => void
}

interface GameState {
  status: 'running' | 'ended'
  endReason: TowerEndReason | null
  currentItem: TowerItem | null
  blocks: TowerBlock[]
  floor: number
  shakes: number
  streak: number
  maxStreak: number
  recoveredCount: number
  blockScore: number
  correctSubmissions: number
  totalSubmissions: number
  hitKeystrokes: number
  wrongItemIds: string[]
  elapsedSec: number
}

const PACK_LABELS: Readonly<Record<MinigamePack, string>> = {
  standard: '표준어',
  slang: '요즘 말',
  mixed: '섞어서',
}

function createInitialState(pool: TowerPool): GameState {
  return {
    status: 'running',
    endReason: null,
    currentItem: pickTowerItem(pool),
    blocks: [],
    floor: 0,
    shakes: 0,
    streak: 0,
    maxStreak: 0,
    recoveredCount: 0,
    blockScore: 0,
    correctSubmissions: 0,
    totalSubmissions: 0,
    hitKeystrokes: 0,
    wrongItemIds: [],
    elapsedSec: 0,
  }
}

export function TowerGameScreen({
  profile,
  pool,
  mode,
  onBack,
  onComplete,
}: TowerGameScreenProps) {
  const timeLimit = mode === 'timed'
  const [game, setGame] = useState(() => createInitialState(pool))
  const gameRef = useRef(game)
  const [input, setInput] = useState('')
  const inputRef = useRef('')
  const submissionGateRef = useRef<SubmissionGate>(INITIAL_SUBMISSION_GATE)
  const [feedback, setFeedback] = useState('낱말을 입력하고 Enter를 눌러요.')
  const [shakeNonce, setShakeNonce] = useState(0)
  const [selectedBlock, setSelectedBlock] = useState<TowerBlock | null>(null)
  const completedRef = useRef(false)

  function commitGame(next: GameState) {
    gameRef.current = next
    setGame(next)
  }

  useEffect(() => {
    if (game.status !== 'running') {
      return
    }

    const startedAt = performance.now() - gameRef.current.elapsedSec * 1_000
    const timer = window.setInterval(() => {
      const elapsedSec = (performance.now() - startedAt) / 1_000
      setGame((current) => {
        if (current.status !== 'running') {
          return current
        }

        const timedOut = timeLimit && elapsedSec >= TOWER_TIMED_DURATION_SEC
        const next: GameState = {
          ...current,
          elapsedSec: timedOut ? TOWER_TIMED_DURATION_SEC : elapsedSec,
          status: timedOut ? 'ended' : 'running',
          endReason: timedOut ? 'time' : current.endReason,
        }
        gameRef.current = next
        return next
      })
    }, 100)

    return () => window.clearInterval(timer)
  }, [game.status, timeLimit])

  useEffect(() => {
    if (game.status !== 'ended' || !game.endReason || completedRef.current) {
      return
    }

    completedRef.current = true
    const durationSec = Math.max(game.elapsedSec, 1)
    const accuracy =
      game.totalSubmissions === 0
        ? 0
        : (game.correctSubmissions / game.totalSubmissions) * 100
    const cpm = (game.hitKeystrokes / durationSec) * 60

    onComplete({
      pack: pool.pack,
      timeLimit,
      durationSec,
      score: timeLimit
        ? calculateTimedTowerScore(cpm, accuracy)
        : game.blockScore,
      floor: game.floor,
      shakes: game.shakes,
      maxStreak: game.maxStreak,
      recoveredCount: game.recoveredCount,
      correctSubmissions: game.correctSubmissions,
      totalSubmissions: game.totalSubmissions,
      hitKeystrokes: game.hitKeystrokes,
      wrongItemIds: game.wrongItemIds,
      blocks: game.blocks,
      endReason: game.endReason,
      slangFallback: pool.slangFallback,
    })
  }, [game, onComplete, pool.pack, pool.slangFallback, timeLimit])

  function applyInput(value: string) {
    inputRef.current = value
    setInput(value)
  }

  function clearInput() {
    applyInput('')
  }

  function submitValue(value: string) {
    const submitted = value.trim()
    clearInput()
    const current = gameRef.current
    const item = current.currentItem

    if (submitted === '' || current.status !== 'running' || !item) {
      return
    }

    if (submitted === item.text) {
      const result = applyTowerCorrect(current, item.text)
      const block: TowerBlock = {
        ...item,
        blockId: crypto.randomUUID(),
        floor: result.floor,
      }
      const nextItem = pickTowerItem(pool, item.id)
      const next: GameState = {
        ...current,
        currentItem: nextItem,
        blocks: [...current.blocks, block],
        floor: result.floor,
        shakes: result.shakes,
        streak: result.streak,
        maxStreak: Math.max(current.maxStreak, result.streak),
        recoveredCount: current.recoveredCount + (result.recovered ? 1 : 0),
        blockScore: current.blockScore + result.points,
        correctSubmissions: current.correctSubmissions + 1,
        totalSubmissions: current.totalSubmissions + 1,
        hitKeystrokes: current.hitKeystrokes + countKeystrokes(item.text),
      }
      commitGame(next)
      setFeedback(
        result.recovered
          ? `5연속 성공! ${result.floor}층을 쌓고 흔들림을 하나 회복했어요.`
          : `${result.floor}층 완성! +${result.points}점`,
      )
      return
    }

    const result = applyTowerMistake(current)
    commitGame({
      ...current,
      status: result.ended ? 'ended' : 'running',
      endReason: result.ended ? 'collapsed' : null,
      shakes: result.shakes,
      streak: result.streak,
      totalSubmissions: current.totalSubmissions + 1,
      wrongItemIds: [...current.wrongItemIds, item.id],
    })
    setFeedback(
      result.ended
        ? '세 번 흔들려 탑이 무너졌어요.'
        : `앗, 탑이 흔들렸어요. “${item.text}”을 다시 입력해요.`,
    )
    setShakeNonce((nonce) => nonce + 1)
  }

  function handleSubmitDecision(valueToSubmit: string | null) {
    if (valueToSubmit !== null) {
      submitValue(valueToSubmit)
    }
  }

  if (!game.currentItem) {
    return (
      <PageShell title="낱말 탑 쌓기" onBack={onBack} theme="candy">
        <section className="empty-state tower-empty-state">
          <span aria-hidden="true">🧱</span>
          <h2>쌓을 낱말이 부족해요</h2>
          <p>다른 꾸러미를 골라 다시 시작해 주세요.</p>
          <button
            className="button button--primary"
            type="button"
            onClick={onBack}
          >
            꾸러미 다시 고르기
          </button>
        </section>
      </PageShell>
    )
  }

  const remainingSec = Math.max(
    0,
    Math.ceil(TOWER_TIMED_DURATION_SEC - game.elapsedSec),
  )
  const scene = getTowerScene(game.floor)

  return (
    <PageShell
      title="낱말 탑 쌓기"
      eyebrow={`${PACK_LABELS[pool.pack]} · ${timeLimit ? '60초 도전' : '시간 제한 없음'}`}
      onBack={onBack}
      theme={pool.pack === 'standard' ? 'candy' : 'pixel'}
    >
      <div className="tower-game-layout">
        <section className="tower-scoreboard" aria-label="낱말 탑 점수판">
          <ScoreBadge label="높이" value={`${game.floor}층`} />
          <ScoreBadge label="연속" value={`${game.streak}개`} />
          <ScoreBadge label="점수" value={`${Math.round(game.blockScore)}점`} />
          <ScoreBadge
            label={timeLimit ? '남은 시간' : '쌓은 시간'}
            value={
              timeLimit
                ? `${remainingSec}초`
                : `${Math.floor(game.elapsedSec)}초`
            }
          />
          <div className="tower-shakes" aria-label={`흔들림 ${game.shakes}번`}>
            {Array.from({ length: TOWER_MAX_SHAKES }, (_, index) => (
              <span key={index} aria-hidden="true">
                {index < game.shakes ? '💥' : '🛡️'}
              </span>
            ))}
          </div>
          {!timeLimit ? (
            <button
              className="button button--ghost"
              type="button"
              onClick={() =>
                commitGame({
                  ...gameRef.current,
                  status: 'ended',
                  endReason: 'stopped',
                })
              }
            >
              여기까지 쌓기
            </button>
          ) : null}
        </section>

        {pool.slangFallback ? (
          <p className="word-rain-notice" role="status">
            요즘 말이 부족해서 표준어 블록을 섞었어요.
          </p>
        ) : null}

        <section
          className={`tower-board tower-board--${scene} ${shakeNonce ? 'tower-board--shake' : ''}`}
          key={shakeNonce}
          aria-label={`현재 낱말 탑 ${game.floor}층`}
        >
          <div className="tower-scene-label" aria-hidden="true">
            {scene === 'ground'
              ? '🌳 땅'
              : scene === 'cloud'
                ? '☁️ 구름'
                : '🪐 우주'}
          </div>
          <div className="tower-stack">
            {game.blocks.map((block) => (
              <button
                className={`tower-block tower-block--${block.kind}`}
                type="button"
                key={block.blockId}
                onClick={() => setSelectedBlock(block)}
                aria-label={`뜻 보기: ${block.text}`}
              >
                <small>{block.floor}층</small>
                <strong>{block.text}</strong>
              </button>
            ))}
            {game.blocks.length === 0 ? (
              <p className="tower-placeholder">첫 블록을 기다리고 있어요</p>
            ) : null}
          </div>
          <div className="tower-foundation" aria-hidden="true">
            정확하게 쌓는 튼튼한 바닥
          </div>
        </section>

        {selectedBlock ? (
          <section className="tower-meaning-card" aria-live="polite">
            <div>
              <p className="eyebrow">{selectedBlock.floor}층 낱말</p>
              <h2>{selectedBlock.text}</h2>
            </div>
            <p>{selectedBlock.meaning || '뜻을 준비하고 있어요.'}</p>
            {selectedBlock.standardForm ? (
              <small>비슷한 표준어: {selectedBlock.standardForm}</small>
            ) : null}
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setSelectedBlock(null)}
            >
              뜻 카드 닫기
            </button>
          </section>
        ) : null}

        <section className="tower-question" aria-labelledby="tower-word">
          <p className="eyebrow">NEXT BLOCK</p>
          <h2 id="tower-word">{game.currentItem.text}</h2>
          <p>같은 낱말을 정확히 입력해요.</p>
        </section>

        <form
          className="tower-input"
          onSubmit={(event) => {
            event.preventDefault()
            submitValue(inputRef.current)
          }}
        >
          <label className="typing-field">
            <span>탑 낱말 입력</span>
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
            className="button button--primary"
            type="submit"
            disabled={input.trim() === ''}
          >
            블록 쌓기
          </button>
        </form>

        <p className="tower-feedback" role="status" aria-live="polite">
          {feedback}
        </p>

        {profile.settings.keyboard === 'app' ? (
          <OnScreenKeyboard
            target={game.currentItem.text}
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
