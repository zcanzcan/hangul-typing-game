import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('저장된 프로필이 없으면 시작 화면을 보여준다', () => {
    localStorage.clear()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '한글 타자 놀이터' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('별명')).toBeInTheDocument()
  })
})
