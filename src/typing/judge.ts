import { disassemble } from 'es-hangul'

export type CharacterStatus = 'correct' | 'incorrect' | 'composing'

export interface CharacterJudgement {
  index: number
  expected: string
  actual: string
  status: CharacterStatus
  isPrefixMatch?: boolean
}

export interface JudgeTypingInput {
  target: string
  input: string
  isComposing: boolean
}

function isHangulPrefix(expected: string, actual: string) {
  if (expected === '' || actual === '') {
    return false
  }

  return disassemble(expected).startsWith(disassemble(actual))
}

export function judgeTyping({
  target,
  input,
  isComposing,
}: JudgeTypingInput): CharacterJudgement[] {
  const expectedCharacters = Array.from(target)
  const actualCharacters = Array.from(input)

  return actualCharacters.map((actual, index) => {
    const expected = expectedCharacters[index] ?? ''
    const isLastInput = index === actualCharacters.length - 1

    if (isComposing && isLastInput) {
      return {
        index,
        expected,
        actual,
        status: 'composing',
        isPrefixMatch: isHangulPrefix(expected, actual),
      }
    }

    return {
      index,
      expected,
      actual,
      status: actual === expected ? 'correct' : 'incorrect',
    }
  })
}
