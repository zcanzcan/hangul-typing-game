export const LITERATURE_FONT_KEY = 'hangul-typing-game-literature-font-v1'
export const FONT_STEPS = [1, 1.25, 1.5, 1.75, 2] as const
export type LiteratureFontScale = (typeof FONT_STEPS)[number]

export function readLiteratureFont(): {
  scale: LiteratureFontScale
  error: boolean
} {
  try {
    const raw = localStorage.getItem(LITERATURE_FONT_KEY)
    if (raw === null) return { scale: 1, error: false }
    const value: unknown = JSON.parse(raw)
    if (!FONT_STEPS.some((scale) => scale === value))
      return { scale: 1, error: true }
    return { scale: value as LiteratureFontScale, error: false }
  } catch {
    return { scale: 1, error: true }
  }
}

export function saveLiteratureFont(scale: LiteratureFontScale) {
  try {
    if (scale === 1) localStorage.removeItem(LITERATURE_FONT_KEY)
    else localStorage.setItem(LITERATURE_FONT_KEY, JSON.stringify(scale))
    return true
  } catch {
    return false
  }
}
