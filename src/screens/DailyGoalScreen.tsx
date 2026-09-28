import { PageShell } from '../components/PageShell'
import {
  DAILY_GOAL_SECONDS,
  getPracticeCalendar,
  getPracticeTime,
  toDateKey,
} from '../goals'

interface DailyGoalScreenProps {
  profileId: string
  nickname: string
  onBack: () => void
}

export function DailyGoalScreen({
  profileId,
  nickname,
  onBack,
}: DailyGoalScreenProps) {
  const now = new Date()
  const month = toDateKey(now).slice(0, 7)
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate()
  const entries = getPracticeCalendar(profileId, month)
  const entryMap = new Map(entries.map((entry) => [entry.dateKey, entry]))
  const todaySeconds = getPracticeTime(profileId)

  return (
    <PageShell title="하루 10분 도장" eyebrow={nickname} onBack={onBack}>
      <div className="daily-goal-screen">
        <section className="daily-goal-hero">
          <span aria-hidden="true">
            {todaySeconds >= DAILY_GOAL_SECONDS ? '🏅' : '⏱️'}
          </span>
          <div>
            <p className="eyebrow">TODAY</p>
            <h2>
              {todaySeconds >= DAILY_GOAL_SECONDS
                ? '오늘 목표를 채웠어요!'
                : `${Math.floor(todaySeconds / 60)}분 / 10분`}
            </h2>
            <p>연습을 마칠 때마다 시간이 자동으로 쌓여요.</p>
          </div>
          <progress
            aria-label="오늘 연습 목표"
            max={DAILY_GOAL_SECONDS}
            value={Math.min(todaySeconds, DAILY_GOAL_SECONDS)}
          />
        </section>

        <section className="goal-calendar">
          <h2>
            {now.getFullYear()}년 {now.getMonth() + 1}월
          </h2>
          <div className="goal-calendar__weekdays" aria-hidden="true">
            {'일월화수목금토'.split('').map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="goal-calendar__days">
            {Array.from({ length: firstDay }, (_, index) => (
              <span className="is-empty" key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1
              const dateKey = `${month}-${String(day).padStart(2, '0')}`
              const entry = entryMap.get(dateKey)
              return (
                <article
                  className={entry?.completed ? 'is-complete' : ''}
                  key={dateKey}
                  aria-label={`${day}일 ${entry?.completed ? '목표 달성' : `${Math.floor((entry?.seconds ?? 0) / 60)}분 연습`}`}
                >
                  <span>{day}</span>
                  <b aria-hidden="true">
                    {entry?.completed ? '⭐' : entry ? '·' : ''}
                  </b>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
