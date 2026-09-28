import { PageShell } from '../components/PageShell'
import type { MinigamePack, Profile } from '../data/types'
import { getAvailablePacks } from '../games/wordRain'

const PACKS: Readonly<
  Record<MinigamePack, { emoji: string; title: string; description: string }>
> = {
  standard: {
    emoji: '🍎',
    title: '표준어',
    description: '익숙한 낱말로 새싹을 지켜요.',
  },
  slang: {
    emoji: '⚡',
    title: '요즘 말',
    description: '최신 유행어가 빗방울로 내려와요.',
  },
  mixed: {
    emoji: '🌈',
    title: '섞어서',
    description: '표준어 70%와 요즘 말 30%를 섞어요.',
  },
}

interface WordRainSetupScreenProps {
  profile: Profile
  onBack: () => void
  onStart: (pack: MinigamePack) => void
}

export function WordRainSetupScreen({
  profile,
  onBack,
  onStart,
}: WordRainSetupScreenProps) {
  const packs = getAvailablePacks(profile.settings.slangMode)

  return (
    <PageShell title="낱말 비" eyebrow="새싹 지키기" onBack={onBack}>
      <div className="word-rain-setup">
        <section className="word-rain-intro">
          <span aria-hidden="true">🌱☔</span>
          <div>
            <h2>어떤 낱말 비를 맞아 볼까요?</h2>
            <p>바닥에 닿기 전에 낱말을 입력하고 새싹 3개를 지켜요.</p>
          </div>
        </section>

        {profile.ageGroup === 'senior' ? (
          <p className="word-rain-notice" role="note">
            어르신 모드는 낱말이 천천히 내리는 비로 시작해요.
          </p>
        ) : null}

        <div className="word-rain-pack-grid">
          {packs.map((pack) => {
            const details = PACKS[pack]
            return (
              <button
                className={`word-rain-pack ${pack !== 'standard' ? 'word-rain-pack--pixel' : ''}`}
                type="button"
                key={pack}
                onClick={() => onStart(pack)}
              >
                <span aria-hidden="true">{details.emoji}</span>
                <strong>{details.title}</strong>
                <small>{details.description}</small>
                <b>시작하기 →</b>
              </button>
            )
          })}
        </div>

        {!profile.settings.slangMode ? (
          <p className="word-rain-notice">
            설정에서 유행어 모드를 켜면 ‘요즘 말’과 ‘섞어서’ 꾸러미도 열려요.
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}
