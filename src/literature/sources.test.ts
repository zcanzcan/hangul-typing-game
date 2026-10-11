/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import works from './works.json'
import hashes from '../../data/literature/source-sha256.json'

it('확인한 공식 TXT의 행과 수록 구절이 정확히 일치하며 원본 파일 해시를 보존한다', () => {
  const sources = [
    '김정식-진달래꽃-개벽_25호',
    '윤동주-서시(序詩)-하늘과_바람과_별과_시',
  ]
  works.forEach((work, i) => {
    const raw = readFileSync(
      `data/literature/sources/${sources[i]}.txt`,
      'utf8',
    )
    const lines = raw
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(i === 0 ? 1 : 2)
      .map((line) => line.normalize('NFC'))
    expect(work.passages).toEqual(lines)
    expect(work.verification).toBe('verified')
  })
  for (const [name, hash] of Object.entries(hashes)) {
    expect(
      createHash('sha256')
        .update(readFileSync(`data/literature/sources/${name}`))
        .digest('hex'),
    ).toBe(hash)
  }
  expect(works.some((work) => work.id === 'gongu-9029202')).toBe(false)
})
