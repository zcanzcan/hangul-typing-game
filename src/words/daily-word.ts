import type { AgeGroup, Word } from '../data/types'

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hashDateKey(dateKey: string) {
  return Array.from(dateKey).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  )
}

export function getDailyWord(
  words: readonly Word[],
  ageGroup: AgeGroup,
  dateKey = getLocalDateKey(),
) {
  const eligible = words.filter(
    ({ audience, meaning }) =>
      audience.includes(ageGroup) && meaning.trim() !== '',
  )

  if (eligible.length === 0) {
    return null
  }

  return eligible[hashDateKey(dateKey) % eligible.length]
}
