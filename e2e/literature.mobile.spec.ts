import { expect, test } from '@playwright/test'

test('문학 연습은 모바일에서도 가로 넘침 없이 수정·완료·출처 조회가 된다', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: /어르신/ }).click()
  await page.getByLabel('별명').fill('느린독서')
  await page.getByRole('button', { name: '연습 시작하기' }).click()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await page.getByRole('button', { name: /서시/ }).click()
  await page.screenshot({
    path: testInfo.outputPath('literature-mobile-source.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  let first = true
  while (await page.getByLabel('구절 따라 입력').count()) {
    const action = (await page
      .getByRole('button', { name: '연습 완료 확인' })
      .count())
      ? '연습 완료 확인'
      : '확인하고 다음 구절'
    const text = await page.getByLabel('따라 읽을 구절').innerText()
    await page.getByLabel('구절 따라 입력').fill(text)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    if (first) {
      first = false
      await page
        .getByText('작품 출처·이용조건 다시 보기', { exact: true })
        .click()
      await page.screenshot({
        path: testInfo.outputPath('literature-mobile-reading.png'),
        fullPage: true,
      })
    }
    await page.getByRole('button', { name: action }).click()
  }
  await expect(
    page.getByRole('heading', { name: '문학 연습을 마쳤어요' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('literature-mobile-result.png'),
    fullPage: true,
  })
})

test('문학 입력칸은 가상 키보드 높이 축소에서 화면 안으로 이동한다', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: /성인/ }).click()
  await page.getByLabel('별명').fill('키보드확인')
  await page.getByRole('button', { name: '연습 시작하기' }).click()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await page.getByRole('button', { name: /진달래꽃/ }).click()
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  const viewport = page.viewportSize()!
  await page.getByLabel('구절 따라 입력').focus()
  await page.setViewportSize({ width: viewport.width, height: 420 })
  await expect(page.locator('body')).toHaveAttribute(
    'data-virtual-keyboard',
    'open',
  )
  const box = await page.getByLabel('구절 따라 입력').boundingBox()
  expect(box?.y).toBeGreaterThanOrEqual(0)
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(420)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('literature-mobile-keyboard-height.png'),
  })
})

test('200% 글자 확대는 320px에서 재배치되고 키보드 조작·입력·저장·초기화를 유지한다', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: /어르신/ }).click()
  await page.getByLabel('별명').fill('큰글자독서')
  await page.getByRole('button', { name: '연습 시작하기' }).click()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  const increase = page.getByRole('button', { name: '문학 글자 크기 키우기' })
  await increase.focus()
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter')
  await expect(increase).toBeDisabled()
  await expect(
    page.getByRole('region', { name: '문학 글자 크기 설정' }),
  ).toContainText('200%')
  await page.getByRole('button', { name: /서시/ }).click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('literature-font-200-source.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  await page.getByLabel('구절 따라 입력').fill('죽는')
  await page.getByRole('button', { name: '문학 글자 크기 줄이기' }).click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue('죽는')
  await increase.click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  for (const button of await page.locator('.literature-screen .button').all()) {
    const box = await button.boundingBox()
    if (box) expect(box.height).toBeGreaterThanOrEqual(48)
  }
  await page.screenshot({
    path: testInfo.outputPath('literature-font-200-reading.png'),
    fullPage: true,
  })
  await page.reload()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await expect(
    page.getByRole('region', { name: '문학 글자 크기 설정' }),
  ).toContainText('200%')
  await page
    .getByRole('button', { name: '문학 글자 크기 기본값으로 초기화' })
    .click()
  await expect(
    page.getByRole('region', { name: '문학 글자 크기 설정' }),
  ).toContainText('100%')
  expect(
    await page.locator('meta[name="viewport"]').getAttribute('content'),
  ).not.toMatch(/user-scalable=no|maximum-scale=1/)
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByLabel('입력 키보드').selectOption('app')
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  for (let i = 0; i < 4; i++) await increase.click()
  await page.getByRole('button', { name: /서시/ }).click()
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  for (const key of await page.locator('.keyboard__key').all()) {
    const box = await key.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(48)
    expect(box!.height).toBeGreaterThanOrEqual(48)
  }
  await page.getByRole('button', { name: /^ㄷ 키/ }).click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue('ㄷ')
})
