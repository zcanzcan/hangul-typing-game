import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { AgeGroup, FontSize, Profile, Slang } from '../data/types'
import {
  buildCustomSlangExport,
  parseCustomSlangImport,
} from '../slang/lifecycle'
import { applyAgePreset } from '../storage/profile'
import { useKoreanSpeech } from '../speech'

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

const SPEED_LABELS = {
  slow: '느리게',
  normal: '보통',
  fast: '빠르게',
} as const

interface SettingsScreenProps {
  profile: Profile
  slangItems: Slang[]
  slangVersion: string
  onBack: () => void
  onSave: (profile: Profile) => void
  onResetRecords: () => Promise<void>
  onAddSlang: (fields: {
    text: string
    meaning: string
    example: string
  }) => Promise<{ ok: boolean; message: string }>
  onSetSlangStatus: (itemId: string, status: Slang['status']) => Promise<string>
  onRefreshSlang: () => Promise<string>
  onImportSlang: (items: Slang[]) => Promise<{ ok: boolean; message: string }>
}

export function SettingsScreen({
  profile,
  slangItems,
  slangVersion,
  onBack,
  onSave,
  onResetRecords,
  onAddSlang,
  onSetSlangStatus,
  onRefreshSlang,
  onImportSlang,
}: SettingsScreenProps) {
  const [draft, setDraft] = useState(profile)
  const [message, setMessage] = useState('')
  const [slangText, setSlangText] = useState('')
  const [slangMeaning, setSlangMeaning] = useState('')
  const [slangExample, setSlangExample] = useState('')
  const [isAddingSlang, setIsAddingSlang] = useState(false)
  const [isRefreshingSlang, setIsRefreshingSlang] = useState(false)
  const speech = useKoreanSpeech()

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

  async function addSlang() {
    setIsAddingSlang(true)
    const result = await onAddSlang({
      text: slangText,
      meaning: slangMeaning,
      example: slangExample,
    })
    setIsAddingSlang(false)
    setMessage(result.message)

    if (result.ok) {
      setSlangText('')
      setSlangMeaning('')
      setSlangExample('')
    }
  }

  async function refreshSlang() {
    setIsRefreshingSlang(true)
    try {
      const version = await onRefreshSlang()
      setMessage(
        version === slangVersion
          ? `이미 최신 유행어 목록이에요. (${version})`
          : `유행어 목록을 ${version} 버전으로 바꿨어요.`,
      )
    } catch {
      setMessage(
        '최신 유행어 목록을 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
      )
    } finally {
      setIsRefreshingSlang(false)
    }
  }

  function exportSlang() {
    const exported = buildCustomSlangExport(slangItems)
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `hangul-slang-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage(`${exported.items.length}개 직접 만든 유행어를 내보냈어요.`)
  }

  async function importSlangFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    try {
      const items = parseCustomSlangImport(await file.text())
      const result = await onImportSlang(items)
      setMessage(result.message)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '파일을 읽지 못했어요.',
      )
    }
  }

  const customSlang = slangItems.filter(({ origin }) => origin === 'custom')
  const archivedSlang = slangItems.filter(({ status }) => status === 'archived')

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

        <fieldset className="settings-card slang-settings-card">
          <legend>유행어 모드</legend>
          <label className="toggle-row">
            <span>
              <strong>유행어 카드게임</strong>
              <small>뜻을 맞히고 유행어를 직접 입력해요.</small>
            </span>
            <input
              aria-label="유행어 모드"
              type="checkbox"
              checked={draft.settings.slangMode}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    slangMode: event.target.checked,
                  },
                }))
              }
            />
          </label>

          {draft.settings.slangMode ? (
            <div className="slang-management">
              <div className="custom-slang-form">
                <div>
                  <p className="eyebrow">나만의 카드 만들기</p>
                  <h2>유행어 직접 추가</h2>
                  <p>추가한 카드는 이 기기에만 저장돼요.</p>
                </div>
                <label className="field">
                  <span>유행어</span>
                  <input
                    value={slangText}
                    onChange={(event) => setSlangText(event.target.value)}
                    maxLength={30}
                    required
                  />
                </label>
                <label className="field">
                  <span>뜻</span>
                  <input
                    value={slangMeaning}
                    onChange={(event) => setSlangMeaning(event.target.value)}
                    maxLength={100}
                    required
                  />
                </label>
                <label className="field">
                  <span>예문 (선택)</span>
                  <input
                    value={slangExample}
                    onChange={(event) => setSlangExample(event.target.value)}
                    maxLength={120}
                  />
                </label>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={
                    isAddingSlang ||
                    slangText.trim() === '' ||
                    slangMeaning.trim() === ''
                  }
                  onClick={() => void addSlang()}
                >
                  {isAddingSlang ? '검사 중…' : '유행어 추가'}
                </button>
              </div>

              <section className="slang-update-card">
                <div>
                  <p className="eyebrow">REMOTE UPDATE</p>
                  <h2>기본 목록 업데이트</h2>
                  <p>현재 버전: {slangVersion}</p>
                </div>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={isRefreshingSlang}
                  onClick={() => void refreshSlang()}
                >
                  {isRefreshingSlang ? '확인 중…' : '최신 목록 확인'}
                </button>
              </section>

              <section className="slang-transfer-card">
                <div>
                  <p className="eyebrow">JSON</p>
                  <h2>직접 만든 유행어 나누기</h2>
                  <p>파일로 내보내 다른 기기에서 가져올 수 있어요.</p>
                </div>
                <div className="button-row">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={exportSlang}
                  >
                    JSON 내보내기
                  </button>
                  <label className="button button--ghost slang-file-button">
                    JSON 가져오기
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(event) => void importSlangFile(event)}
                    />
                  </label>
                </div>
              </section>

              {customSlang.length > 0 ? (
                <section className="slang-library">
                  <h2>내가 만든 유행어</h2>
                  <ul>
                    {customSlang.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.text}</strong>
                          <small>
                            {item.addedAt} ·{' '}
                            {item.status === 'active'
                              ? '현재 유행어'
                              : '옛 유행어'}
                          </small>
                        </div>
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={async () =>
                            setMessage(
                              await onSetSlangStatus(
                                item.id,
                                item.status === 'active'
                                  ? 'archived'
                                  : 'active',
                              ),
                            )
                          }
                        >
                          {item.status === 'active'
                            ? '옛 유행어로 이동'
                            : '현재 목록으로 복원'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {archivedSlang.length > 0 ? (
                <section className="slang-library slang-library--archive">
                  <h2>옛 유행어 모음</h2>
                  <ul>
                    {archivedSlang.map((item) => (
                      <li key={`archive-${item.id}`}>
                        <div>
                          <strong>{item.text}</strong>
                          <small>{item.meaning}</small>
                        </div>
                        <span>{item.addedAt} 등록</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
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
              <strong>시간 제한</strong>
              <small>끄면 타수 대신 정확도와 완료 개수만 기록해요.</small>
            </span>
            <input
              aria-label="시간 제한"
              type="checkbox"
              checked={draft.settings.timeLimit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    timeLimit: event.target.checked,
                  },
                }))
              }
            />
          </label>
          <div className="speed-setting">
            <span>
              <strong>미니게임 속도</strong>
              <small>낱말이 움직이거나 답을 기다리는 속도를 조절해요.</small>
            </span>
            <div className="segmented-control">
              {(
                Object.keys(SPEED_LABELS) as Array<keyof typeof SPEED_LABELS>
              ).map((speed) => (
                <button
                  type="button"
                  key={speed}
                  aria-pressed={
                    (draft.settings.minigameSpeed ?? 'normal') === speed
                  }
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      settings: { ...current.settings, minigameSpeed: speed },
                    }))
                  }
                >
                  {SPEED_LABELS[speed]}
                </button>
              ))}
            </div>
          </div>
          {speech.supported ? (
            <label className="toggle-row">
              <span>
                <strong>소리 읽어주기</strong>
                <small>낱말과 뜻을 한국어 목소리로 읽어요.</small>
              </span>
              <input
                aria-label="소리 읽어주기"
                type="checkbox"
                checked={draft.settings.speech}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      speech: event.target.checked,
                    },
                  }))
                }
              />
            </label>
          ) : (
            <p className="settings-support-note">
              이 기기에는 한국어 읽기 목소리가 없어 듣기 버튼을 숨겼어요.
            </p>
          )}
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
