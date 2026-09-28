import { describe, expect, it } from 'vitest'

import type { Slang } from '../data/types'
import {
  buildCustomSlangExport,
  fetchLatestSlang,
  parseCustomSlangImport,
} from './lifecycle'

const custom: Slang = {
  id: 'custom-1',
  text: '말빛',
  meaning: '밝은 말',
  addedAt: '2026-09-29',
  status: 'active',
  kidSafe: true,
  origin: 'custom',
}

describe('유행어 운영', () => {
  it('직접 추가한 말만 JSON으로 내보내고 다시 읽는다', () => {
    const exported = buildCustomSlangExport(
      [custom, { ...custom, id: 'official', origin: 'official' }],
      '2026-09-29T00:00:00.000Z',
    )
    expect(exported.items).toEqual([custom])
    expect(parseCustomSlangImport(JSON.stringify(exported))).toEqual([custom])
  })

  it('필수 항목이 빠진 JSON을 거절한다', () => {
    expect(() =>
      parseCustomSlangImport(JSON.stringify({ version: 1, items: [{}] })),
    ).toThrow('필수 항목')
  })

  it('캐시를 쓰지 않고 최신 목록을 확인한다', async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ version: 'new', items: [custom] }), {
        status: 200,
      })
    await expect(fetchLatestSlang(fetcher as typeof fetch)).resolves.toEqual({
      version: 'new',
      items: [custom],
    })
  })
})
