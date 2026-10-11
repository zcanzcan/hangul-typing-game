import { expect, test, type Page } from '@playwright/test'

async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /성인/ }).click()
  await page.getByLabel('별명').fill('문학산책')
  await page.getByRole('button', { name: '연습 시작하기' }).click()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await expect(page.getByRole('note')).toHaveCount(0)
  await page.getByRole('button', { name: /진달래꽃/ }).click()
  await expect(
    page.getByRole('region', { name: '작품 출처와 이용조건' }),
  ).toContainText('공유마당')
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
}

async function typeCurrent(page: Page) {
  const target = await page.getByLabel('따라 읽을 구절').innerText()
  await page.getByLabel('구절 따라 입력').fill(target)
}

async function finish(page: Page) {
  while (await page.getByLabel('구절 따라 입력').count()) {
    await typeCurrent(page)
    await page
      .getByRole('button', { name: /^(확인하고 다음 구절|연습 완료 확인)$/ })
      .click()
  }
}

test('출처 → IME 이벤트 → 수정·붙여넣기 정책 → 완료·다시하기·기록 보존', async ({
  page,
}, testInfo) => {
  await start(page)
  await page.screenshot({
    path: testInfo.outputPath('literature-desktop-reading.png'),
    fullPage: true,
  })
  const field = page.getByLabel('구절 따라 입력')
  await field.evaluate((el) =>
    el.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    ),
  )
  await field.fill('채')
  await expect(
    page.getByRole('button', { name: '확인하고 다음 구절' }),
  ).toBeDisabled()
  await expect(page.getByLabel('채 다름')).toHaveCount(0)
  await field.fill(await page.getByLabel('따라 읽을 구절').innerText())
  await field.evaluate((el) => {
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertCompositionText',
      }),
    )
  })
  await expect(page.getByLabel('따라 읽을 구절')).toContainText(
    '나 보기가 역겨워',
  )
  await expect(field).not.toHaveValue('')
  await field.evaluate((el) => {
    const prevented = !el.dispatchEvent(
      new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertFromPaste',
        data: '붙여넣기',
      }),
    )
    if (!prevented) throw new Error('붙여넣기가 차단되지 않았습니다')
  })
  await expect(page.getByRole('status')).toContainText('직접 입력')
  await field.fill('틀린 구절')
  await page.getByRole('button', { name: '확인하고 다음 구절' }).click()
  await expect(page.getByRole('status')).toContainText('고쳐')
  await typeCurrent(page)
  await page.getByRole('button', { name: '확인하고 다음 구절' }).dblclick()
  await expect(field).toHaveValue('')
  await finish(page)
  await expect(
    page.getByRole('heading', { name: '문학 연습을 마쳤어요' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toContainText('기록을 저장')
  await page.screenshot({
    path: testInfo.outputPath('literature-desktop-result.png'),
    fullPage: true,
  })
  const records = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem('hangul-typing-game-literature-v1') ?? '[]',
    ),
  )
  expect(records).toHaveLength(1)
  expect(records[0].checks).toBe(13)
  expect(records[0].accuracy).toBeLessThan(100)
  await page.getByRole('button', { name: '같은 작품 다시하기' }).click()
  await expect(field).toHaveValue('')
  await expect(page.getByLabel('따라 읽을 구절')).toContainText(
    '나 보기가 역겨워',
  )
  await page.getByRole('button', { name: '작품 바꾸기' }).click()
  await expect(page.locator('.literature-history li')).toHaveCount(1)
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.reload()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await expect(page.locator('.literature-history li')).toHaveCount(1)
})

test('작품 교체·중간 재시작·뒤로가기와 기존 세 게임 메뉴 회귀', async ({
  page,
}) => {
  await start(page)
  await page.getByLabel('구절 따라 입력').fill('중간 입력')
  await page.getByRole('button', { name: '처음부터 다시' }).click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue('')
  await page.getByRole('button', { name: '작품 바꾸기' }).click()
  await page.getByRole('button', { name: /서시/ }).click()
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  await expect(page.getByLabel('따라 읽을 구절')).toHaveText(
    '죽는 날까지 하늘을 우러러',
  )
  await page.getByRole('button', { name: /메인으로/ }).click()
  for (const [button, heading] of [
    ['낱말 비 시작', '낱말 비'],
    ['낱말 탑 시작', '낱말 탑 쌓기'],
    ['끝말잇기 시작', '끝말잇기 타자'],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click()
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: /메인으로/ }).click()
  }
  expect(
    await page.evaluate(() =>
      localStorage.getItem('hangul-typing-game-literature-v1'),
    ),
  ).toBeNull()
})

