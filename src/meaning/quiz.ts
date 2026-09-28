import type { Sentence } from '../data/types'

const FALLBACK_MEANINGS = [
  '아무 준비 없이 일을 시작한다는 뜻.',
  '작은 일은 중요하지 않다는 뜻.',
  '혼자서 모든 일을 해결한다는 뜻.',
]

export interface MeaningQuestion {
  sentence: Sentence
  choices: string[]
}

export function buildMeaningQuestions(sentences: readonly Sentence[]) {
  const eligible = sentences.filter(
    (sentence): sentence is Sentence & { meaning: string } =>
      sentence.kind === 'proverb' && Boolean(sentence.meaning),
  )

  return eligible.map((sentence, index) => {
    const distractors = [
      ...eligible
        .filter(({ id }) => id !== sentence.id)
        .map(({ meaning }) => meaning),
      ...FALLBACK_MEANINGS,
    ].filter(
      (meaning, meaningIndex, values) =>
        values.indexOf(meaning) === meaningIndex,
    )
    const choices = [sentence.meaning, ...distractors.slice(0, 3)]
    const rotation = index % choices.length
    return {
      sentence,
      choices: [...choices.slice(rotation), ...choices.slice(0, rotation)],
    }
  })
}
