import { expect, test } from '@playwright/test'

const basePath = process.env.VITE_BASE_PATH ?? '/'

test('설치 manifest와 서비스 워커로 오프라인 연습 데이터를 제공한다', async ({
  context,
  page,
}) => {
  await page.goto(basePath)
  await expect(
    page.getByRole('heading', { name: '한글 타자 놀이터' }),
  ).toBeVisible()

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    /manifest\.webmanifest/,
  )
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', { name: '한글 타자 놀이터' }),
  ).toBeVisible()

  const cachedWords = await page.evaluate(async () => {
    const response = await fetch('data/words.json')
    const collection = (await response.json()) as { items: unknown[] }
    return { ok: response.ok, count: collection.items.length }
  })
  expect(cachedWords.ok).toBe(true)
  expect(cachedWords.count).toBeGreaterThan(0)
  for (const path of [
    'licenses.html',
    'data/DATA_LICENSE.txt',
    'CODE_LICENSE.txt',
    'THIRD_PARTY_NOTICES.txt',
  ]) {
    const cached = await page.evaluate(async (path) => {
      const response = await fetch(path)
      return { ok: response.ok, text: await response.text() }
    }, path)
    expect(cached.ok).toBe(true)
    expect(cached.text.length).toBeGreaterThan(100)
    if (path === 'THIRD_PARTY_NOTICES.txt') {
      expect(cached.text).toContain('Apache License')
      expect(cached.text).toContain('Permission is hereby granted')
    }
  }
  await page.getByRole('link', { name: '출처·라이선스 (새 창)' }).focus()
  expect(
    await page
      .getByRole('link', { name: '출처·라이선스 (새 창)' })
      .getAttribute('href'),
  ).toBe(`${basePath}licenses.html`)
})

test('문학 공개 빌드에서 fixture를 제외하고 출처 파일·기존 프로필을 오프라인으로 유지한다', async ({
  context,
  page,
}) => {
  await page.goto(basePath)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.getByRole('button', { name: /성인/ }).click()
  await page.getByLabel('별명').fill('기존독자')
  await page.getByRole('button', { name: '연습 시작하기' }).click()
  const stored = await page.evaluate(() =>
    localStorage.getItem('hangul-game:profiles:v1'),
  )
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', { name: '기존독자님, 반가워요!' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('hangul-game:profiles:v1')),
  ).toBe(stored)
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await expect(page.getByRole('note')).toHaveCount(0)
  const works = await page.evaluate(async () => {
    const response = await fetch('data/literature.json')
    return { ok: response.ok, works: await response.json() }
  })
  expect(works.ok).toBe(true)
  expect(
    works.works.every(
      (work: { verification: string }) => work.verification === 'verified',
    ),
  ).toBe(true)
  expect(works.works).toHaveLength(2)
  await page.getByRole('button', { name: /서시/ }).click()
  await expect(
    page.getByRole('region', { name: '작품 출처와 이용조건' }),
  ).toContainText('공유마당')
  await page.getByRole('button', { name: '문학 글자 크기 키우기' }).click()
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  while (await page.getByLabel('구절 따라 입력').count()) {
    await page
      .getByLabel('구절 따라 입력')
      .fill(await page.getByLabel('따라 읽을 구절').innerText())
    await page
      .getByRole('button', { name: /^(확인하고 다음 구절|연습 완료 확인)$/ })
      .click()
  }
  await expect(
    page.getByRole('heading', { name: '문학 연습을 마쳤어요' }),
  ).toBeVisible()
  const records = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem('hangul-typing-game-literature-v1') ?? '[]',
    ),
  )
  expect(records).toHaveLength(1)
  expect(records[0].completedCount).toBe(9)
  expect(records[0].accuracy).toBe(100)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await expect(
    page.getByRole('region', { name: '문학 글자 크기 설정' }),
  ).toContainText('125%')
  await expect(page.locator('.literature-history li')).toHaveCount(1)
  const license = await page.evaluate(async () =>
    (await fetch('data/LITERATURE_LICENSE.txt')).text(),
  )
  expect(license).toContain('프로그램 코드의 MIT와 작품별 이용조건은 별개')
})
