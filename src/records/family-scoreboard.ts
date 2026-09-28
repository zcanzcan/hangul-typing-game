import type { Profile } from '../data/types'
import type { StoredRecord } from '../storage/records'

export interface FamilyStanding {
  profile: Profile
  bestScore: number
  bestAccuracy: number
  bestCpm: number
  playCount: number
}

export function buildFamilyStandings(
  profiles: Profile[],
  records: StoredRecord[],
): FamilyStanding[] {
  return profiles
    .map((profile) => {
      const profileRecords = records.filter(
        ({ profileId }) => profileId === profile.id,
      )

      return {
        profile,
        bestScore: Math.max(0, ...profileRecords.map(({ score }) => score)),
        bestAccuracy: Math.max(
          0,
          ...profileRecords.map(({ accuracy }) => accuracy),
        ),
        bestCpm: Math.max(0, ...profileRecords.map(({ cpm }) => cpm)),
        playCount: profileRecords.length,
      }
    })
    .sort(
      (a, b) =>
        b.bestScore - a.bestScore ||
        b.bestAccuracy - a.bestAccuracy ||
        b.playCount - a.playCount ||
        a.profile.createdAt.localeCompare(b.profile.createdAt),
    )
}
