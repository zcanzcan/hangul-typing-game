import { expect, test } from '@playwright/test'

test('태블릿 세로·가로 화면에서 화면 키보드와 가상 키보드 높이를 처리한다', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /초등학생/ }).click()
  await page.getByLabel('별명').fill('태블릿타자')
  await page.getByRole('button', { name: '연습 시작하기' }).click()

  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByLabel('입력 키보드').selectOption('app')
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: /자리 연습/ }).click()

  const pageFitsWidth = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  )
  expect(pageFitsWidth).toBe(true)

  const screenKey = page.getByRole('button', { name: /ㅁ 키/ })
  await expect(screenKey).toBeVisible()
  const keyBox = await screenKey.boundingBox()
  expect(keyBox?.width).toBeGreaterThanOrEqual(48)
  expect(keyBox?.height).toBeGreaterThanOrEqual(48)
  await screenKey.click()
  await expect(page.getByLabel('입력')).toHaveValue('ㅁ')

  const originalViewport = page.viewportSize()
  expect(originalViewport).not.toBeNull()
  const keyboardBox = await page.locator('.keyboard').boundingBox()
  expect(keyboardBox?.y).toBeGreaterThanOrEqual(0)
  expect(
    (keyboardBox?.y ?? 0) + (keyboardBox?.height ?? 0),
  ).toBeLessThanOrEqual(originalViewport?.height ?? 0)
  await page.getByLabel('입력').fill('')
  await page.getByLabel('입력').focus()
  await page.setViewportSize({
    width: originalViewport?.width ?? 768,
    height: 420,
  })

  await expect(page.locator('body')).toHaveAttribute(
    'data-virtual-keyboard',
    'open',
  )
  const inputBox = await page.getByLabel('입력').boundingBox()
  expect(inputBox?.y).toBeGreaterThanOrEqual(0)
  expect((inputBox?.y ?? 0) + (inputBox?.height ?? 0)).toBeLessThanOrEqual(420)
  await expect(page.locator('.keyboard')).toBeHidden()
})
