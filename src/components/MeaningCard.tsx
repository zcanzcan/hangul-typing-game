interface MeaningCardProps {
  word: string
  meaning?: string
  example?: string
  visible: boolean
}

export function MeaningCard({
  word,
  meaning,
  example,
  visible,
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
        </>
      ) : (
        <p>입력을 마치면 뜻 카드가 열려요.</p>
      )}
    </section>
  )
}
