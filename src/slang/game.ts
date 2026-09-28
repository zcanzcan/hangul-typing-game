import type { Slang } from '../data/types'

const FALLBACK_MEANINGS = [
  '마음이 편안하고 걱정이 없는 상태.',
  '서로 힘을 모아 함께 일하는 것.',
  '새로운 것을 배우며 실력을 키우는 일.',
]

export interface SlangQuestion {
  slang: Slang
  choices: string[]
}

export interface SlangScoreInput {
  meaningCorrect: boolean
  typingCorrect: boolean
  streakBefore: number
}

export interface SlangScoreResult {
  points: number
  nextStreak: number
  comboBonus: number
}

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[targetIndex]] = [result[targetIndex], result[index]]
  }

  return result
}

export function calculateSlangScore({
  meaningCorrect,
  typingCorrect,
  streakBefore,
}: SlangScoreInput): SlangScoreResult {
  if (!meaningCorrect) {
    return { points: 0, nextStreak: 0, comboBonus: 0 }
  }

  const nextStreak = streakBefore + 1
  const comboBonus = nextStreak >= 3 ? 20 : 0

  return {
    points: 100 + (typingCorrect ? 50 : 0) + comboBonus,
    nextStreak,
    comboBonus,
  }
}

export function buildSlangQuestions(
  items: readonly Slang[],
  count = 10,
  random: () => number = Math.random,
): SlangQuestion[] {
  const activeItems = items.filter(
    ({ kidSafe, status }) => kidSafe && status === 'active',
  )

  if (activeItems.length === 0) {
    return []
  }

  const customItems = shuffled(
    activeItems.filter(({ origin }) => origin === 'custom'),
    random,
  )
  const officialItems = shuffled(
    activeItems.filter(({ origin }) => origin === 'official'),
    random,
  )
  const orderedItems = [...customItems, ...officialItems]
  const questions = Array.from(
    { length: count },
    (_, index) => orderedItems[index % orderedItems.length],
  )

  return questions.map((slang) => {
    const distractors = shuffled(
      activeItems
        .filter(({ id }) => id !== slang.id)
        .map(({ meaning }) => meaning),
      random,
    )
    const choices = [
      slang.meaning,
      ...distractors,
      ...FALLBACK_MEANINGS,
    ].filter((meaning, index, meanings) => meanings.indexOf(meaning) === index)

    return {
      slang,
      choices: shuffled(choices.slice(0, 4), random),
    }
  })
}
