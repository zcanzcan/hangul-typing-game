export interface LiteratureWork {
  id: string
  version: string
  title: string
  author: string
  category: '고전문학' | '근대문학' | '개발 테스트'
  description: string
  edition: string
  sourceName: string
  sourceUrl: string
  licenseName: string
  licenseUrl: string
  usage: string
  processing: string
  verifiedAt: string
  verification: 'verified' | 'fixture'
  passages: string[]
}

export interface LiteratureRecord {
  id: string
  profileId: string
  workId: string
  workVersion: string
  title: string
  playedAt: string
  durationSec: number
  cpm: number
  keystrokes: number
  accuracy: number
  completedCount: number
  checks: number
}
