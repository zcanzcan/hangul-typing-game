export type AgeGroup = 'kid' | 'adult' | 'senior'
export type FontSize = 'normal' | 'large' | 'xlarge'
export type TypingMode = 'position' | 'word' | 'sentence'

export interface Word {
  id: string
  text: string
  meaning: string
  example?: string
  emoji?: string
  level: 1 | 2 | 3 | 4
  tags?: string[]
  audience: AgeGroup[]
  source?: string
}

export interface Sentence {
  id: string
  text: string
  kind: 'short' | 'long' | 'proverb' | 'spelling'
  meaning?: string
  wrongForm?: string
  audience: AgeGroup[]
}

export interface Profile {
  id: string
  nickname: string
  ageGroup: AgeGroup
  settings: {
    fontSize: FontSize
    timeLimit: boolean
    speech: boolean
    sfx: boolean
    slangMode: boolean
    keyboard: 'app' | 'device'
  }
  createdAt: string
}

export interface Record {
  id: string
  profileId: string
  mode: 'position' | 'word' | 'sentence' | 'minigame' | 'slang'
  stage: number
  cpm: number
  accuracy: number
  score: number
  durationSec: number
  isBest: boolean
  playedAt: string
}

export interface Mistake {
  profileId: string
  itemId: string
  count: number
  lastWrongAt: string
  mastered: boolean
}

export interface WordCollection {
  version: string
  items: Word[]
}

export interface SentenceCollection {
  version: string
  items: Sentence[]
}

export interface PracticeContent {
  words: Word[]
  sentences: Sentence[]
}
