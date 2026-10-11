import { readFileSync } from 'node:fs'

// 메타데이터 검사는 원문 대조를 대신하지 않습니다. 대조 완료 자료만 등록합니다.
export function readVerifiedLiterature() {
  const works = JSON.parse(readFileSync('src/literature/works.json', 'utf8'))
  if (!Array.isArray(works)) throw new Error('문학 목록은 배열이어야 합니다.')
  const ids = new Set()
  for (const work of works) {
    if (!['고전문학', '근대문학'].includes(work.category))
      throw new Error(`문학 시대 분류 누락: ${work.id}`)
    for (const field of [
      'id',
      'version',
      'title',
      'author',
      'description',
      'edition',
      'sourceName',
      'sourceUrl',
      'licenseName',
      'licenseUrl',
      'usage',
      'processing',
      'verifiedAt',
    ]) {
      if (typeof work[field] !== 'string' || !work[field].trim())
        throw new Error(`문학 출처 필드 누락: ${work.id ?? '?'} / ${field}`)
    }
    if (
      work.verification !== 'verified' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(work.verifiedAt)
    )
      throw new Error(`원문 검증 완료 표시가 없는 작품: ${work.id}`)
    if (ids.has(work.id)) throw new Error(`문학 ID 중복: ${work.id}`)
    ids.add(work.id)
    for (const field of ['sourceUrl', 'licenseUrl']) {
      if (new URL(work[field]).protocol !== 'https:')
        throw new Error(`문학 출처 링크는 https여야 합니다: ${work.id}`)
    }
    if (
      !Array.isArray(work.passages) ||
      !work.passages.length ||
      work.passages.some(
        (text) =>
          typeof text !== 'string' ||
          !text.trim() ||
          text !== text.normalize('NFC') ||
          /[\r\n\t]/.test(text),
      )
    )
      throw new Error(`빈 구절·NFC·구절 분할 오류: ${work.id}`)
  }
  return works
}
