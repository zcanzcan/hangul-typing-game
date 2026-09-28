import { expect, test, type Page } from '@playwright/test'

async function clearBrowserData(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()
    await Promise.all(
      ['hangul-typing-game-records', 'hangul-typing-game-mistakes'].map(
        (databaseName) =>
          new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(databaseName)
            request.onsuccess = () => resolve()
            request.onerror = () => resolve()
            request.onblocked = () => resolve()
          }),
      ),
    )
  })
  await page.reload()
}

async function startProfile(
  page: Page,
  ageLabel: '초등학생' | '성인' | '어르신',
  nickname: string,
) {
  await page.getByRole('button', { name: new RegExp(ageLabel) }).click()
  await page.getByLabel('별명').fill(nickname)
  await page.getByRole('button', { name: '연습 시작하기' }).click()
  await expect(
    page.getByRole('heading', { name: `${nickname}님, 반가워요!` }),
  ).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await clearBrowserData(page)
})

test('시작 화면에서 만든 프로필과 설정이 새로고침 뒤에도 남는다', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: '한글 타자 놀이터' }),
  ).toBeVisible()
  await startProfile(page, '어르신', '느긋한타자')

  await page.getByRole('button', { name: /설정/ }).click()
  await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
  await expect(page.getByText('사용 안 함')).toBeVisible()
  await page.getByRole('button', { name: '아주 크게' }).click()
  await page.getByRole('button', { name: '설정 저장' }).click()
  await expect(page.getByRole('status')).toContainText('저장')
  await page.getByRole('button', { name: /메인으로/ }).click()

  await page.reload()
  await expect(
    page.getByRole('heading', { name: '느긋한타자님, 반가워요!' }),
  ).toBeVisible()
  await expect(page.locator('.app')).toHaveAttribute('data-font-size', 'xlarge')
})

test('자리 연습을 마치면 결과와 기록이 저장되고 다음 단계가 열린다', async ({
  page,
}) => {
  await startProfile(page, '초등학생', '새싹')
  await page.getByRole('button', { name: /자리 연습/ }).click()
  await expect(page.getByRole('heading', { name: '자리 연습' })).toBeVisible()

  for (const [index, character] of [
    'ㅁ',
    'ㄴ',
    'ㅇ',
    'ㄹ',
    'ㅓ',
    'ㅏ',
    'ㅣ',
  ].entries()) {
    await page.getByLabel('입력').fill(character)
    await page.getByRole('button', { name: '입력 확인' }).click()
    await expect(page.getByRole('status')).toContainText('잘했어요')
    await page
      .getByRole('button', {
        name: index === 6 ? '결과 보기' : '다음 문제',
      })
      .click()
  }

  await expect(page.getByRole('heading', { name: '연습 결과' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '최고 기록 갱신!' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '내 기록 보기' }).click()
  await expect(page.getByRole('heading', { name: '내 기록' })).toBeVisible()
  await expect(page.getByText('모드별 최고 기록')).toBeVisible()
  await expect(page.getByText('자리 연습').first()).toBeVisible()

  await page.getByRole('button', { name: /메인으로/ }).click()
  await expect(page.getByRole('button', { name: /낱말 연습/ })).toBeEnabled()
})

test('낱말 입력 뒤 뜻을 보고 틀린 낱말을 복습할 수 있다', async ({ page }) => {
  await startProfile(page, '성인', '정확한손')
  await page.getByRole('button', { name: /낱말 연습/ }).click()
  await expect(page.getByRole('heading', { name: '낱말 연습' })).toBeVisible()

  const answers = ['다무', '사과', '학교', '까치', '닭']
  for (const [index, answer] of answers.entries()) {
    await page.getByLabel('입력').fill(answer)
    await page.getByRole('button', { name: '입력 확인' }).click()
    await expect(page.locator('.meaning-card')).toContainText(
      index === 1 ? '사과나무의 열매' : '뜻 카드',
    )
    await page
      .getByRole('button', {
        name: index === answers.length - 1 ? '결과 보기' : '다음 문제',
      })
      .click()
  }

  await expect(page.getByRole('heading', { name: '연습 결과' })).toBeVisible()
  await expect(page.getByText('나무')).toBeVisible()
  await page.getByRole('button', { name: '다시 연습하기' }).click()
  await expect(
    page.getByRole('heading', { name: '틀린 낱말 다시 연습' }),
  ).toBeVisible()
  await expect(page.getByText('나무')).toBeVisible()
  await page.getByRole('button', { name: '연습하기' }).click()
  await expect(page.getByText('다시 연습')).toBeVisible()
})

test('열린 짧은 문장 연습에서 기기 입력과 화면 키보드를 사용할 수 있다', async ({
  page,
}) => {
  await startProfile(page, '성인', '문장가')
  await page.evaluate(() => {
    localStorage.setItem(
      'hangul-game:progress:v1',
      JSON.stringify({ version: 1, completedModes: ['word'] }),
    )
  })
  await page.reload()

  await page.getByRole('button', { name: /짧은 문장 연습/ }).click()
  await expect(
    page.getByRole('heading', { name: '짧은 문장 연습' }),
  ).toBeVisible()
  await page.getByLabel('입력').fill('오늘')
  await expect(page.getByLabel('입력')).toHaveValue('오늘')
  await page.getByLabel('입력').fill('')
  await page.getByRole('button', { name: /ㅁ 키/ }).click()
  await expect(page.getByLabel('입력')).toHaveValue('ㅁ')
})
