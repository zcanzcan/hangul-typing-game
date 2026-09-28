import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('준비 화면을 보여준다', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '한글 타자 게임 준비 중' }),
    ).toBeInTheDocument()
  })
})
