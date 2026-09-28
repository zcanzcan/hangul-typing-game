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
