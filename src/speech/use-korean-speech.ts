import { useCallback, useEffect, useState } from 'react'

import { findKoreanVoice } from './korean-speech'

function getKoreanVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null
  }

  return findKoreanVoice(window.speechSynthesis.getVoices())
}

export function useKoreanSpeech() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(() =>
    getKoreanVoice(),
  )
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return
    }

    const updateVoices = () => setVoice(getKoreanVoice())
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!voice || text.trim() === '') {
        return false
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.lang = voice.lang || 'ko-KR'
      utterance.rate = 0.9
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
      return true
    },
    [voice],
  )

  useEffect(() => stop, [stop])

  return { supported: voice !== null, speaking, speak, stop }
}
