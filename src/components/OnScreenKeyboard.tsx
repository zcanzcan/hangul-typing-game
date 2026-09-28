import { getKeySequence } from '../typing/layout'

const KEYBOARD_ROWS = [
  [
    ['ㅂ', 'q'],
    ['ㅈ', 'w'],
    ['ㄷ', 'e'],
    ['ㄱ', 'r'],
    ['ㅅ', 't'],
    ['ㅛ', 'y'],
    ['ㅕ', 'u'],
    ['ㅑ', 'i'],
    ['ㅐ', 'o'],
    ['ㅔ', 'p'],
  ],
  [
    ['ㅁ', 'a'],
    ['ㄴ', 's'],
    ['ㅇ', 'd'],
    ['ㄹ', 'f'],
    ['ㅎ', 'g'],
    ['ㅗ', 'h'],
    ['ㅓ', 'j'],
    ['ㅏ', 'k'],
    ['ㅣ', 'l'],
  ],
  [
    ['ㅋ', 'z'],
    ['ㅌ', 'x'],
    ['ㅊ', 'c'],
    ['ㅍ', 'v'],
    ['ㅠ', 'b'],
    ['ㅜ', 'n'],
    ['ㅡ', 'm'],
  ],
] as const

interface OnScreenKeyboardProps {
  target: string
  input: string
  onJamo: (jamo: string) => void
  onBackspace: () => void
}

export function OnScreenKeyboard({
  target,
  input,
  onJamo,
  onBackspace,
}: OnScreenKeyboardProps) {
  const targetKeys = getKeySequence(target)
  const inputKeys = getKeySequence(input)
  const nextKey = targetKeys[inputKeys.length]

  return (
    <section className="keyboard" aria-label="화면 키보드">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className="keyboard__row" key={rowIndex}>
          {row.map(([jamo, key]) => {
            const isNext = nextKey?.key === key
            return (
              <button
                className={`keyboard__key ${isNext ? 'keyboard__key--next' : ''}`}
                type="button"
                key={key}
                onClick={() =>
                  onJamo(isNext && nextKey.shift ? getShiftJamo(jamo) : jamo)
                }
                aria-label={`${jamo} 키${isNext ? ', 다음 키' : ''}`}
              >
                <span>{jamo}</span>
                <small>{key.toUpperCase()}</small>
              </button>
            )
          })}
        </div>
      ))}
      <div className="keyboard__row">
        <button
          className="keyboard__key keyboard__key--wide"
          type="button"
          onClick={() => onJamo(' ')}
        >
          띄어쓰기
        </button>
        <button
          className="keyboard__key keyboard__key--wide"
          type="button"
          onClick={onBackspace}
        >
          한 글자 지우기
        </button>
      </div>
    </section>
  )
}

function getShiftJamo(jamo: string) {
  const shifted: Readonly<Record<string, string>> = {
    ㄱ: 'ㄲ',
    ㄷ: 'ㄸ',
    ㅂ: 'ㅃ',
    ㅅ: 'ㅆ',
    ㅈ: 'ㅉ',
    ㅐ: 'ㅒ',
    ㅔ: 'ㅖ',
  }

  return shifted[jamo] ?? jamo
}
