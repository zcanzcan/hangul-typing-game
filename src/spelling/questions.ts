import type { Sentence } from '../data/types'

export interface SpellingQuestion {
  sentence: Sentence
  choices: [string, string]
}

export function buildSpellingQuestions(sentences: readonly Sentence[]) {
  return sentences
    .filter(
      (sentence): sentence is Sentence & { wrongForm: string } =>
        sentence.kind === 'spelling' && Boolean(sentence.wrongForm),
    )
    .map<SpellingQuestion>((sentence, index) => ({
      sentence,
      choices:
        index % 2 === 0
          ? [sentence.text, sentence.wrongForm]
          : [sentence.wrongForm, sentence.text],
    }))
}
