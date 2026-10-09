import { expect, test, type Page } from '@playwright/test'

async function startAdult(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /성인/ }).click()
  await page.getByLabel('별명').fill('모바일확인')
  await page.getByRole('button', { name: '연습 시작하기' }).click()
}

test('휴대폰 화면에서 조합 중 판정을 보류하고 완성된 낱말 뜻을 표시한다', async ({
  page,
}, testInfo) => {
  await startAdult(page)
  await page.getByRole('button', { name: /낱말 연습/ }).click()
  await page.getByRole('button', { name: '1단계 받침 없는 글자 시작' }).click()
  const input = page.getByLabel('입력', { exact: true })
  await input.dispatchEvent('compositionstart')
  await input.fill('나')
  await expect(page.getByRole('button', { name: '입력 확인' })).toBeDisabled()
  await expect(
    page.locator('.typing-target__character.is-incorrect'),
  ).toHaveCount(0)
  await input.fill('나무')
  await input.dispatchEvent('compositionend', { data: '나무' })
  await page.getByRole('button', { name: '입력 확인' }).click()
  await expect(page.locator('.meaning-card')).toContainText(
    '단단한 줄기에 가지와 잎이 달린, 여러 해 동안 자라는 식물.',
  )
  await expect(page.locator('.meaning-card')).toHaveCSS('opacity', '1')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('mobile-meaning.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: '다음 문제' }).click()
  await input.focus()
  const width = page.viewportSize()!.width
  await page.setViewportSize({ width, height: 400 })
  await expect(page.locator('body')).toHaveAttribute(
    'data-virtual-keyboard',
    'open',
  )
  const box = await input.boundingBox()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(400)
  await page.screenshot({
    path: testInfo.outputPath('mobile-keyboard-space.png'),
  })
})

test('휴대폰 낱말 비에서 조합 Enter와 뒤따른 Enter가 한 번만 제출된다', async ({
  page,
}) => {
  await startAdult(page)
  await page.getByRole('button', { name: '낱말 비 시작' }).click()
  await page.clock.install()
  await page.getByRole('button', { name: /표준어/ }).click()
  const drop = page.locator('.rain-word').first()
  const text = await drop.innerText()
  const input = page.getByLabel('내리는 낱말 입력')
  await input.dispatchEvent('compositionstart')
  await input.fill(text)
  await input.dispatchEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    isComposing: true,
  })
  await expect(drop).toBeVisible()
  await input.dispatchEvent('compositionend', { data: text })
  await input.dispatchEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    isComposing: false,
  })
  await expect(page.locator('.rain-word')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('빗방울을 없앴어요')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
