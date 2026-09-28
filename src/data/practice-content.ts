import type {
  PracticeContent,
  SentenceCollection,
  WordCollection,
} from './types'

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`연습 데이터를 불러오지 못했습니다: ${path}`)
  }

  return response.json() as Promise<T>
}

export async function loadPracticeContent(): Promise<PracticeContent> {
  const [wordCollection, sentenceCollection] = await Promise.all([
    fetchJson<WordCollection>('data/words.json'),
    fetchJson<SentenceCollection>('data/sentences.json'),
  ])

  return {
    words: wordCollection.items,
    sentences: sentenceCollection.items,
  }
}
