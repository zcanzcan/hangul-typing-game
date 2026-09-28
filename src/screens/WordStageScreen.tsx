import { PageShell } from '../components/PageShell'
import type { Profile, Word } from '../data/types'
import {
  getWordStageItems,
  WORD_STAGES,
  type WordStage,
} from '../practice/word-stages'

interface WordStageScreenProps {
  profile: Profile
  words: readonly Word[]
  unlockedStages: Readonly<Record<WordStage, boolean>>
  onBack: () => void
  onStart: (stage: WordStage) => void
}

export function WordStageScreen({
  profile,
  words,
  unlockedStages,
  onBack,
  onStart,
}: WordStageScreenProps) {
  return (
    <PageShell
      title="낱말 단계 고르기"
      eyebrow="받침 없는 글자부터 차근차근"
      onBack={onBack}
    >
      <div className="word-stage-layout">
        <section
          className="word-stage-guide"
          aria-labelledby="word-stage-guide-title"
        >
          <span aria-hidden="true">🪜</span>
          <div>
            <h2 id="word-stage-guide-title">한 단계씩 올라가요</h2>
            <p>앞 단계를 통과하면 다음 낱말 묶음이 열려요.</p>
          </div>
        </section>

        <ol className="word-stage-list" aria-label="낱말 연습 단계">
          {WORD_STAGES.map((definition) => {
            const unlocked = unlockedStages[definition.stage]
            const itemCount = getWordStageItems(
              words,
              profile.ageGroup,
              definition.stage,
            ).length

            return (
              <li key={definition.stage}>
                <button
                  className={`word-stage-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onStart(definition.stage)}
                  aria-label={`${definition.stage}단계 ${definition.title}${unlocked ? ' 시작' : ' 잠김'}`}
                >
                  <span className="word-stage-card__number">
                    {definition.stage}단계
                  </span>
                  <span className="word-stage-card__emoji" aria-hidden="true">
                    {unlocked ? definition.emoji : '🔒'}
                  </span>
                  <span className="word-stage-card__body">
                    <strong>{definition.title}</strong>
                    <small>{definition.description}</small>
                    <em>{definition.examples}</em>
                  </span>
                  <span className="word-stage-card__status">
                    {unlocked
                      ? `${itemCount}개 연습 →`
                      : '앞 단계 통과 후 열림'}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </PageShell>
  )
}
