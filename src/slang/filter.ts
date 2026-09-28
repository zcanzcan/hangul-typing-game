import { disassemble } from 'es-hangul'

export function normalizeForBlocklist(value: string) {
  const normalized = value.normalize('NFC').toLowerCase()
  return Array.from(disassemble(normalized))
    .filter((character) => /[ㄱ-ㅎㅏ-ㅣ가-힣a-z0-9]/.test(character))
    .join('')
}

export function containsBlockedExpression(
  value: string,
  blockedPatterns: readonly string[],
) {
  const normalizedValue = normalizeForBlocklist(value)

  return blockedPatterns.some((pattern) => {
    const normalizedPattern = normalizeForBlocklist(pattern)
    return (
      normalizedPattern !== '' && normalizedValue.includes(normalizedPattern)
    )
  })
}

export function validateSlangFields(
  fields: readonly string[],
  blockedPatterns: readonly string[],
) {
  return !fields.some((field) =>
    containsBlockedExpression(field, blockedPatterns),
  )
}
