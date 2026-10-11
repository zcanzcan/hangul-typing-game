import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  LITERATURE_FONT_KEY,
  readLiteratureFont,
  saveLiteratureFont,
} from './preferences'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())
it('글자 크기를 저장·복원하며 기본 크기 초기화는 저장값을 지운다', () => {
  expect(readLiteratureFont()).toEqual({ scale: 1, error: false })
  expect(saveLiteratureFont(2)).toBe(true)
  expect(readLiteratureFont()).toEqual({ scale: 2, error: false })
  expect(saveLiteratureFont(1)).toBe(true)
  expect(localStorage.getItem(LITERATURE_FONT_KEY)).toBeNull()
})
it.each(['oops', '100', 'null', '"2"'])(
  '손상·허용되지 않은 설정 %s는 기본값으로 돌아간다',
  (value) => {
    localStorage.setItem(LITERATURE_FONT_KEY, value)
    expect(readLiteratureFont()).toEqual({ scale: 1, error: true })
  },
)
it('읽기·쓰기·초기화 차단을 보고하고 예외를 전파하지 않는다', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(readLiteratureFont()).toEqual({ scale: 1, error: true })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(saveLiteratureFont(2)).toBe(false)
  expect(saveLiteratureFont(1)).toBe(false)
})
