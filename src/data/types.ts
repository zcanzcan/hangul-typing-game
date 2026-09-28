export type AgeGroup = 'kid' | 'adult' | 'senior'
export type FontSize = 'normal' | 'large' | 'xlarge'
export type TypingMode = 'position' | 'word' | 'sentence'
export type Minigame = 'wordRain' | 'wordChain' | 'tower' | 'slangQuiz'
export type MinigamePack = 'standard' | 'slang' | 'mixed'

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

export interface Slang {
  id: string
  text: string
  meaning: string
  example?: string
  standardForm?: string
  addedAt: string
  popularFrom?: string
  source?: string
  status: 'active' | 'archived'
  kidSafe: boolean
  origin: 'official' | 'custom'
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
    minigameSpeed?: 'slow' | 'normal' | 'fast'
  }
  createdAt: string
}

export interface Record {
  id: string
  profileId: string
  mode: 'position' | 'word' | 'sentence' | 'minigame' | 'slang'
  stage: number
  game?: Minigame
  pack?: MinigamePack
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

export interface SlangCollection {
  version: string
  items: Slang[]
}

export interface BlocklistCollection {
  version: string
  patterns: string[]
}

export interface PracticeContent {
  words: Word[]
  sentences: Sentence[]
  slang: Slang[]
  blockedPatterns: string[]
}
