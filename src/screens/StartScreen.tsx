import { useState } from 'react'

import type { AgeGroup, Profile } from '../data/types'
import { createProfile } from '../storage/profile'

const AGE_OPTIONS: ReadonlyArray<{
  value: AgeGroup
  label: string
  description: string
  emoji: string
}> = [
  {
    value: 'kid',
    label: '초등학생',
    description: '쉬운 자리부터 천천히 시작해요.',
    emoji: '🌱',
  },
  {
    value: 'adult',
    label: '성인',
    description: '낱말부터 속도와 정확도를 키워요.',
    emoji: '🚀',
  },
  {
    value: 'senior',
    label: '어르신',
    description: '큰 글씨로 시간 제한 없이 연습해요.',
    emoji: '🌳',
  },
]

interface StartScreenProps {
  onStart: (profile: Profile) => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('kid')
  const [nickname, setNickname] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (nickname.trim() === '') {
      return
    }

    onStart(createProfile(nickname, ageGroup))
  }

  return (
    <main className="start-screen" data-theme="candy">
      <div className="start-hero">
        <span className="start-hero__mascot" aria-hidden="true">
          ⌨️
        </span>
        <p className="eyebrow">치고, 읽고, 기억해요</p>
        <h1>한글 타자 놀이터</h1>
        <p>나에게 맞는 연습 방법을 고르고 별명으로 시작해요.</p>
      </div>

      <form className="start-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>나는 누구인가요?</legend>
          <div className="age-grid">
            {AGE_OPTIONS.map((option) => (
              <button
                className={`age-card ${ageGroup === option.value ? 'age-card--selected' : ''}`}
                type="button"
                key={option.value}
                aria-pressed={ageGroup === option.value}
                onClick={() => setAgeGroup(option.value)}
              >
                <span aria-hidden="true">{option.emoji}</span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>별명</span>
          <input
            name="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="실명 대신 사용할 별명을 적어 주세요"
            maxLength={12}
            autoComplete="off"
            required
          />
        </label>

        <button className="button button--primary button--large" type="submit">
          연습 시작하기
        </button>
        <p className="privacy-note">
          로그인 없이 연습 기록을 이 기기에 저장해요. 반 점수판에서 직접 기록
          올리기를 선택하면 별명, 점수, 모드, 단계와 기록 시각이 서버로
          전송돼요. 실명이나 연락처는 별명에 적지 마세요.
        </p>
      </form>
    </main>
  )
}
