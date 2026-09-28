interface MeaningCardProps {
  word: string
  meaning?: string
  example?: string
  visible: boolean
  onSpeak?: () => void
  speaking?: boolean
}

export function MeaningCard({
  word,
  meaning,
  example,
  visible,
  onSpeak,
  speaking = false,
}: MeaningCardProps) {
  return (
    <section
      className={`meaning-card ${visible ? 'meaning-card--visible' : ''}`}
      aria-live="polite"
    >
      {visible ? (
        <>
          <p className="eyebrow">뜻 카드</p>
          <h2>{word}</h2>
          <p>{meaning ?? '문장을 끝까지 입력했어요.'}</p>
          {example ? (
            <p className="meaning-card__example">예) {example}</p>
          ) : null}
          {onSpeak ? (
            <button
              className="button button--ghost speech-button"
              type="button"
              onClick={onSpeak}
            >
              {speaking ? '🔊 읽는 중' : '🔈 낱말과 뜻 듣기'}
            </button>
          ) : null}
        </>
      ) : (
        <p>입력을 마치면 뜻 카드가 열려요.</p>
      )}
    </section>
  )
}
