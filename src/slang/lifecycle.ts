import type { Slang, SlangCollection } from '../data/types'

export interface CustomSlangExport {
  version: 1
  exportedAt: string
  items: Slang[]
}

export function buildCustomSlangExport(
  items: readonly Slang[],
  exportedAt = new Date().toISOString(),
): CustomSlangExport {
  return {
    version: 1,
    exportedAt,
    items: items.filter(({ origin }) => origin === 'custom'),
  }
}

export function parseCustomSlangImport(value: string): Slang[] {
  const parsed = JSON.parse(value) as Partial<CustomSlangExport>

  if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
    throw new Error('지원하는 유행어 JSON 파일이 아니에요.')
  }

  const valid = parsed.items.filter(
    (item): item is Slang =>
      typeof item?.id === 'string' &&
      typeof item?.text === 'string' &&
      item.text.trim() !== '' &&
      typeof item?.meaning === 'string' &&
      item.meaning.trim() !== '' &&
      typeof item?.addedAt === 'string' &&
      ['active', 'archived'].includes(item.status),
  )

  if (valid.length !== parsed.items.length) {
    throw new Error('필수 항목이 빠진 유행어가 있어요.')
  }

  return valid
}

export async function fetchLatestSlang(
  fetcher: typeof fetch = fetch,
): Promise<SlangCollection> {
  const response = await fetcher(`data/slang.json?updated=${Date.now()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('최신 유행어 목록을 불러오지 못했어요.')
  }

  const collection = (await response.json()) as Partial<SlangCollection>
  if (
    typeof collection.version !== 'string' ||
    !Array.isArray(collection.items)
  ) {
    throw new Error('최신 유행어 목록의 형식이 올바르지 않아요.')
  }

  return collection as SlangCollection
}
