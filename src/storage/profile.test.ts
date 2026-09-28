import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  activateProfile,
  addProfile,
  createProfile,
  getProfiles,
  loadProfile,
  saveProfile,
} from './profile'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'profile-id') })
})

describe('여러 프로필 저장', () => {
  it('기존 단일 프로필을 가족 프로필 목록으로 옮긴다', () => {
    const legacyProfile = createProfile('기존별명', 'adult')
    localStorage.setItem(
      'hangul-game:profile:v1',
      JSON.stringify({ version: 1, profile: legacyProfile }),
    )

    expect(loadProfile()?.nickname).toBe('기존별명')
    expect(getProfiles().map(({ nickname }) => nickname)).toEqual(['기존별명'])
  })

  it('가족을 추가하고 선택한 프로필을 현재 사용자로 바꾼다', () => {
    const first = { ...createProfile('첫째', 'kid'), id: 'first' }
    const second = { ...createProfile('둘째', 'senior'), id: 'second' }
    saveProfile(first)
    addProfile(second)

    expect(getProfiles()).toHaveLength(2)
    expect(loadProfile()?.id).toBe('first')
    expect(activateProfile('second')?.nickname).toBe('둘째')
    expect(loadProfile()?.id).toBe('second')
  })
})
