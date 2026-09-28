import { createStore, get, set } from 'idb-keyval'

import type { Slang } from '../data/types'

const customSlangStore = createStore(
  'hangul-typing-game-custom-slang',
  'customSlang',
)
const CUSTOM_SLANG_KEY = 'items'

export async function getCustomSlang() {
  return (await get<Slang[]>(CUSTOM_SLANG_KEY, customSlangStore)) ?? []
}

export async function addCustomSlang(item: Slang) {
  const items = await getCustomSlang()
  const updatedItems = [item, ...items.filter(({ id }) => id !== item.id)]
  await set(CUSTOM_SLANG_KEY, updatedItems, customSlangStore)
  return updatedItems
}

export async function setCustomSlangStatus(
  itemId: string,
  status: Slang['status'],
) {
  const items = await getCustomSlang()
  const updatedItems = items.map((item) =>
    item.id === itemId ? { ...item, status } : item,
  )
  await set(CUSTOM_SLANG_KEY, updatedItems, customSlangStore)
  return updatedItems
}

export async function importCustomSlang(items: readonly Slang[]) {
  const current = await getCustomSlang()
  const imported = items.map((item) => ({
    ...item,
    id: item.id.startsWith('custom-')
      ? item.id
      : `custom-${crypto.randomUUID()}`,
    origin: 'custom' as const,
  }))
  const importedIds = new Set(imported.map(({ id }) => id))
  const updatedItems = [
    ...imported,
    ...current.filter(({ id }) => !importedIds.has(id)),
  ]
  await set(CUSTOM_SLANG_KEY, updatedItems, customSlangStore)
  return updatedItems
}
