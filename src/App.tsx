import { useEffect, useState } from 'react'

import { loadPracticeContent } from './data/practice-content'
import type { PracticeContent, Profile, TypingMode } from './data/types'
import { MenuScreen } from './screens/MenuScreen'
import { MistakesScreen } from './screens/MistakesScreen'
import {
  PracticeScreen,
  type PracticeItem,
  type PracticeSummary,
} from './screens/PracticeScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { ResultScreen, type PracticeResult } from './screens/ResultScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StartScreen } from './screens/StartScreen'
import {
  clearMistakes,
  recordCorrectReview,
  recordMistakes,
} from './storage/mistakes'
import { loadProfile, saveProfile } from './storage/profile'
import { clearProgress, completeMode, isModeUnlocked } from './storage/progress'
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
  | 'result'
  | 'records'
  | 'mistakes'
  | 'settings'

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

function getScoreMode(mode: TypingMode): PracticeMode {
  if (mode === 'sentence') {
    return 'shortSentence'
  }

  return mode
}

export function App() {
  const [initialProfile] = useState(() => loadProfile())
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [screen, setScreen] = useState<Screen>(
    initialProfile ? 'menu' : 'start',
  )
  const [content, setContent] = useState<PracticeContent | null>(null)
  const [contentError, setContentError] = useState('')
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [practiceOverride, setPracticeOverride] = useState<
    PracticeItem[] | null
  >(null)
  const [reviewMode, setReviewMode] = useState(false)

  useEffect(() => {
    if (!profile || content) {
      return
    }

    let cancelled = false

    void loadPracticeContent()
      .then((loadedContent) => {
        if (!cancelled) {
          setContent(loadedContent)
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

  function getPracticeItems(mode: TypingMode): PracticeItem[] {
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
      return content.words
        .filter(({ audience }) => audience.includes(profile.ageGroup))
        .map(({ id, text, meaning, example, emoji }) => ({
          id,
          text,
          meaning,
          example,
          emoji,
        }))
    }

    return content.sentences
      .filter(
        ({ audience, kind }) =>
          kind === 'short' && audience.includes(profile.ageGroup),
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
          mode: getScoreMode(summary.mode),
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
      completeMode(summary.mode)
    }

    const saveResult = await savePracticeRecord({
      id: crypto.randomUUID(),
      profileId: profile.id,
      mode: summary.mode,
      stage: 1,
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
    setPracticeOverride([item])
    setReviewMode(true)
    setScreen(item.id.startsWith('sentence-') ? 'sentence' : 'word')
  }

  async function resetRecords() {
    await Promise.all([clearRecords(), clearMistakes()])
    clearProgress()
  }

  function updateProfile(nextProfile: Profile) {
    saveProfile(nextProfile)
    setProfile(nextProfile)
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

  return (
    <div className="app" data-font-size={profile.settings.fontSize}>
      {screen === 'menu' ? (
        <MenuScreen
          profile={profile}
          unlockedModes={unlockedModes}
          onNavigate={navigate}
        />
      ) : null}

      {(['position', 'word', 'sentence'] as const).map((mode) =>
        screen === mode ? (
          <PracticeScreen
            key={mode}
            title={practiceTitles[mode]}
            mode={mode}
            profile={profile}
            items={getPracticeItems(mode)}
            reviewMode={reviewMode}
            onBack={() => navigate('menu')}
            onComplete={(summary) => void finishPractice(summary)}
          />
        ) : null,
      )}

      {screen === 'result' && result ? (
        <ResultScreen
          result={result}
          onMain={() => navigate('menu')}
          onRecords={() => navigate('records')}
          onMistakes={() => navigate('mistakes')}
        />
      ) : null}

      {screen === 'records' ? (
        <RecordsScreen
          profile={profile}
          onBack={() => navigate('menu')}
          onMistakes={() => navigate('mistakes')}
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
          onBack={() => navigate('menu')}
          onSave={updateProfile}
          onResetRecords={resetRecords}
        />
      ) : null}
    </div>
  )
}