test('저장소 용량 오류에도 요약·재시도가 동작하며 설정에서 문학 기록을 초기화한다', async ({
  page,
}) => {
  await start(page)
  await typeCurrent(page)
  await page.getByRole('button', { name: '확인하고 다음 구절' }).click()
  while (
    await page.getByRole('button', { name: '확인하고 다음 구절' }).count()
  ) {
    await typeCurrent(page)
    await page.getByRole('button', { name: '확인하고 다음 구절' }).click()
  }
  await typeCurrent(page)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'hangul-typing-game-literature-v1')
        throw new DOMException('full', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: '연습 완료 확인' }).click()
  await expect(page.getByRole('alert')).toContainText('저장하지 못했어요')
  await page.getByRole('button', { name: '기록 저장 다시 시도' }).click()
  await expect(page.getByRole('alert')).toContainText('저장하지 못했어요')
  await page.getByRole('button', { name: '메인으로 돌아가기' }).click()
  await page.reload()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await page.getByRole('button', { name: /진달래꽃/ }).click()
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  await typeCurrent(page)
  await page.getByRole('button', { name: '확인하고 다음 구절' }).click()
  await finish(page)
  await page.getByRole('button', { name: '메인으로 돌아가기' }).click()
  await page.getByRole('button', { name: '⚙ 설정' }).click()
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: '기록 초기화' }).click()
  await expect(page.getByRole('status')).toContainText('초기화')
  expect(
    await page.evaluate(() =>
      localStorage.getItem('hangul-typing-game-literature-v1'),
    ),
  ).toBeNull()
})

test('문학 화면 키보드는 자모 수정과 문장부호 입력을 지원한다', async ({
  page,
}) => {
  await start(page)
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByLabel('입력 키보드').selectOption('app')
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: /고전문학 읽으며 연습/ }).click()
  await page.getByRole('button', { name: /진달래꽃/ }).click()
  await page.getByRole('button', { name: '이 작품 읽으며 연습하기' }).click()
  for (const jamo of ['ㅊ', 'ㅐ', 'ㄱ'])
    await page.getByRole('button', { name: new RegExp(`^${jamo} 키`) }).click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue('책')
  await page
    .getByRole('button', { name: '한 글자 지우기', exact: true })
    .click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue('채')
  for (let i = 0; i < 3; i++) {
    await typeCurrent(page)
    await page.getByRole('button', { name: '확인하고 다음 구절' }).click()
  }
  const target = await page.getByLabel('따라 읽을 구절').innerText()
  await page.getByLabel('구절 따라 입력').fill(target.slice(0, -1))
  await page.getByRole('button', { name: ') 입력', exact: true }).click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue(target)
  await page.getByRole('button', { name: '확인하고 다음 구절' }).click()
  await expect(page.getByLabel('구절 따라 입력')).toHaveValue('')
})

test('문학 읽기·입력·상태의 텍스트 대비와 키보드 포커스를 제공한다', async ({
  page,
}) => {
  await start(page)
  const field = page.getByLabel('구절 따라 입력')
  await field.fill('나')
  await field.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(field).toBeFocused()
  expect(await field.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe(
    '4px',
  )
  const ratios = await page.evaluate(() => {
    function luminance(color: string) {
      const rgb = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const c = value / 255
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        })
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    }
    return [
      '.literature-passage',
      '.literature-input',
      '.literature-help',
      '.literature-status',
      '.literature-character.is-correct',
      '.literature-screen .button--primary',
    ].map((selector) => {
      const el = document.querySelector(selector)!
      const fg = luminance(getComputedStyle(el).color)
      let node: Element | null = el
      let background = 'rgba(0, 0, 0, 0)'
      while (node && background === 'rgba(0, 0, 0, 0)') {
        background = getComputedStyle(node).backgroundColor
        node = node.parentElement
      }
      const bg = luminance(background)
      return {
        selector,
        ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
      }
    })
  })
  for (const sample of ratios)
    expect(sample.ratio, sample.selector).toBeGreaterThanOrEqual(4.5)
})
