import type { Profile, TypingMode, Word } from '../data/types'
import { buildSpeechText, useKoreanSpeech } from '../speech'
import { DAILY_GOAL_SECONDS } from '../goals'

type MenuDestination =
  | TypingMode
  | 'slang'
  | 'slang-quiz'
  | 'records'
  | 'mistakes'
  | 'settings'
  | 'word-rain-setup'
  | 'tower-setup'
  | 'word-stages'
  | 'word-chain-setup'
  | 'long-sentence'
  | 'spelling'
  | 'daily-goal'
  | 'spelling-correction'
  | 'meaning-quiz'
  | 'literature'

interface MenuScreenProps {
  profile: Profile
  unlockedModes: Readonly<Record<TypingMode, boolean>>
  dailyWord: Word | null
  dailyPracticeSec: number
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
  dailyWord,
  dailyPracticeSec,
  onNavigate,
}: MenuScreenProps) {
  const speech = useKoreanSpeech()

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

      {dailyWord ? (
        <section className="daily-word-card" aria-labelledby="daily-word-title">
          {profile.ageGroup === 'kid' && dailyWord.emoji ? (
            <span className="daily-word-card__emoji" aria-hidden="true">
              {dailyWord.emoji}
            </span>
          ) : (
            <span className="daily-word-card__letter" aria-hidden="true">
              가
            </span>
          )}
          <div>
            <p className="eyebrow">오늘의 낱말</p>
            <h2 id="daily-word-title">{dailyWord.text}</h2>
            <p>{dailyWord.meaning}</p>
            {dailyWord.example ? <small>예) {dailyWord.example}</small> : null}
          </div>
          {profile.settings.speech && speech.supported ? (
            <button
              className="button button--ghost"
              type="button"
              onClick={() =>
                speech.speak(
                  buildSpeechText(
                    dailyWord.text,
                    dailyWord.meaning,
                    dailyWord.example,
                  ),
                )
              }
            >
              {speech.speaking ? '🔊 읽는 중' : '🔈 오늘의 낱말 듣기'}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="daily-goal-card" aria-labelledby="daily-goal-title">
        <span aria-hidden="true">
          {dailyPracticeSec >= DAILY_GOAL_SECONDS ? '🏅' : '⏱️'}
        </span>
        <div>
          <p className="eyebrow">하루 10분 목표</p>
          <h2 id="daily-goal-title">
            {dailyPracticeSec >= DAILY_GOAL_SECONDS
              ? '오늘 도장을 받았어요!'
              : `${Math.floor(dailyPracticeSec / 60)}분 연습했어요`}
          </h2>
          <progress
            aria-label="오늘 연습 목표"
            max={DAILY_GOAL_SECONDS}
            value={Math.min(dailyPracticeSec, DAILY_GOAL_SECONDS)}
          />
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => onNavigate('daily-goal')}
        >
          도장 달력 보기
        </button>
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
            description="받침 없는 글자부터 쌍자음까지 단계별로 익혀요."
            locked={!unlockedModes.word}
            onClick={() => onNavigate('word-stages')}
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

      <section className="menu-section" aria-labelledby="literature-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">글을 읽는 시간</p>
            <h2 id="literature-title">고전문학 타자 연습</h2>
          </div>
        </div>
        <div className="menu-grid">
          <PracticeCard
            emoji="📚"
            title="고전문학 읽으며 연습"
            description="한 구절씩 읽고 따라 적어요. 시간 제한 없이, 나의 속도로."
            onClick={() => onNavigate('literature')}
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
            🏆 내 기록과 가족 점수판
          </button>
          <button type="button" onClick={() => onNavigate('mistakes')}>
            🔁 틀린 낱말 다시 연습
          </button>
        </div>
      </section>

      {profile.ageGroup === 'adult' ? (
        <section
          className="menu-section adult-practice-section"
          aria-labelledby="adult-practice-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">성인 맞춤 연습</p>
              <h2 id="adult-practice-title">긴 글과 바른 표현</h2>
            </div>
          </div>
          <div className="menu-grid">
            <PracticeCard
              emoji="📖"
              title="긴 문장 연습"
              description="긴 글을 정확하고 자연스럽게 입력해요."
              onClick={() => onNavigate('long-sentence')}
            />
            <PracticeCard
              emoji="✍️"
              title="헷갈리는 맞춤법"
              description="되/돼, 안/않처럼 자주 헷갈리는 표현을 익혀요."
              onClick={() => onNavigate('spelling')}
            />
            <PracticeCard
              emoji="🛠️"
              title="틀린 맞춤법 고치기"
              description="틀린 문장을 보고 바른 문장으로 직접 고쳐요."
              onClick={() => onNavigate('spelling-correction')}
            />
          </div>
        </section>
      ) : null}

      {profile.ageGroup !== 'kid' ? (
        <section className="menu-section" aria-labelledby="meaning-quiz-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">뜻으로 기억해요</p>
              <h2 id="meaning-quiz-title">속담·사자성어</h2>
            </div>
          </div>
          <div className="quick-actions">
            <button type="button" onClick={() => onNavigate('meaning-quiz')}>
              💡 뜻 퀴즈 시작
            </button>
          </div>
        </section>
      ) : null}

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

      <section
        className="minigame-menu-section word-chain-menu-section"
        aria-labelledby="word-chain-menu-title"
      >
        <div>
          <p className="eyebrow">말꼬리를 이어 봐요</p>
          <h2 id="word-chain-menu-title">🔗 끝말잇기 타자</h2>
          <p>컴퓨터 또는 가족과 번갈아 낱말을 입력해요.</p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => onNavigate('word-chain-setup')}
        >
          끝말잇기 시작
        </button>
      </section>
    </main>
  )
}
