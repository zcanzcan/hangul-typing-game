import { createStore, del, get, set } from 'idb-keyval'

import type { Mistake } from '../data/types'

const mistakeStore = createStore('hangul-typing-game-mistakes', 'mistakes')
const MISTAKES_KEY = 'items'

interface StoredMistake extends Mistake {
  correctStreak: number
}

async function getAllMistakes() {
  return (await get<StoredMistake[]>(MISTAKES_KEY, mistakeStore)) ?? []
}

export async function getMistakes(profileId: string) {
  const mistakes = await getAllMistakes()
  return mistakes.filter(
    (mistake) => mistake.profileId === profileId && !mistake.mastered,
  )
}

export async function recordMistakes(profileId: string, itemIds: string[]) {
  if (itemIds.length === 0) {
    return
  }

  const mistakes = await getAllMistakes()
  const now = new Date().toISOString()

  for (const itemId of new Set(itemIds)) {
    const existing = mistakes.find(
      (mistake) => mistake.profileId === profileId && mistake.itemId === itemId,
    )

    if (existing) {
      existing.count += 1
      existing.lastWrongAt = now
      existing.mastered = false
      existing.correctStreak = 0
    } else {
      mistakes.push({
        profileId,
        itemId,
        count: 1,
        lastWrongAt: now,
        mastered: false,
        correctStreak: 0,
      })
    }
  }

  await set(MISTAKES_KEY, mistakes, mistakeStore)
}

export async function recordCorrectReview(profileId: string, itemId: string) {
  const mistakes = await getAllMistakes()
  const existing = mistakes.find(
    (mistake) => mistake.profileId === profileId && mistake.itemId === itemId,
  )

  if (!existing) {
    return
  }

  existing.correctStreak += 1
  existing.mastered = existing.correctStreak >= 3
  await set(MISTAKES_KEY, mistakes, mistakeStore)
}

export async function clearMistakes() {
  await del(MISTAKES_KEY, mistakeStore)
}
