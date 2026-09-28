import { useMemo, useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { Profile } from '../data/types'

export interface WordChainPlayerSeed {
  id: string
  nickname: string
  ageGroup: Profile['ageGroup']
  computer?: boolean
}

interface WordChainSetupScreenProps {
  profile: Profile
  profiles: Profile[]
  onBack: () => void
  onStart: (players: WordChainPlayerSeed[], initialSoundRule: boolean) => void
}

export function WordChainSetupScreen({
  profile,
  profiles,
  onBack,
  onStart,
}: WordChainSetupScreenProps) {
  const [mode, setMode] = useState<'computer' | 'family'>('computer')
  const [selectedIds, setSelectedIds] = useState<string[]>([profile.id])
  const [initialSoundRule, setInitialSoundRule] = useState(true)
  const selectedProfiles = useMemo(
    () => profiles.filter(({ id }) => selectedIds.includes(id)).slice(0, 4),
    [profiles, selectedIds],
  )

  function toggleProfile(profileId: string) {
    setSelectedIds((current) => {
      if (current.includes(profileId)) {
        return current.length > 1
          ? current.filter((id) => id !== profileId)
          : current
      }

      return current.length < 4 ? [...current, profileId] : current
    })
  }

  const canStart = mode === 'computer' || selectedProfiles.length >= 2

  return (
    <PageShell
      title="끝말잇기 타자"
      eyebrow="말꼬리를 이어 봐요"
      onBack={onBack}
      theme="candy"
    >
      <div className="word-chain-setup">
        <section className="word-chain-intro">
          <span aria-hidden="true">🔗</span>
          <div>
            <h2>앞 낱말의 끝 글자로 새 낱말을 이어요</h2>
            <p>
              목록에 있는 두 글자 이상 낱말만 쓸 수 있고, 세 번 틀리면 탈락해요.
            </p>
          </div>
        </section>

        <section
          className="word-chain-options"
          aria-labelledby="chain-mode-title"
        >
          <div>
            <p className="eyebrow">PLAYERS</p>
            <h2 id="chain-mode-title">누구와 할까요?</h2>
          </div>
          <div className="tower-mode-options">
            <button
              className={mode === 'computer' ? 'is-selected' : ''}
              type="button"
              aria-pressed={mode === 'computer'}
              onClick={() => setMode('computer')}
            >
              <strong>🤖 컴퓨터와 1:1</strong>
              <small>쉬운 낱말을 고르는 컴퓨터와 겨뤄요.</small>
            </button>
            <button
              className={mode === 'family' ? 'is-selected' : ''}
              type="button"
              aria-pressed={mode === 'family'}
              onClick={() => setMode('family')}
            >
              <strong>👨‍👩‍👧 가족 2~4명</strong>
              <small>한 기기에서 차례대로 입력해요.</small>
            </button>
          </div>
        </section>

        {mode === 'family' ? (
          <fieldset className="word-chain-family-picker">
            <legend>함께할 가족을 2~4명 골라 주세요</legend>
            <div>
              {profiles.map((member) => (
                <label key={member.id}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(member.id)}
                    onChange={() => toggleProfile(member.id)}
                  />
                  <strong>{member.nickname}</strong>
                  <small>{AGE_LABELS[member.ageGroup]}</small>
                </label>
              ))}
            </div>
            {profiles.length < 2 ? (
              <p>가족 점수판에서 별명을 하나 더 추가하면 함께할 수 있어요.</p>
            ) : null}
          </fieldset>
        ) : null}

        <label className="word-chain-rule-toggle">
          <span>
            <strong>두음 법칙 사용</strong>
            <small>경력 다음에 역사처럼 자연스럽게 이을 수 있어요.</small>
          </span>
          <input
            type="checkbox"
            checked={initialSoundRule}
            onChange={(event) => setInitialSoundRule(event.target.checked)}
          />
        </label>

        <button
          className="button button--primary button--large"
          type="button"
          disabled={!canStart}
          onClick={() =>
            onStart(
              mode === 'computer'
                ? [
                    {
                      id: profile.id,
                      nickname: profile.nickname,
                      ageGroup: profile.ageGroup,
                    },
                    {
                      id: 'computer',
                      nickname: '한글봇',
                      ageGroup: profile.ageGroup,
                      computer: true,
                    },
                  ]
                : selectedProfiles.map(({ id, nickname, ageGroup }) => ({
                    id,
                    nickname,
                    ageGroup,
                  })),
              initialSoundRule,
            )
          }
        >
          끝말잇기 시작
        </button>
      </div>
    </PageShell>
  )
}

const AGE_LABELS: Readonly<Record<Profile['ageGroup'], string>> = {
  kid: '초등학생',
  adult: '성인',
  senior: '어르신',
}
