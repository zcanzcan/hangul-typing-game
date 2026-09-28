import { useEffect, useState } from 'react'

import { loadPracticeContent } from './data/practice-content'
import type {
  AgeGroup,
  MinigamePack,
  PracticeContent,
  Profile,
  Slang,
  TypingMode,
} from './data/types'
import { createTowerPool, type TowerMode, type TowerPool } from './games/tower'
import { createWordRainPool, type WordRainPool } from './games/wordRain'
import { MenuScreen } from './screens/MenuScreen'
import {
  MeaningQuizScreen,
  type MeaningQuizSummary,
} from './screens/MeaningQuizScreen'
import { MistakesScreen } from './screens/MistakesScreen'
import {
  PracticeScreen,
  type PracticeItem,
  type PracticeSummary,
} from './screens/PracticeScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { ResultScreen, type PracticeResult } from './screens/ResultScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SpellingCorrectionScreen } from './screens/SpellingCorrectionScreen'
import {
  SpellingLessonScreen,
  type SpellingLessonSummary,
} from './screens/SpellingLessonScreen'
import {
  SlangGameScreen,
  type SlangGameSummary,
} from './screens/SlangGameScreen'
import {
  SlangQuizGameScreen,
  type SlangQuizSummary,
} from './screens/SlangQuizGameScreen'
import {
  SlangQuizResultScreen,
  type SlangQuizResult,
} from './screens/SlangQuizResultScreen'
import {
  SlangResultScreen,
  type SlangGameResult,
} from './screens/SlangResultScreen'
import { StartScreen } from './screens/StartScreen'
import { TowerGameScreen, type TowerSummary } from './screens/TowerGameScreen'
import {
  TowerResultScreen,
  type TowerResult,
} from './screens/TowerResultScreen'
import { TowerSetupScreen } from './screens/TowerSetupScreen'
import {
  WordChainGameScreen,
  type WordChainSummary,
} from './screens/WordChainGameScreen'
import {
  WordChainResultScreen,
  type WordChainResult,
} from './screens/WordChainResultScreen'
import {
  WordChainSetupScreen,
  type WordChainPlayerSeed,
} from './screens/WordChainSetupScreen'
import { WordStageScreen } from './screens/WordStageScreen'
import {
  WordRainGameScreen,
  type WordRainSummary,
} from './screens/WordRainGameScreen'
import {
  WordRainResultScreen,
  type WordRainResult,
} from './screens/WordRainResultScreen'
import { WordRainSetupScreen } from './screens/WordRainSetupScreen'
import { validateSlangFields } from './slang/filter'
import { fetchLatestSlang } from './slang/lifecycle'
import { getDailyWord } from './words'
import {
  getWordStageDefinition,
  getWordStageItems,
  type WordStage,
} from './practice/word-stages'
import { useVisualViewport } from './tablet/use-visual-viewport'
import { getPracticeTime } from './goals'
import { DailyGoalScreen } from './screens/DailyGoalScreen'
import {
  addCustomSlang,
  getCustomSlang,
  importCustomSlang,
  setCustomSlangStatus,
} from './storage/custom-slang'
import {
  clearMistakes,
  recordCorrectReview,
  recordMistakes,
} from './storage/mistakes'
import {
  activateProfile,
  addProfile,
  createProfile,
  getProfiles,
  loadProfile,
  saveProfile,
} from './storage/profile'
import {
  clearProgress,
  completeMode,
  completeWordStage,
  isModeUnlocked,
  isWordStageUnlocked,
} from './storage/progress'
import { clearRecords, savePracticeRecord } from './storage/records'
import {
  calculatePracticeMetrics,
  hasPassedStage,
  type PracticeMode,
} from './typing/metrics'

type Screen =
  | 'start'
  | 'menu'
  | 'position'
  | 'word'
  | 'sentence'
  | 'slang'
  | 'slang-result'
  | 'slang-quiz'
  | 'slang-quiz-result'
  | 'result'
  | 'records'
  | 'mistakes'
  | 'settings'
  | 'word-rain-setup'
  | 'word-rain'
  | 'word-rain-result'
  | 'tower-setup'
  | 'tower'
  | 'tower-result'
  | 'word-stages'
  | 'word-chain-setup'
  | 'word-chain'
  | 'word-chain-result'
  | 'long-sentence'
  | 'spelling'
  | 'daily-goal'
  | 'spelling-correction'
  | 'meaning-quiz'

