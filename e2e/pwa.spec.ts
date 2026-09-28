import { expect, test } from '@playwright/test'

test('설치 manifest와 서비스 워커로 오프라인 연습 데이터를 제공한다', async ({
  context,
  page,
}) => {
  await page.goto('/hangul-typing-game/')
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
})
