import type { Profile, TypingMode } from '../data/types'

type MenuDestination =
  | TypingMode
  | 'slang'
  | 'slang-quiz'
  | 'records'
  | 'mistakes'
  | 'settings'
  | 'word-rain-setup'
  | 'tower-setup'

interface MenuScreenProps {
  profile: Profile
  unlockedModes: Readonly<Record<TypingMode, boolean>>
  onNavigate: (destination: MenuDestination) => void
}

interface PracticeCardProps {
  emoji: string
  title: string
  description: string
  locked?: boolean
  onClick: () => void
}

function PracticeCard({
  emoji,
  title,
  description,
  locked = false,
  onClick,
}: PracticeCardProps) {
  return (
    <button
      className="menu-card"
      type="button"
      onClick={onClick}
      disabled={locked}
    >
      <span className="menu-card__emoji" aria-hidden="true">
        {locked ? '🔒' : emoji}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{locked ? '앞 단계를 먼저 완료해 주세요.' : description}</small>
      </span>
      <span aria-hidden="true">→</span>
    </button>
  )
}

export function MenuScreen({
  profile,
  unlockedModes,
  onNavigate,
}: MenuScreenProps) {
  return (
    <main className="menu-screen" data-theme="candy">
      <header className="menu-header">
        <div>
          <p className="eyebrow">오늘도 한 글자씩</p>
          <h1>{profile.nickname}님, 반가워요!</h1>
        </div>
        <button
          className="button button--ghost"
          type="button"
          onClick={() => onNavigate('settings')}
        >
          ⚙ 설정
        </button>
      </header>

      <section className="journey-card" aria-labelledby="journey-title">
        <div>
          <p className="eyebrow">나의 연습 길</p>
          <h2 id="journey-title">자리 → 낱말 → 문장</h2>
        </div>
        <div className="journey-steps" aria-label="단계 진행 상태">
          {(['position', 'word', 'sentence'] as const).map((mode, index) => (
            <span
              className={unlockedModes[mode] ? 'is-unlocked' : ''}
              key={mode}
            >
              {unlockedModes[mode] ? '✓' : '🔒'} {index + 1}단계
            </span>
          ))}
        </div>
      </section>

      <section className="menu-section" aria-labelledby="practice-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">차근차근 올라가요</p>
            <h2 id="practice-title">타자 연습</h2>
          </div>
        </div>
        <div className="menu-grid">
          <PracticeCard
            emoji="⌨️"
            title="자리 연습"
            description="기본 자판 자리를 한 글자씩 익혀요."
            onClick={() => onNavigate('position')}
          />
          <PracticeCard
            emoji="🍎"
            title="낱말 연습"
            description="낱말을 치고 뜻 카드도 확인해요."
            locked={!unlockedModes.word}
            onClick={() => onNavigate('word')}
          />
          <PracticeCard
            emoji="💬"
            title="짧은 문장 연습"
            description="쉬운 문장을 또박또박 입력해요."
            locked={!unlockedModes.sentence}
            onClick={() => onNavigate('sentence')}
          />
        </div>
      </section>

      <section className="menu-section" aria-labelledby="record-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">어제보다 한 걸음</p>
            <h2 id="record-title">나의 기록</h2>
          </div>
        </div>
        <div className="quick-actions">
          <button type="button" onClick={() => onNavigate('records')}>
            🏆 최고 기록과 최근 기록
          </button>
          <button type="button" onClick={() => onNavigate('mistakes')}>
            🔁 틀린 낱말 다시 연습
          </button>
        </div>
      </section>

      <section
        className="slang-menu-section"
        data-theme="pixel"
        aria-labelledby="slang-title"
      >
        <div>
          <p className="eyebrow">PIXEL WORD QUEST</p>
          <h2 id="slang-title">🔥 유행어 카드게임</h2>
          <p>
            {profile.settings.slangMode
              ? '뜻을 맞히고 유행어를 정확히 입력해 최고 점수에 도전해요.'
              : '설정에서 유행어 모드를 켜면 게임을 시작할 수 있어요.'}
          </p>
        </div>
        <button
          className="button button--pixel"
          type="button"
          onClick={() =>
            onNavigate(profile.settings.slangMode ? 'slang' : 'settings')
          }
        >
          {profile.settings.slangMode ? '게임 시작' : '설정에서 켜기'}
        </button>
      </section>

      {profile.settings.slangMode ? (
        <section
          className="slang-menu-section slang-quiz-menu-section"
          data-theme="pixel"
          aria-labelledby="slang-quiz-title"
        >
          <div>
            <p className="eyebrow">PIXEL SPEED QUIZ</p>
            <h2 id="slang-quiz-title">⚡ 요즘 말 스피드 퀴즈</h2>
            <p>뜻과 표준어를 보고 알맞은 요즘 말을 빠르게 입력해요.</p>
          </div>
          <button
            className="button button--pixel"
            type="button"
            onClick={() => onNavigate('slang-quiz')}
          >
            스피드 퀴즈 시작
          </button>
        </section>
      ) : null}

      <section
        className="minigame-menu-section"
        aria-labelledby="minigame-title"
      >
        <div>
          <p className="eyebrow">새싹 지키기</p>
          <h2 id="minigame-title">☔ 낱말 비</h2>
          <p>떨어지는 낱말을 입력해 새싹 3개를 지켜요.</p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => onNavigate('word-rain-setup')}
        >
          낱말 비 시작
        </button>
      </section>

      <section
        className="minigame-menu-section tower-menu-section"
        aria-labelledby="tower-menu-title"
      >
        <div>
          <p className="eyebrow">차곡차곡 정확하게</p>
          <h2 id="tower-menu-title">🏗️ 낱말 탑 쌓기</h2>
          <p>맞게 입력한 낱말 블록으로 구름과 우주까지 올라가요.</p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => onNavigate('tower-setup')}
        >
          낱말 탑 시작
        </button>
      </section>
    </main>
  )
}