const POSITION_ITEMS: PracticeItem[] = [
  { id: 'position-1', text: 'ㅁ' },
  { id: 'position-2', text: 'ㄴ' },
  { id: 'position-3', text: 'ㅇ' },
  { id: 'position-4', text: 'ㄹ' },
  { id: 'position-5', text: 'ㅓ' },
  { id: 'position-6', text: 'ㅏ' },
  { id: 'position-7', text: 'ㅣ' },
]

const ADULT_TARGET_CPM = 100

function getScoreMode(mode: TypingMode, stage = 1): PracticeMode {
  if (mode === 'sentence') {
    return stage === 1 ? 'shortSentence' : 'longSentence'
  }

  return mode
}

export function App() {
  useVisualViewport()

  const [initialProfile] = useState(() => loadProfile())
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [screen, setScreen] = useState<Screen>(
    initialProfile ? 'menu' : 'start',
  )
  const [content, setContent] = useState<PracticeContent | null>(null)
  const [contentError, setContentError] = useState('')
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [slangResult, setSlangResult] = useState<SlangGameResult | null>(null)
  const [slangQuizResult, setSlangQuizResult] =
    useState<SlangQuizResult | null>(null)
  const [wordRainPool, setWordRainPool] = useState<WordRainPool | null>(null)
  const [wordRainResult, setWordRainResult] = useState<WordRainResult | null>(
    null,
  )
  const [towerSession, setTowerSession] = useState<{
    pool: TowerPool
    mode: TowerMode
  } | null>(null)
  const [towerResult, setTowerResult] = useState<TowerResult | null>(null)
  const [wordChainSession, setWordChainSession] = useState<{
    players: WordChainPlayerSeed[]
    initialSoundRule: boolean
  } | null>(null)
  const [wordChainResult, setWordChainResult] =
    useState<WordChainResult | null>(null)
  const [wordStage, setWordStage] = useState<WordStage>(1)
  const [practiceOverride, setPracticeOverride] = useState<
    PracticeItem[] | null
  >(null)
  const [reviewMode, setReviewMode] = useState(false)

  useEffect(() => {
    if (!profile || content) {
      return
    }

    let cancelled = false

    void Promise.all([loadPracticeContent(), getCustomSlang()])
      .then(([loadedContent, customSlang]) => {
        if (!cancelled) {
          setContent({
            ...loadedContent,
            slang: [...customSlang, ...loadedContent.slang],
          })
          setContentError('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContentError('연습 데이터를 불러오지 못했어요. 새로고침해 주세요.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [content, profile])

  function startWithProfile(nextProfile: Profile) {
    saveProfile(nextProfile)
    setProfile(nextProfile)
    setScreen('menu')
  }

  function navigate(destination: Screen) {
    setPracticeOverride(null)
    setReviewMode(false)
    setScreen(destination)
  }

  function getPracticeItems(
    mode: TypingMode,
    sentenceKind: 'short' | 'long' = 'short',
  ): PracticeItem[] {
    if (practiceOverride) {
      return practiceOverride
    }

    if (!profile || !content) {
      return []
    }

    if (mode === 'position') {
      return POSITION_ITEMS
    }

    if (mode === 'word') {
      return getWordStageItems(content.words, profile.ageGroup, wordStage).map(
        ({ id, text, meaning, example, emoji, level }) => ({
          id,
          text,
          meaning,
          example,
          emoji,
          stage: level,
        }),
      )
    }

    return content.sentences
      .filter(
        ({ audience, kind }) =>
          kind === sentenceKind && audience.includes(profile.ageGroup),
      )
      .map(({ id, text, meaning }) => ({ id, text, meaning }))
  }

  async function finishPractice(summary: PracticeSummary) {
    if (!profile) {
      return
    }

    const metrics = profile.settings.timeLimit
      ? calculatePracticeMetrics({
          timeLimit: true,
          keystrokes: summary.keystrokes,
          durationSec: summary.durationSec,
          correctCharacters: summary.correctCharacters,
          presentedCharacters: summary.presentedCharacters,
          mode: getScoreMode(summary.mode, summary.stage),
        })
      : calculatePracticeMetrics({
          timeLimit: false,
          correctCharacters: summary.correctCharacters,
          presentedCharacters: summary.presentedCharacters,
          completedCount: summary.completedCount,
        })

    const passed =
      profile.ageGroup === 'adult'
        ? hasPassedStage({
            ageGroup: 'adult',
            accuracy: metrics.accuracy,
            cpm: metrics.timeLimit ? metrics.cpm : 0,
            targetCpm: ADULT_TARGET_CPM,
          })
        : hasPassedStage({
            ageGroup: profile.ageGroup,
            accuracy: metrics.accuracy,
          })

    if (passed && !reviewMode) {
      if (summary.mode === 'word') {
        completeWordStage(summary.stage as WordStage)
      } else {
        completeMode(summary.mode)
      }
    }

    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: summary.mode,
      stage: summary.stage,
      cpm: metrics.timeLimit ? metrics.cpm : 0,
      accuracy: metrics.accuracy,
      score: metrics.timeLimit ? metrics.score : 0,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: metrics.timeLimit,
      completedCount: summary.completedCount,
    })

    await Promise.all([
      recordMistakes(profile.id, summary.wrongItemIds),
      ...(reviewMode
        ? summary.correctItemIds.map((itemId) =>
            recordCorrectReview(profile.id, itemId),
          )
        : []),
    ])

    setResult({
      record: saveResult.record,
      difference: saveResult.difference,
      passed,
      wrongLabels: summary.wrongItemIds.map(
        (itemId) => summary.itemLabels[itemId] ?? itemId,
      ),
    })
    setPracticeOverride(null)
    setReviewMode(false)
    setScreen('result')
  }

  function startReview(item: PracticeItem) {
    if (item.stage && item.stage >= 1 && item.stage <= 3) {
      setWordStage(item.stage as WordStage)
    }
    setPracticeOverride([item])
    setReviewMode(true)
    setScreen(item.id.startsWith('sentence-') ? 'sentence' : 'word')
  }

  function startWordStage(stage: WordStage) {
    setPracticeOverride(null)
    setReviewMode(false)
    setWordStage(stage)
    setScreen('word')
  }

  async function resetRecords() {
    await Promise.all([clearRecords(), clearMistakes()])
    clearProgress()
  }

  function updateProfile(nextProfile: Profile) {
    saveProfile(nextProfile)
    setProfile(nextProfile)
  }

  function addFamilyProfile(nickname: string, ageGroup: AgeGroup) {
    const member = createProfile(nickname, ageGroup)
    addProfile(member)
    return member
  }

  function selectFamilyProfile(profileId: string) {
    const nextProfile = activateProfile(profileId)

    if (nextProfile) {
      setProfile(nextProfile)
      navigate('menu')
    }
  }

  async function addSlang(fields: {
    text: string
    meaning: string
    example: string
  }) {
    const text = fields.text.trim()
    const meaning = fields.meaning.trim()
    const example = fields.example.trim()

    if (!content || text === '' || meaning === '') {
      return { ok: false, message: '유행어와 뜻을 모두 입력해 주세요.' }
    }

    if (
      !validateSlangFields([text, meaning, example], content.blockedPatterns)
    ) {
      return {
        ok: false,
        message: '학생에게 알맞지 않은 말이에요. 다른 표현을 사용해 주세요.',
      }
    }

    const item: Slang = {
      id: `custom-${crypto.randomUUID()}`,
      text,
      meaning,
      ...(example ? { example } : {}),
      addedAt: new Date().toISOString().slice(0, 10),
      status: 'active',
      kidSafe: true,
      origin: 'custom',
    }
    await addCustomSlang(item)
    setContent((current) =>
      current ? { ...current, slang: [item, ...current.slang] } : current,
    )

    return { ok: true, message: `“${text}” 카드를 추가했어요.` }
  }

  async function changeCustomSlangStatus(
    itemId: string,
    status: Slang['status'],
  ) {
    const customItems = await setCustomSlangStatus(itemId, status)
    setContent((current) =>
      current
        ? {
            ...current,
            slang: [
              ...customItems,
              ...current.slang.filter(({ origin }) => origin === 'official'),
            ],
          }
        : current,
    )
    return status === 'archived'
      ? '옛 유행어 모음으로 옮겼어요.'
      : '현재 유행어로 다시 가져왔어요.'
  }

  async function refreshSlang() {
    const latest = await fetchLatestSlang()
    const customItems =
      content?.slang.filter(({ origin }) => origin === 'custom') ?? []
    setContent((current) =>
      current
        ? {
            ...current,
            slang: [
              ...customItems,
              ...latest.items.filter(({ origin }) => origin === 'official'),
            ],
            slangVersion: latest.version,
          }
        : current,
    )
    return latest.version
  }

  async function importSlangItems(items: Slang[]) {
    if (!content) {
      return { ok: false, message: '연습 데이터를 먼저 불러와 주세요.' }
    }

    const safeItems = items.filter((item) =>
      validateSlangFields(
        [item.text, item.meaning, item.example ?? ''],
        content.blockedPatterns,
      ),
    )
    if (safeItems.length !== items.length) {
      return {
        ok: false,
        message: '학생에게 알맞지 않은 말이 있어 가져오지 않았어요.',
      }
    }

    const customItems = await importCustomSlang(safeItems)
    setContent((current) =>
      current
        ? {
            ...current,
            slang: [
              ...customItems,
              ...current.slang.filter(({ origin }) => origin === 'official'),
            ],
          }
        : current,
    )
    return {
      ok: true,
      message: `${safeItems.length}개 유행어를 가져왔어요.`,
    }
  }

  async function finishSlangGame(summary: SlangGameSummary) {
    if (!profile) {
      return
    }

    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: 'slang',
      stage: 1,
      cpm: 0,
      accuracy: (summary.correctMeaningCount / 10) * 100,
      score: summary.score,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: true,
      completedCount: 10,
    })

    setSlangResult({
      record: saveResult.record,
      difference: saveResult.difference,
      correctMeaningCount: summary.correctMeaningCount,
      typingCorrectCount: summary.typingCorrectCount,
    })
    setScreen('slang-result')
  }

  async function finishSlangQuiz(summary: SlangQuizSummary) {
    if (!profile) {
      return
    }

    const accuracy =
      summary.questionCount === 0
        ? 0
        : (summary.correctCount / summary.questionCount) * 100
    const cpm = (summary.hitKeystrokes / summary.durationSec) * 60
    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: 'minigame',
      stage: 1,
      game: 'slangQuiz',
      pack: 'slang',
      cpm,
      accuracy,
      score: summary.score,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: profile.ageGroup !== 'senior',
      completedCount: summary.correctCount,
    })

    await recordMistakes(profile.id, summary.wrongItemIds)
    setSlangQuizResult({
      record: saveResult.record,
      difference: saveResult.difference,
      correctCount: summary.correctCount,
      questionCount: summary.questionCount,
      maxStreak: summary.maxStreak,
      hintCount: summary.hintCount,
    })
    setScreen('slang-quiz-result')
  }

  function startWordRain(pack: MinigamePack) {
    if (!profile || !content) {
      return
    }

    setWordRainPool(
      createWordRainPool({
        pack,
        ageGroup: profile.ageGroup,
        words: content.words,
        slang: content.slang,
      }),
    )
    setScreen('word-rain')
  }

  async function finishWordRain(summary: WordRainSummary) {
    if (!profile) {
      return
    }

    const accuracy =
      summary.totalSubmissions === 0
        ? 0
        : (summary.correctSubmissions / summary.totalSubmissions) * 100
    const cpm = (summary.hitKeystrokes / summary.durationSec) * 60
    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: 'minigame',
      stage: 1,
      game: 'wordRain',
      pack: summary.pack,
      cpm,
      accuracy,
      score: summary.score,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: true,
      completedCount: summary.removedCount,
    })

    await recordMistakes(profile.id, summary.missedItemIds)
    setWordRainResult({
      record: saveResult.record,
      difference: saveResult.difference,
      removedCount: summary.removedCount,
      missedCount: summary.missedCount,
      maxCombo: summary.maxCombo,
      slangItems: summary.slangItems,
    })
    setScreen('word-rain-result')
  }

  function startTower(pack: MinigamePack, mode: TowerMode) {
    if (!profile || !content) {
      return
    }

    setTowerSession({
      pool: createTowerPool({
        pack,
        ageGroup: profile.ageGroup,
        words: content.words,
        slang: content.slang,
      }),
      mode,
    })
    setScreen('tower')
  }

  async function finishTower(summary: TowerSummary) {
    if (!profile) {
      return
    }

    const accuracy =
      summary.totalSubmissions === 0
        ? 0
        : (summary.correctSubmissions / summary.totalSubmissions) * 100
    const cpm = (summary.hitKeystrokes / summary.durationSec) * 60
    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: 'minigame',
      stage: 1,
      game: 'tower',
      pack: summary.pack,
      cpm,
      accuracy,
      score: summary.score,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: summary.timeLimit,
      completedCount: summary.floor,
    })

    await recordMistakes(profile.id, summary.wrongItemIds)
    setTowerResult({
      record: saveResult.record,
      difference: saveResult.difference,
      blocks: summary.blocks,
      maxStreak: summary.maxStreak,
      shakes: summary.shakes,
      recoveredCount: summary.recoveredCount,
      endReason: summary.endReason,
    })
    setScreen('tower-result')
  }

  function startWordChain(
    players: WordChainPlayerSeed[],
    initialSoundRule: boolean,
  ) {
    setWordChainSession({ players, initialSoundRule })
    setScreen('word-chain')
  }

  async function finishWordChain(summary: WordChainSummary) {
    if (!profile) {
      return
    }

    let activeRecord: Awaited<ReturnType<typeof savePracticeRecord>> | null =
      null

    for (const player of summary.players.filter(({ computer }) => !computer)) {
      const attempts = player.acceptedCount + player.failures
      const result = await savePracticeRecord({
        id: crypto.randomUUID(),
        profileId: player.id,
        mode: 'minigame',
        stage: 1,
        game: 'wordChain',
        pack: 'standard',
        cpm: (player.acceptedCount / summary.durationSec) * 60,
        accuracy: attempts === 0 ? 0 : (player.acceptedCount / attempts) * 100,
        score: player.score,
        durationSec: summary.durationSec,
        playedAt: new Date().toISOString(),
        timeLimit: player.ageGroup !== 'senior',
        completedCount: player.acceptedCount,
      })

      if (player.id === profile.id) {
        activeRecord = result
      }
    }

    await recordMistakes(profile.id, summary.wrongItemIds)
    setWordChainResult({
      summary,
      record: activeRecord?.record ?? null,
      difference: activeRecord?.difference ?? null,
    })
    setScreen('word-chain-result')
  }

  async function finishSpellingLesson(summary: SpellingLessonSummary) {
    if (!profile) {
      return
    }

    const accuracy =
      summary.questionCount === 0
        ? 0
        : (summary.correctCount / summary.questionCount) * 100
    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: 'sentence',
      stage: 3,
      cpm: 0,
      accuracy,
      score: summary.correctCount * 100,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: false,
      completedCount: summary.correctCount,
    })

    await recordMistakes(profile.id, summary.wrongItemIds)
    setResult({
      record: saveResult.record,
      difference: saveResult.difference,
      passed: accuracy >= 80,
      wrongLabels: summary.wrongItemIds.map(
        (itemId) => summary.itemLabels[itemId] ?? itemId,
      ),
    })
    setScreen('result')
  }

  async function finishMeaningQuiz(summary: MeaningQuizSummary) {
    if (!profile) {
      return
    }

    const accuracy =
      summary.questionCount === 0
        ? 0
        : (summary.correctCount / summary.questionCount) * 100
    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: 'sentence',
      stage: 5,
      cpm: 0,
      accuracy,
      score: summary.correctCount * 100,
      durationSec: summary.durationSec,
      playedAt: new Date().toISOString(),
      timeLimit: false,
      completedCount: summary.correctCount,
    })
    await recordMistakes(profile.id, summary.wrongItemIds)
    setResult({
      record: saveResult.record,
      difference: saveResult.difference,
      passed: accuracy >= 80,
      wrongLabels: summary.wrongItemIds.map(
        (itemId) => summary.itemLabels[itemId] ?? itemId,
      ),
    })
    setScreen('result')
  }

  if (screen === 'start' || !profile) {
    return <StartScreen onStart={startWithProfile} />
  }

  if (!content) {
    return (
      <main className="loading-screen" data-theme="candy">
        <span aria-hidden="true">⌨️</span>
        <h1>연습장을 준비하고 있어요</h1>
        <p role={contentError ? 'alert' : undefined}>
          {contentError || '낱말과 문장을 불러오는 중이에요…'}
        </p>
      </main>
    )
  }

  const unlockedModes = {
    position: isModeUnlocked('position', profile.ageGroup),
    word: isModeUnlocked('word', profile.ageGroup),
    sentence: isModeUnlocked('sentence', profile.ageGroup),
  }
  const practiceTitles: Readonly<Record<TypingMode, string>> = {
    position: '자리 연습',
    word: '낱말 연습',
    sentence: '짧은 문장 연습',
  }
  const unlockedWordStages: Readonly<Record<WordStage, boolean>> = {
    1: isWordStageUnlocked(1),
    2: isWordStageUnlocked(2),
    3: isWordStageUnlocked(3),
  }

  return (
    <div className="app" data-font-size={profile.settings.fontSize}>
      {screen === 'menu' ? (
        <MenuScreen
          profile={profile}
          unlockedModes={unlockedModes}
          dailyWord={getDailyWord(content.words, profile.ageGroup)}
          dailyPracticeSec={getPracticeTime(profile.id)}
          onNavigate={navigate}
        />
      ) : null}

      {screen === 'word-stages' ? (
        <WordStageScreen
          profile={profile}
          words={content.words}
          unlockedStages={unlockedWordStages}
          onBack={() => navigate('menu')}
          onStart={startWordStage}
        />
      ) : null}

      {screen === 'daily-goal' ? (
        <DailyGoalScreen
          profileId={profile.id}
          nickname={profile.nickname}
          onBack={() => navigate('menu')}
        />
      ) : null}

      {(['position', 'word', 'sentence'] as const).map((mode) =>
        screen === mode ? (
          <PracticeScreen
            key={`${mode}-${mode === 'word' ? wordStage : 1}`}
            title={practiceTitles[mode]}
            eyebrow={
              mode === 'word'
                ? `${wordStage}단계 · ${getWordStageDefinition(wordStage).title}`
                : undefined
            }
            mode={mode}
            stage={mode === 'word' ? wordStage : 1}
            profile={profile}
            items={getPracticeItems(mode)}
            reviewMode={reviewMode}
            onBack={() =>
              navigate(
                reviewMode
                  ? 'mistakes'
                  : mode === 'word'
                    ? 'word-stages'
                    : 'menu',
              )
            }
            onComplete={(summary) => void finishPractice(summary)}
          />
        ) : null,
      )}

      {screen === 'long-sentence' ? (
        <PracticeScreen
          key="long-sentence"
          title="긴 문장 연습"
          eyebrow="성인 긴 글"
          mode="sentence"
          stage={2}
          profile={profile}
          items={getPracticeItems('sentence', 'long')}
          onBack={() => navigate('menu')}
          onComplete={(summary) => void finishPractice(summary)}
        />
      ) : null}

      {screen === 'spelling' ? (
        <SpellingLessonScreen
          items={content.sentences.filter(
            ({ kind, audience }) =>
              kind === 'spelling' && audience.includes(profile.ageGroup),
          )}
          onBack={() => navigate('menu')}
          onComplete={(summary) => void finishSpellingLesson(summary)}
        />
      ) : null}

      {screen === 'spelling-correction' ? (
        <SpellingCorrectionScreen
          items={content.sentences.filter(
            ({ kind, audience }) =>
              kind === 'spelling' && audience.includes(profile.ageGroup),
          )}
          onBack={() => navigate('menu')}
          onComplete={(summary) => void finishPractice(summary)}
        />
      ) : null}

      {screen === 'meaning-quiz' ? (
        <MeaningQuizScreen
          items={content.sentences.filter(({ audience }) =>
            audience.includes(profile.ageGroup),
          )}
          onBack={() => navigate('menu')}
          onComplete={(summary) => void finishMeaningQuiz(summary)}
        />
      ) : null}

      {screen === 'result' && result ? (
        <ResultScreen
          result={result}
          onMain={() => navigate('menu')}
          onRecords={() => navigate('records')}
          onMistakes={() => navigate('mistakes')}
          onNextStage={
            result.passed &&
            result.record.mode === 'word' &&
            result.record.stage < 3
              ? () => startWordStage((result.record.stage + 1) as WordStage)
              : undefined
          }
        />
      ) : null}

      {screen === 'slang' ? (
        <SlangGameScreen
          key={`slang-${content.slang.length}`}
          items={content.slang}
          ageGroup={profile.ageGroup}
          onBack={() => navigate('menu')}
          onComplete={(summary) => void finishSlangGame(summary)}
        />
      ) : null}

      {screen === 'slang-result' && slangResult ? (
        <SlangResultScreen
          result={slangResult}
          onMain={() => navigate('menu')}
          onReplay={() => navigate('slang')}
          onRecords={() => navigate('records')}
        />
      ) : null}

      {screen === 'slang-quiz' ? (
        <SlangQuizGameScreen
          key={`slang-quiz-${content.slang.length}-${profile.ageGroup}`}
          profile={profile}
          items={content.slang}
          onBack={() => navigate('menu')}
          onNeedMore={() => navigate('settings')}
          onComplete={(summary) => void finishSlangQuiz(summary)}
        />
      ) : null}

      {screen === 'slang-quiz-result' && slangQuizResult ? (
        <SlangQuizResultScreen
          result={slangQuizResult}
          onMain={() => navigate('menu')}
          onReplay={() => navigate('slang-quiz')}
          onRecords={() => navigate('records')}
          onMistakes={() => navigate('mistakes')}
        />
      ) : null}

      {screen === 'word-rain-setup' ? (
        <WordRainSetupScreen
          profile={profile}
          onBack={() => navigate('menu')}
          onStart={startWordRain}
        />
      ) : null}

      {screen === 'word-rain' && wordRainPool ? (
        <WordRainGameScreen
          key={`word-rain-${wordRainPool.pack}`}
          profile={profile}
          pool={wordRainPool}
          onBack={() => navigate('word-rain-setup')}
          onComplete={(summary) => void finishWordRain(summary)}
        />
      ) : null}

      {screen === 'word-rain-result' && wordRainResult ? (
        <WordRainResultScreen
          result={wordRainResult}
          onMain={() => navigate('menu')}
          onReplay={() =>
            startWordRain(wordRainResult.record.pack ?? 'standard')
          }
          onRecords={() => navigate('records')}
        />
      ) : null}

      {screen === 'tower-setup' ? (
        <TowerSetupScreen
          profile={profile}
          onBack={() => navigate('menu')}
          onStart={startTower}
        />
      ) : null}

      {screen === 'tower' && towerSession ? (
        <TowerGameScreen
          key={`tower-${towerSession.pool.pack}-${towerSession.mode}`}
          profile={profile}
          pool={towerSession.pool}
          mode={towerSession.mode}
          onBack={() => navigate('tower-setup')}
          onComplete={(summary) => void finishTower(summary)}
        />
      ) : null}

      {screen === 'tower-result' && towerResult && towerSession ? (
        <TowerResultScreen
          result={towerResult}
          onMain={() => navigate('menu')}
          onReplay={() =>
            startTower(towerResult.record.pack ?? 'standard', towerSession.mode)
          }
          onRecords={() => navigate('records')}
          onMistakes={() => navigate('mistakes')}
        />
      ) : null}

      {screen === 'word-chain-setup' ? (
        <WordChainSetupScreen
          profile={profile}
          profiles={getProfiles()}
          onBack={() => navigate('menu')}
          onStart={startWordChain}
        />
      ) : null}

      {screen === 'word-chain' && wordChainSession ? (
        <WordChainGameScreen
          key={`${wordChainSession.players.map(({ id }) => id).join('-')}-${wordChainSession.initialSoundRule}`}
          players={wordChainSession.players}
          words={content.words.filter(({ audience }) =>
            audience.includes(profile.ageGroup),
          )}
          initialSoundRule={wordChainSession.initialSoundRule}
          onBack={() => navigate('word-chain-setup')}
          onComplete={(summary) => void finishWordChain(summary)}
        />
      ) : null}

      {screen === 'word-chain-result' && wordChainResult ? (
        <WordChainResultScreen
          result={wordChainResult}
          onMain={() => navigate('menu')}
          onReplay={() => setScreen('word-chain')}
          onRecords={() => navigate('records')}
        />
      ) : null}

      {screen === 'records' ? (
        <RecordsScreen
          profile={profile}
          onBack={() => navigate('menu')}
          onMistakes={() => navigate('mistakes')}
          onAddProfile={addFamilyProfile}
          onSelectProfile={selectFamilyProfile}
        />
      ) : null}

      {screen === 'mistakes' ? (
        <MistakesScreen
          profileId={profile.id}
          content={content}
          onBack={() => navigate('menu')}
          onPractice={startReview}
        />
      ) : null}

      {screen === 'settings' ? (
        <SettingsScreen
          profile={profile}
          slangItems={content.slang}
          slangVersion={content.slangVersion}
          onBack={() => navigate('menu')}
          onSave={updateProfile}
          onResetRecords={resetRecords}
          onAddSlang={addSlang}
          onSetSlangStatus={changeCustomSlangStatus}
          onRefreshSlang={refreshSlang}
          onImportSlang={importSlangItems}
        />
      ) : null}
    </div>
  )
}
