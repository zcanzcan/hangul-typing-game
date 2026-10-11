import works from './works.json'
import type { LiteratureWork } from './types'

export async function loadLiteratureWorks(): Promise<LiteratureWork[]> {
  if (works.length > 0) return works as LiteratureWork[]
  if (import.meta.env.DEV) {
    const { LITERATURE_FIXTURES } = await import('./fixtures')
    return LITERATURE_FIXTURES
  }
  return []
}
