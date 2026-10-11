import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiteratureScreen } from './LiteratureScreen'
import { LITERATURE_FIXTURES } from '../literature/fixtures'
import { readLiteratureRecords } from '../literature/storage'
import { createProfile } from '../storage/profile'

const profile = createProfile('책읽기', 'adult')
const work = { ...LITERATURE_FIXTURES[0], passages: ['강', '사과.'] }
function open() {
  render(
    <LiteratureScreen
      profile={profile}
      onBack={vi.fn()}
      initialWorks={[work, LITERATURE_FIXTURES[1]]}
    />,
  )
  fireEvent.click(
    screen.getByRole('button', { name: /내부 테스트 문장 · 천천히 읽기/ }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: '이 작품 읽으며 연습하기' }),
  )
}
function type(value: string) {
  fireEvent.change(screen.getByLabelText('구절 따라 입력'), {
    target: { value },
  })
}
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('문학 입력 화면', () => {
  it('조합 종료와 trailing input 중복으로 구절을 넘기거나 기록하지 않는다', () => {
    open()
    const input = screen.getByLabelText('구절 따라 입력')
    fireEvent.compositionStart(input)
    type('가')
    expect(
      screen.getByRole('button', { name: '확인하고 다음 구절' }),
    ).toBeDisabled()
    expect(screen.queryByLabelText('가 다름')).not.toBeInTheDocument()
    type('강')
    fireEvent.compositionEnd(input, { target: { value: '강' } })
    fireEvent.input(input, { target: { value: '강' } })
    expect(screen.getByLabelText('따라 읽을 구절')).toHaveTextContent('강')
    fireEvent.click(screen.getByRole('button', { name: '확인하고 다음 구절' }))
    expect(screen.getByLabelText('구절 따라 입력')).toHaveValue('')
    type('사과.')
    const button = screen.getByRole('button', { name: '연습 완료 확인' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(
      screen.getByRole('heading', { name: '문학 연습을 마쳤어요' }),
    ).toBeInTheDocument()
    expect(readLiteratureRecords(profile.id).items).toHaveLength(1)
    expect(readLiteratureRecords(profile.id).items[0].checks).toBe(2)
  })
  it('오답 동일값 재확인을 중복 집계하지 않고 수정 후 성공한다', () => {
    open()
    type('감')
    fireEvent.click(screen.getByRole('button', { name: '확인하고 다음 구절' }))
    fireEvent.click(screen.getByRole('button', { name: '확인하고 다음 구절' }))
    expect(screen.getByRole('status')).toHaveTextContent('고쳐')
    type('강')
    fireEvent.click(screen.getByRole('button', { name: '확인하고 다음 구절' }))
    type('사과.')
    fireEvent.click(screen.getByRole('button', { name: '연습 완료 확인' }))
    expect(readLiteratureRecords(profile.id).items[0].checks).toBe(3)
    expect(readLiteratureRecords(profile.id).items[0].accuracy).toBe(80)
  })
  it('붙여넣기·드롭을 차단하고 재시작·작품 변경은 미완료 기록을 남기지 않는다', () => {
    open()
    const input = screen.getByLabelText('구절 따라 입력')
    expect(
      fireEvent.paste(input, { clipboardData: { getData: () => '강' } }),
    ).toBe(false)
    expect(fireEvent.drop(input)).toBe(false)
    expect(input).toHaveValue('')
    type('감')
    fireEvent.click(screen.getByRole('button', { name: '처음부터 다시' }))
    expect(screen.getByLabelText('구절 따라 입력')).toHaveValue('')
    expect(screen.getByText(/걸린 시간/)).toHaveTextContent('0초')
    fireEvent.click(screen.getByRole('button', { name: '작품 바꾸기' }))
    expect(
      screen.getByRole('heading', { name: '읽고 싶은 작품을 골라요' }),
    ).toBeInTheDocument()
    expect(readLiteratureRecords(profile.id).items).toHaveLength(0)
  })
  it('저장 실패 후에도 완료 요약을 보여주고 재시도한다', () => {
    open()
    type('강')
    fireEvent.click(screen.getByRole('button', { name: '확인하고 다음 구절' }))
    type('사과.')
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('full')
      })
    fireEvent.click(screen.getByRole('button', { name: '연습 완료 확인' }))
    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했어요')
    write.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '기록 저장 다시 시도' }))
    expect(readLiteratureRecords(profile.id).items).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '같은 작품 다시하기' }))
    expect(screen.getByLabelText('구절 따라 입력')).toHaveValue('')
    expect(screen.getByLabelText('따라 읽을 구절')).toHaveTextContent('강')
  })
  it('글자 확대가 입력·구절을 유지하며 저장값을 복원하고 초기화한다', () => {
    open()
    type('가')
    for (let i = 0; i < 4; i++)
      fireEvent.click(
        screen.getByRole('button', { name: '문학 글자 크기 키우기' }),
      )
    expect(screen.getByLabelText('구절 따라 입력')).toHaveValue('가')
    expect(screen.getByLabelText('따라 읽을 구절')).toHaveTextContent('강')
    expect(screen.getByLabelText('문학 글자 크기 설정')).toHaveTextContent(
      '200%',
    )
    cleanup()
    open()
    expect(screen.getByLabelText('문학 글자 크기 설정')).toHaveTextContent(
      '200%',
    )
    fireEvent.click(
      screen.getByRole('button', { name: '문학 글자 크기 기본값으로 초기화' }),
    )
    expect(screen.getByLabelText('문학 글자 크기 설정')).toHaveTextContent(
      '100%',
    )
  })
  it('글자 설정 저장 실패에도 현재 화면의 확대를 적용한다', () => {
    open()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    fireEvent.click(
      screen.getByRole('button', { name: '문학 글자 크기 키우기' }),
    )
    expect(screen.getByLabelText('문학 글자 크기 설정')).toHaveTextContent(
      '125%',
    )
    expect(screen.getByLabelText('문학 글자 크기 설정')).toHaveTextContent(
      '저장하지 못',
    )
  })
  it('검증된 작품이 없는 목록도 명확히 안내한다', () => {
    render(
      <LiteratureScreen profile={profile} onBack={vi.fn()} initialWorks={[]} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('검증된 작품을 준비')
    expect(
      screen.queryByRole('button', { name: '이 작품 읽으며 연습하기' }),
    ).not.toBeInTheDocument()
  })
})
