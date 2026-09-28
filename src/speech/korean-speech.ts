export function findKoreanVoice(voices: readonly SpeechSynthesisVoice[]) {
  return (
    voices.find(
      ({ lang, localService }) =>
        lang.toLowerCase().startsWith('ko') && localService,
    ) ??
    voices.find(({ lang }) => lang.toLowerCase().startsWith('ko')) ??
    null
  )
}

export function buildSpeechText(
  word: string,
  meaning?: string,
  example?: string,
) {
  return [word, meaning, example ? `예문. ${example}` : undefined]
    .filter(Boolean)
    .join('. ')
}
