import { useEffect, useState } from 'react'

import { PageShell } from '../components/PageShell'
import type { Mistake, PracticeContent } from '../data/types'
import { getMistakes } from '../storage/mistakes'
import type { PracticeItem } from './PracticeScreen'

interface MistakesScreenProps {
  profileId: string
  content: PracticeContent
  onBack: () => void
  onPractice: (item: PracticeItem) => void
}

export function MistakesScreen({
  profileId,
  content,
  onBack,
  onPractice,
}: MistakesScreenProps) {
  const [mistakes, setMistakes] = useState<Mistake[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void getMistakes(profileId).then((items) => {
      if (!cancelled) {
        setMistakes(items)
      }
    })

    return () => {
      cancelled = true
    }
  }, [profileId])

  const practiceItems = [
    ...content.words,
    ...content.sentences,
    ...content.slang.map(({ id, text, meaning, example }) => ({
      id,
      text,
      meaning,
      example,
    })),
  ]

  return (
    <PageShell title="틀린 낱말 다시 연습" eyebrow="복습 상자" onBack={onBack}>
      <div className="mistakes-layout">
        {!mistakes ? (
          <p className="loading-message">복습 목록을 불러오는 중이에요…</p>
        ) : mistakes.length === 0 ? (
          <section className="empty-state">
            <span aria-hidden="true">🎉</span>
            <h2>복습할 항목이 없어요</h2>
            <p>틀린 낱말이나 문장이 생기면 여기에 모아 둘게요.</p>
          </section>
        ) : (
          <ul className="mistake-list">
            {mistakes.map((mistake) => {
              const item = practiceItems.find(({ id }) => id === mistake.itemId)

              if (!item) {
                return null
              }

              return (
                <li key={mistake.itemId}>
                  <div>
                    <strong>{item.text}</strong>
                    <small>{mistake.count}번 틀렸어요</small>
                  </div>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => onPractice(item)}
                  >
                    연습하기
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
