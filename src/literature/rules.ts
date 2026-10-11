import { judgeTyping } from '../typing/judge'
import { calculateCpm, countKeystrokes } from '../typing/metrics'

// 구절 경계는 데이터의 passages로 관리하고, 입력 중 줄바꿈은 공백 한 칸으로 처리합니다.
export function normalizeLiteratureInput(text: string) {
  return text.normalize('NFC').replace(/\r\n|\r|\n/g, ' ')
}

export function judgePassage(
  target: string,
  input: string,
  composing: boolean,
) {
  const normalizedTarget = normalizeLiteratureInput(target)
  const normalizedInput = normalizeLiteratureInput(input)
  const judgments = judgeTyping({
    target: normalizedTarget,
    input: normalizedInput,
    isComposing: composing,
  }).map((judgment) =>
    // 중간 위치를 고치는 IME도 조합 중에는 불일치를 오답으로 확정하지 않습니다.
    composing && judgment.status === 'incorrect'
      ? { ...judgment, status: 'composing' as const }
      : judgment,
  )
  const correct = judgments.filter(({ status }) => status === 'correct').length
  const total = Math.max(
    Array.from(normalizedTarget).length,
    Array.from(normalizedInput).length,
  )
  return {
    judgments,
    correct,
    total,
    accuracy: total === 0 ? 0 : (correct / total) * 100,
    complete: !composing && normalizedInput === normalizedTarget && total > 0,
  }
}

export function passageMetrics(
  passages: string[],
  durationSec: number,
  correct: number,
  assessed: number,
) {
  const keystrokes = passages.reduce(
    (sum, text) => sum + countKeystrokes(normalizeLiteratureInput(text)),
    0,
  )
  return {
    keystrokes,
    cpm: durationSec > 0 ? calculateCpm(keystrokes, durationSec) : 0,
    accuracy: assessed > 0 ? (correct / assessed) * 100 : 0,
  }
}
