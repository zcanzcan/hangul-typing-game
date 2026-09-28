import { assemble, disassemble } from 'es-hangul'

export interface KeyboardStroke {
  jamo: string
  key: string
  shift: boolean
}

const JAMO_KEYS: Readonly<Record<string, Omit<KeyboardStroke, 'jamo'>>> = {
  ㄱ: { key: 'r', shift: false },
  ㄲ: { key: 'r', shift: true },
  ㄴ: { key: 's', shift: false },
  ㄷ: { key: 'e', shift: false },
  ㄸ: { key: 'e', shift: true },
  ㄹ: { key: 'f', shift: false },
  ㅁ: { key: 'a', shift: false },
  ㅂ: { key: 'q', shift: false },
  ㅃ: { key: 'q', shift: true },
  ㅅ: { key: 't', shift: false },
  ㅆ: { key: 't', shift: true },
  ㅇ: { key: 'd', shift: false },
  ㅈ: { key: 'w', shift: false },
  ㅉ: { key: 'w', shift: true },
  ㅊ: { key: 'c', shift: false },
  ㅋ: { key: 'z', shift: false },
  ㅌ: { key: 'x', shift: false },
  ㅍ: { key: 'v', shift: false },
  ㅎ: { key: 'g', shift: false },
  ㅏ: { key: 'k', shift: false },
  ㅐ: { key: 'o', shift: false },
  ㅑ: { key: 'i', shift: false },
  ㅒ: { key: 'o', shift: true },
  ㅓ: { key: 'j', shift: false },
  ㅔ: { key: 'p', shift: false },
  ㅕ: { key: 'u', shift: false },
  ㅖ: { key: 'p', shift: true },
  ㅗ: { key: 'h', shift: false },
  ㅛ: { key: 'y', shift: false },
  ㅜ: { key: 'n', shift: false },
  ㅠ: { key: 'b', shift: false },
  ㅡ: { key: 'm', shift: false },
  ㅣ: { key: 'l', shift: false },
}

function toKeyboardStroke(character: string): KeyboardStroke {
  const mappedKey = JAMO_KEYS[character]

  if (mappedKey) {
    return { jamo: character, ...mappedKey }
  }

  if (character === ' ') {
    return { jamo: character, key: 'Space', shift: false }
  }

  return {
    jamo: character,
    key: character.toLowerCase(),
    shift: character !== character.toLowerCase(),
  }
}

export function getKeySequence(text: string): KeyboardStroke[] {
  return Array.from(disassemble(text), toKeyboardStroke)
}

export function composeJamo(jamoSequence: readonly string[]) {
  return assemble([...jamoSequence])
}

export function appendJamo(currentText: string, nextJamo: string) {
  return assemble([currentText, nextJamo])
}
