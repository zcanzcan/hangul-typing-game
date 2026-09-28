import { useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { MinigamePack, Profile } from '../data/types'
import { getAvailableTowerPacks, type TowerMode } from '../games/tower'

const PACK_DETAILS: Readonly<
  Record<MinigamePack, { emoji: string; title: string; description: string }>
> = {
  standard: {
    emoji: '🧱',
    title: '표준어',
    description: '익숙한 표준어 블록을 차곡차곡 쌓아요.',
  },
  slang: {
    emoji: '🎮',
    title: '요즘 말',
    description: '요즘 말 블록으로 알록달록한 탑을 만들어요.',
  },
  mixed: {
    emoji: '🌈',
    title: '섞어서',
    description: '표준어와 요즘 말이 함께 나와요.',
  },
}

interface TowerSetupScreenProps {
  profile: Profile
  onBack: () => void
  onStart: (pack: MinigamePack, mode: TowerMode) => void
}

export function TowerSetupScreen({
  profile,
  onBack,
  onStart,
}: TowerSetupScreenProps) {
  const [mode, setMode] = useState<TowerMode>('untimed')
  const packs = getAvailableTowerPacks(profile.settings.slangMode)

  return (
    <PageShell
      title="낱말 탑 쌓기"
      eyebrow="차곡차곡 정확하게"
      onBack={onBack}
      theme="candy"
    >
      <div className="tower-setup">
        <section className="word-rain-intro tower-intro">
          <span aria-hidden="true">🏗️</span>
          <div>
            <h2>낱말을 맞히면 탑이 한 층 올라가요</h2>
            <p>
              세 번 흔들리면 탑이 무너져요. 5개를 연속으로 맞히면 흔들림 하나를
              회복해요.
            </p>
          </div>
        </section>

        <section className="tower-mode-card" aria-labelledby="tower-mode-title">
          <div>
            <p className="eyebrow">PLAY MODE</p>
            <h2 id="tower-mode-title">진행 방식을 골라요</h2>
          </div>
          <div className="tower-mode-options">
            <button
              className={mode === 'untimed' ? 'is-selected' : ''}
              type="button"
              aria-pressed={mode === 'untimed'}
              onClick={() => setMode('untimed')}
            >
              <strong>🐢 시간 제한 없음</strong>
              <small>서두르지 않고 정확하게 쌓아요.</small>
            </button>
            {profile.ageGroup === 'adult' ? (
              <button
                className={mode === 'timed' ? 'is-selected' : ''}
                type="button"
                aria-pressed={mode === 'timed'}
                onClick={() => setMode('timed')}
              >
                <strong>⏱️ 60초 도전</strong>
                <small>60초 동안 정확하고 빠르게 쌓아요.</small>
              </button>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="tower-pack-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WORD PACK</p>
              <h2 id="tower-pack-title">어떤 블록을 쌓을까요?</h2>
            </div>
          </div>
          <div className="word-rain-pack-grid">
            {packs.map((pack) => {
              const details = PACK_DETAILS[pack]
              return (
                <button
                  className={`word-rain-pack ${pack === 'standard' ? '' : 'word-rain-pack--pixel'}`}
                  type="button"
                  key={pack}
                  onClick={() => onStart(pack, mode)}
                  aria-label={`${details.title} 꾸러미로 시작`}
                >
                  <span aria-hidden="true">{details.emoji}</span>
                  <strong>{details.title}</strong>
                  <small>{details.description}</small>
                  <b>
                    {mode === 'timed' ? '60초 도전 시작 →' : '탑 쌓기 시작 →'}
                  </b>
                </button>
              )
            })}
          </div>
        </section>

        {!profile.settings.slangMode ? (
          <p className="word-rain-notice">
            요즘 말과 섞어서 꾸러미는 설정에서 유행어 모드를 켜면 보여요.
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}
