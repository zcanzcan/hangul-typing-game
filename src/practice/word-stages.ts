import type { AgeGroup, Word } from '../data/types'

export type WordStage = 1 | 2 | 3

export interface WordStageDefinition {
  stage: WordStage
  title: string
  description: string
  examples: string
  emoji: string
}

export const WORD_STAGES: readonly WordStageDefinition[] = [
  {
    stage: 1,
    title: '받침 없는 글자',
    description: '입 모양이 단순한 낱말부터 천천히 익혀요.',
    examples: '나무 · 사과 · 바다',
    emoji: '🌱',
  },
  {
    stage: 2,
    title: '받침 연습',
    description: '글자 아래에 오는 받침까지 정확하게 입력해요.',
    examples: '학교 · 연필 · 우산',
    emoji: '🧩',
  },
  {
    stage: 3,
    title: '쌍자음·겹받침',
    description: 'Shift로 쓰는 쌍자음과 겹받침에 도전해요.',
    examples: '까치 · 토끼 · 닭',
    emoji: '🚀',
  },
]

export function getWordStageDefinition(stage: WordStage) {
  return WORD_STAGES.find((definition) => definition.stage === stage)!
}

export function getWordStageItems(
  words: readonly Word[],
  ageGroup: AgeGroup,
  stage: WordStage,
) {
  return words.filter(
    (word) => word.level === stage && word.audience.includes(ageGroup),
  )
}
