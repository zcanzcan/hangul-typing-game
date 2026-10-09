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
