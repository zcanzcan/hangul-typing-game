import { useEffect, useMemo, useRef, useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { Word } from '../data/types'
import {
  applyChainFailure,
  getAllowedStartCharacters,
  getChainCandidates,
  getChainHint,
  getChainWordScore,
  pickComputerWord,
  validateChainWord,
  WORD_CHAIN_HINTS,
} from '../games/wordChain'
import type { WordChainPlayerSeed } from './WordChainSetupScreen'

export interface WordChainPlayerResult extends WordChainPlayerSeed {
  score: number
  acceptedCount: number
  failures: number
  eliminated: boolean
}

export interface WordChainSummary {
  players: WordChainPlayerResult[]
  chain: Word[]
  durationSec: number
  winnerId: string | null
  submissionCount: number
  correctCount: number
  wrongItemIds: string[]
}

interface WordChainGameScreenProps {
  players: WordChainPlayerSeed[]
  words: Word[]
  initialSoundRule: boolean
  onBack: () => void
  onComplete: (summary: WordChainSummary) => void
}

const VALIDATION_MESSAGES = {
  'too-short': '두 글자 이상 낱말을 입력해 주세요.',
  'not-in-list': '아직 우리 낱말 목록에 없는 말이에요.',
  'already-used': '이미 나온 말이에요. 다른 낱말을 골라 주세요.',
  'dead-end': '다음 사람이 이을 수 있는 다른 낱말을 골라 주세요.',
} as const

function getTurnLimit(ageGroup: WordChainPlayerSeed['ageGroup']) {
  return ageGroup === 'kid' ? 20 : ageGroup === 'adult' ? 10 : null
}

function nextActiveIndex(
  players: WordChainPlayerResult[],
  currentIndex: number,
) {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidate = (currentIndex + offset) % players.length
    if (!players[candidate].eliminated) {
      return candidate
    }
  }
  return currentIndex
}

