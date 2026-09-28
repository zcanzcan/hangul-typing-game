import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { AgeGroup, FontSize, Profile } from '../data/types'
import { applyAgePreset } from '../storage/profile'

const AGE_LABELS: Readonly<Record<AgeGroup, string>> = {
  kid: '초등학생',
  adult: '성인',
  senior: '어르신',
}

const FONT_LABELS: Readonly<Record<FontSize, string>> = {
  normal: '보통',
  large: '크게',
  xlarge: '아주 크게',
}

interface SettingsScreenProps {
  profile: Profile
  onBack: () => void
  onSave: (profile: Profile) => void
  onResetRecords: () => Promise<void>
}

export function SettingsScreen({
  profile,
  onBack,
  onSave,
  onResetRecords,
}: SettingsScreenProps) {
  const [draft, setDraft] = useState(profile)
  const [message, setMessage] = useState('')

  function changeAgeGroup(ageGroup: AgeGroup) {
    setDraft((current) => applyAgePreset(current, ageGroup))
    setMessage('연령대 기본 설정을 적용했어요.')
  }

  function saveSettings() {
    onSave(draft)
    setMessage('설정을 저장했어요.')
  }

  async function resetRecords() {
    if (!window.confirm('기록과 틀린 낱말을 모두 초기화할까요?')) {
      return
    }

    await onResetRecords()
    setMessage('기록을 초기화했어요.')
  }

  return (
    <PageShell title="설정" eyebrow={profile.nickname} onBack={onBack}>
      <div className="settings-layout">
        <fieldset className="settings-card">
          <legend>연령대</legend>
          <div className="segmented-control">
            {(Object.keys(AGE_LABELS) as AgeGroup[]).map((ageGroup) => (
              <button
                type="button"
                key={ageGroup}
                aria-pressed={draft.ageGroup === ageGroup}
                onClick={() => changeAgeGroup(ageGroup)}
              >
                {AGE_LABELS[ageGroup]}
              </button>
            ))}
          </div>
          <p>
            시간 제한:{' '}
            <strong>{draft.settings.timeLimit ? '사용' : '사용 안 함'}</strong>
          </p>
        </fieldset>

        <fieldset className="settings-card">
          <legend>글자 크기</legend>
          <div className="segmented-control">
            {(Object.keys(FONT_LABELS) as FontSize[]).map((fontSize) => (
              <button
                type="button"
                key={fontSize}
                aria-pressed={draft.settings.fontSize === fontSize}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    settings: { ...current.settings, fontSize },
                  }))
                }
              >
                {FONT_LABELS[fontSize]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="settings-card">
          <legend>입력과 효과</legend>
          <label className="toggle-row">
            <span>
              <strong>효과음</strong>
              <small>정답과 축하 효과음을 켜거나 꺼요.</small>
            </span>
            <input
              type="checkbox"
              checked={draft.settings.sfx}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  settings: { ...current.settings, sfx: event.target.checked },
                }))
              }
            />
          </label>
          <div className="toggle-row">
            <span>
              <strong>입력 키보드</strong>
              <small>기기 키보드나 화면 키보드를 선택해요.</small>
            </span>
            <select
              aria-label="입력 키보드"
              value={draft.settings.keyboard}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    keyboard: event.target.value as 'app' | 'device',
                  },
                }))
              }
            >
              <option value="device">기기 키보드</option>
              <option value="app">화면 키보드</option>
            </select>
          </div>
        </fieldset>

        <div className="button-row">
          <button
            className="button button--primary"
            type="button"
            onClick={saveSettings}
          >
            설정 저장
          </button>
          <button
            className="button button--danger"
            type="button"
            onClick={resetRecords}
          >
            기록 초기화
          </button>
        </div>
        {message ? (
          <p className="settings-message" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}