export function WordChainGameScreen({
  players: playerSeeds,
  words,
  initialSoundRule,
  onBack,
  onComplete,
}: WordChainGameScreenProps) {
  const pool = useMemo(
    () => words.filter(({ text }) => Array.from(text).length >= 2),
    [words],
  )
  const initialWord = useMemo(
    () =>
      pool.find(
        (word) =>
          getChainCandidates({
            previousWord: word.text,
            words: pool,
            usedWordIds: new Set([word.id]),
            applyInitialSoundRule: initialSoundRule,
          }).length > 0,
      ) ?? pool[0],
    [initialSoundRule, pool],
  )
  const [players, setPlayers] = useState<WordChainPlayerResult[]>(() =>
    playerSeeds.map((player) => ({
      ...player,
      score: 0,
      acceptedCount: 0,
      failures: 0,
      eliminated: false,
    })),
  )
  const [chain, setChain] = useState<Word[]>(() =>
    initialWord ? [initialWord] : [],
  )
  const [turnIndex, setTurnIndex] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState('첫 낱말의 끝을 이어 주세요.')
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([])
  const [ended, setEnded] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const completed = useRef(false)
  const currentPlayer = players[turnIndex]
  const previousWord = chain.at(-1)
  const usedWordIds = useMemo(() => new Set(chain.map(({ id }) => id)), [chain])
  const candidates = previousWord
    ? getChainCandidates({
        previousWord: previousWord.text,
        words: pool,
        usedWordIds,
        applyInitialSoundRule: initialSoundRule,
      })
    : []

  function endGame(
    nextPlayers: WordChainPlayerResult[],
    winnerId: string | null,
  ) {
    setPlayers(
      nextPlayers.map((player) =>
        player.id === winnerId
          ? { ...player, score: player.score + 50 }
          : player,
      ),
    )
    setEnded(true)
  }

  function failCurrentTurn(message: string, wrongItemId?: string) {
    if (ended) {
      return
    }

    setSubmissionCount((count) => count + 1)
    if (wrongItemId) {
      setWrongItemIds((items) => [...items, wrongItemId])
    }

    const failure = applyChainFailure(currentPlayer.failures)
    const nextPlayers = players.map((player, index) =>
      index === turnIndex ? { ...player, ...failure } : player,
    )
    const activePlayers = nextPlayers.filter(({ eliminated }) => !eliminated)
    setFeedback(
      failure.eliminated
        ? `${currentPlayer.nickname}님이 세 번 틀려 이번 판에서 쉬어요.`
        : message,
    )
    setInput('')

    if (activePlayers.length <= 1) {
      endGame(nextPlayers, activePlayers[0]?.id ?? null)
      return
    }

    setPlayers(nextPlayers)
    setTurnIndex(nextActiveIndex(nextPlayers, turnIndex))
    setHintCount(0)
  }

  function acceptWord(word: Word, quick: boolean) {
    const points = getChainWordScore(word.text, quick)
    const nextPlayers = players.map((player, index) =>
      index === turnIndex
        ? {
            ...player,
            score: player.score + points,
            acceptedCount: player.acceptedCount + 1,
          }
        : player,
    )
    const nextChain = [...chain, word]
    const nextUsedIds = new Set(nextChain.map(({ id }) => id))
    const followUps = getChainCandidates({
      previousWord: word.text,
      words: pool,
      usedWordIds: nextUsedIds,
      applyInitialSoundRule: initialSoundRule,
    })

    setPlayers(nextPlayers)
    setChain(nextChain)
    setCorrectCount((count) => count + 1)
    setSubmissionCount((count) => count + 1)
    setFeedback(`${word.text}! ${points}점을 얻었어요.`)
    setInput('')
    setHintCount(0)

    if (followUps.length === 0) {
      endGame(nextPlayers, currentPlayer.id)
      return
    }

    setTurnIndex(nextActiveIndex(nextPlayers, turnIndex))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!previousWord || !currentPlayer || currentPlayer.computer || ended) {
      return
    }

    const validation = validateChainWord({
      input,
      previousWord: previousWord.text,
      words: pool,
      usedWordIds,
      ageGroup: currentPlayer.ageGroup,
      applyInitialSoundRule: initialSoundRule,
    })

    if (!validation.ok || !validation.word) {
      const message =
        validation.code === 'wrong-start'
          ? `끝 글자 ${validation.expectedStarts?.join(' 또는 ')}로 시작해야 해요.`
          : VALIDATION_MESSAGES[
              validation.code as keyof typeof VALIDATION_MESSAGES
            ]
      failCurrentTurn(message, validation.word?.id)
      return
    }

    const limit = getTurnLimit(currentPlayer.ageGroup)
    acceptWord(
      validation.word,
      limit !== null && secondsLeft !== null && secondsLeft >= limit / 2,
    )
  }

  useEffect(() => {
    if (!currentPlayer || ended) {
      return
    }

    const limit = getTurnLimit(currentPlayer.ageGroup)
    const resetTimer = window.setTimeout(() => setSecondsLeft(limit), 0)

    if (limit === null || currentPlayer.computer) {
      return () => window.clearTimeout(resetTimer)
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer)
          window.setTimeout(
            () => failCurrentTurn('시간이 지났어요. 다음 차례로 넘어가요.'),
            0,
          )
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      window.clearTimeout(resetTimer)
      window.clearInterval(timer)
    }
    // The timer follows the current turn snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.length, currentPlayer, ended])

  useEffect(() => {
    if (!currentPlayer?.computer || ended) {
      return
    }

    const timer = window.setTimeout(() => {
      const word = pickComputerWord(candidates)
      if (word) {
        acceptWord(word, false)
      } else {
        const nextPlayers = players.map((player, index) =>
          index === turnIndex ? { ...player, eliminated: true } : player,
        )
        const winner = nextPlayers.find(({ eliminated }) => !eliminated)
        endGame(nextPlayers, winner?.id ?? null)
      }
    }, 800)

    return () => window.clearTimeout(timer)
    // Computer action is keyed to the current turn and chain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.length, currentPlayer?.id, ended])

  useEffect(() => {
    if (!ended || completed.current) {
      return
    }
    completed.current = true
    const winner = players.find(({ eliminated }) => !eliminated)
    onComplete({
      players,
      chain,
      durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      winnerId: winner?.id ?? null,
      submissionCount,
      correctCount,
      wrongItemIds,
    })
  }, [
    chain,
    correctCount,
    ended,
    onComplete,
    players,
    submissionCount,
    wrongItemIds,
    startedAt,
  ])

  const canUseHint =
    currentPlayer &&
    !currentPlayer.computer &&
    currentPlayer.ageGroup !== 'adult' &&
    hintCount < WORD_CHAIN_HINTS

  return (
    <PageShell title="끝말잇기 타자" onBack={onBack} theme="candy">
      <div className="word-chain-game">
        <section className="word-chain-players" aria-label="참가자 점수">
          {players.map((player, index) => (
            <article
              className={`${index === turnIndex && !ended ? 'is-turn' : ''} ${player.eliminated ? 'is-eliminated' : ''}`}
              key={player.id}
            >
              <strong>
                {player.computer ? '🤖 ' : ''}
                {player.nickname}
              </strong>
              <span>
                {player.score}점 · 실패 {player.failures}/3
              </span>
              {player.eliminated ? <b>탈락</b> : null}
            </article>
          ))}
        </section>

        <section className="word-chain-board">
          <p className="eyebrow">WORD CHAIN</p>
          <div className="word-chain-line" aria-label="지금까지 이은 낱말">
            {chain.map((word, index) => (
              <span key={`${word.id}-${index}`}>{word.text}</span>
            ))}
          </div>
          {previousWord && currentPlayer ? (
            <div className="word-chain-turn">
              <span aria-hidden="true">
                {currentPlayer.computer ? '🤖' : '⌨️'}
              </span>
              <div>
                <p>{currentPlayer.nickname}님 차례</p>
                <h2>
                  {getAllowedStartCharacters(
                    previousWord.text,
                    initialSoundRule,
                  ).join(' 또는 ')}
                  로 시작해요
                </h2>
              </div>
              <strong>
                {secondsLeft === null ? '천천히' : `${secondsLeft}초`}
              </strong>
            </div>
          ) : null}

          {!currentPlayer?.computer ? (
            <form className="word-chain-input" onSubmit={submit}>
              <label className="field">
                <span>이을 낱말</span>
                <input
                  aria-label="이을 낱말"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  autoComplete="off"
                  autoFocus
                  disabled={ended}
                />
              </label>
              <button
                className="button button--primary"
                type="submit"
                disabled={input.trim() === '' || ended}
              >
                잇기
              </button>
              {canUseHint ? (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => {
                    setHintCount((count) => count + 1)
                    setFeedback(
                      `힌트: ${getChainHint(candidates)}로 시작하는 낱말이 있어요.`,
                    )
                  }}
                >
                  힌트 {WORD_CHAIN_HINTS - hintCount}회
                </button>
              ) : null}
            </form>
          ) : (
            <p className="word-chain-thinking">
              한글봇이 낱말을 고르는 중이에요…
            </p>
          )}
          <p className="word-chain-feedback" role="status">
            {feedback}
          </p>
        </section>
      </div>
    </PageShell>
  )
}
