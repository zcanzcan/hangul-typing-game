import { expect, test, type Page } from '@playwright/test'

async function clearBrowserData(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()
    await Promise.all(
      [
        'hangul-typing-game-records',
        'hangul-typing-game-mistakes',
        'hangul-typing-game-custom-slang',
      ].map(
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

test('시작 화면의 서버 전송 안내와 출처 링크에서 사전·코드 라이선스를 구분한다', async ({
  page,
}, testInfo) => {
  await expect(page.getByText(/직접 기록 올리기를 선택하면/)).toBeVisible()
  await expect(page.locator('.license-footer')).toContainText(
    '국립국어원 한국어기초사전',
  )
  await page.screenshot({
    path: testInfo.outputPath('start-attribution.png'),
    fullPage: true,
  })
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('link', { name: '출처·라이선스 (새 창)' }).click()
  const sourcePage = await popupPromise
  await expect(
    sourcePage.getByRole('heading', { name: '출처·라이선스', exact: true }),
  ).toBeVisible()
  await expect(
    sourcePage.getByRole('link', { name: /CC BY-SA 2.0 KR/ }),
  ).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by-sa/2.0/kr/',
  )
  await expect(
    sourcePage.getByRole('link', { name: 'MIT 라이선스', exact: true }),
  ).toHaveAttribute('href', 'CODE_LICENSE.txt')
  await expect(sourcePage.locator('tbody tr')).toHaveCount(51)
  await sourcePage.screenshot({ path: testInfo.outputPath('licenses.png') })
  await sourcePage.close()
  await expect(page.getByLabel('별명')).toBeVisible()
})

test('시작 화면에서 만든 프로필과 설정이 새로고침 뒤에도 남는다', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: '한글 타자 놀이터' }),
  ).toBeVisible()
  await startProfile(page, '어르신', '느긋한타자')

  await page.getByRole('button', { name: '⚙ 설정' }).click()
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

test('한국어 목소리가 있는 기기에서 낱말과 뜻을 읽어 준다', async ({
  page,
}) => {
  await page.addInitScript(() => {
    class FakeUtterance {
      text: string
      voice: SpeechSynthesisVoice | null = null
      lang = ''
      rate = 1
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null

      constructor(text: string) {
        this.text = text
      }
    }

    const koreanVoice = {
      default: true,
      lang: 'ko-KR',
      localService: true,
      name: '테스트 한국어',
      voiceURI: 'test-ko',
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeUtterance,
    })
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        getVoices: () => [koreanVoice],
        cancel: () => undefined,
        speak: (utterance: FakeUtterance) => utterance.onstart?.(),
      },
    })
  })
  await page.reload()
  await startProfile(page, '성인', '귀기울임')
  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByRole('checkbox', { name: '소리 읽어주기' }).check()
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: /낱말 연습/ }).click()
  await page.getByRole('button', { name: '1단계 받침 없는 글자 시작' }).click()

  await page.getByRole('button', { name: '🔈 낱말 듣기' }).click()
  await expect(page.getByRole('button', { name: '🔊 읽는 중' })).toBeVisible()
})

test('메인에 오늘의 낱말을 보여주고 초등학생 연습에는 그림 카드를 붙인다', async ({
  page,
}) => {
  await startProfile(page, '초등학생', '그림새싹')
  const dailyWord = page.locator('.daily-word-card')
  await expect(dailyWord).toBeVisible()
  await expect(
    dailyWord.getByText('오늘의 낱말', { exact: true }),
  ).toBeVisible()
  await expect(dailyWord.locator('.daily-word-card__emoji')).toBeVisible()

  await page.getByRole('button', { name: /자리 연습/ }).click()
  for (const character of ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ']) {
    await page.getByLabel('입력').fill(character)
    await page.getByRole('button', { name: '입력 확인' }).click()
    await page
      .getByRole('button', {
        name: character === 'ㅣ' ? '결과 보기' : '다음 문제',
      })
      .click()
  }
  await page.getByRole('button', { name: '메인으로' }).click()
  await page.getByRole('button', { name: /낱말 연습/ }).click()
  await page.getByRole('button', { name: '1단계 받침 없는 글자 시작' }).click()
  await expect(page.locator('.practice-card__emoji')).toContainText('🌳')
})

test('성인 긴 문장과 맞춤법 연습을 하고 속도 설정을 저장한다', async ({
  page,
}) => {
  await startProfile(page, '성인', '바른글')

  await page.getByRole('button', { name: /긴 문장 연습/ }).click()
  await expect(
    page.getByRole('heading', { name: '긴 문장 연습' }),
  ).toBeVisible()
  await expect(page.locator('#practice-target')).toHaveAttribute(
    'aria-label',
    /새로운 일을 배울 때에는/,
  )
  await page.getByRole('button', { name: /메인으로/ }).click()

  await page.getByRole('button', { name: /헷갈리는 맞춤법/ }).click()
  for (const answer of [
    '이제 준비가 돼요.',
    '오늘은 비가 안 와요.',
    '학생으로서 책임을 다해요.',
    '며칠 뒤에 다시 만나요.',
    '웬일로 일찍 왔어요?',
  ]) {
    await page.getByRole('button', { name: answer, exact: true }).click()
    await expect(page.getByRole('status')).toContainText('맞았어요')
    await page
      .getByRole('button', {
        name: answer.startsWith('웬일') ? '결과 보기' : '다음 문제',
      })
      .click()
  }
  await expect(page.getByRole('heading', { name: '연습 결과' })).toBeVisible()
  await expect(page.getByText('100%')).toBeVisible()
  await page.getByRole('button', { name: '메인으로' }).click()

  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByRole('checkbox', { name: '시간 제한' }).uncheck()
  await page.getByRole('button', { name: '빠르게' }).click()
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.reload()
  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await expect(
    page.getByRole('checkbox', { name: '시간 제한' }),
  ).not.toBeChecked()
  await expect(page.getByRole('button', { name: '빠르게' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('틀린 맞춤법을 고치고 속담 뜻을 맞힌 뒤 하루 목표 도장을 확인한다', async ({
  page,
}) => {
  await startProfile(page, '성인', '배움이')
  await page.getByRole('button', { name: /틀린 맞춤법 고치기/ }).click()
  for (const answer of [
    '이제 준비가 돼요.',
    '오늘은 비가 안 와요.',
    '학생으로서 책임을 다해요.',
    '며칠 뒤에 다시 만나요.',
    '웬일로 일찍 왔어요?',
  ]) {
    await page.getByLabel('바른 문장').fill(answer)
    await page.getByRole('button', { name: '고치기 확인' }).click()
    await expect(page.getByRole('status')).toContainText('바르게 고쳤어요')
    await page
      .getByRole('button', {
        name: answer.startsWith('웬일') ? '결과 보기' : '다음 문장',
      })
      .click()
  }
  await expect(page.getByText('틀린 맞춤법 고치기')).toBeVisible()
  await page.getByRole('button', { name: '메인으로' }).click()

  await page.getByRole('button', { name: '💡 뜻 퀴즈 시작' }).click()
  for (const meaning of [
    '남에게 좋게 말해야 자신도 좋은 말을 들을 수 있다는 뜻.',
    '아주 작은 것도 꾸준히 모으면 큰 것이 된다는 뜻.',
    '쉬운 일도 서로 도우면 더 수월하다는 뜻.',
    '꾸준히 노력하면 아무리 어려운 일도 이룰 수 있다는 뜻.',
    '한 가지 일을 하여 두 가지 이익을 얻는다는 뜻.',
    '나쁜 일이 바뀌어 오히려 좋은 일이 된다는 뜻.',
  ]) {
    await page.getByRole('button', { name: meaning, exact: true }).click()
    await expect(page.getByRole('status')).toContainText('뜻을 맞혔어요')
    await page
      .getByRole('button', {
        name: meaning.startsWith('나쁜 일이') ? '결과 보기' : '다음 문제',
      })
      .click()
  }
  await expect(page.getByText('속담·사자성어 뜻 퀴즈')).toBeVisible()
  await page.getByRole('button', { name: '메인으로' }).click()

  await page.evaluate(() => {
    const stored = JSON.parse(
      localStorage.getItem('hangul-game:profile:v1') ?? '{}',
    )
    const now = new Date()
    const dateKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')
    localStorage.setItem(
      'hangul-game:daily-goals:v1',
      JSON.stringify({
        version: 1,
        profiles: { [stored.profile.id]: { [dateKey]: 600 } },
      }),
    )
  })
  await page.reload()
  await expect(page.getByText('오늘 도장을 받았어요!')).toBeVisible()
  await page.getByRole('button', { name: '도장 달력 보기' }).click()
  await expect(page.getByText('오늘 목표를 채웠어요!')).toBeVisible()
  await expect(page.getByLabel(/일 목표 달성/)).toBeVisible()
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

test('가족을 추가하고 별명별 기록 사용자로 전환한다', async ({ page }) => {
  await startProfile(page, '성인', '첫주자')
  await page.getByRole('button', { name: /가족 점수판/ }).click()
  await expect(page.getByRole('heading', { name: '점수판' })).toBeVisible()

  await page.getByRole('tab', { name: '가족 점수판' }).click()
  await expect(
    page.getByRole('heading', { name: '가족 최고 기록' }),
  ).toBeVisible()
  await expect(
    page.locator('.family-ranking li').filter({ hasText: '첫주자' }),
  ).toBeVisible()

  await page.getByLabel('별명').fill('느린손')
  await page.getByLabel('가족 연령대').selectOption('senior')
  await page.getByRole('button', { name: '가족 추가하기' }).click()
  await expect(page.getByRole('status')).toContainText('느린손 가족을 추가')

  const newMember = page.locator('.family-ranking li').filter({
    hasText: '느린손',
  })
  await expect(newMember).toContainText('어르신')
  await newMember.getByRole('button', { name: '이 별명으로 시작' }).click()
  await expect(
    page.getByRole('heading', { name: '느린손님, 반가워요!' }),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole('heading', { name: '느린손님, 반가워요!' }),
  ).toBeVisible()
})

test('반 점수판에서 새 반 만들기와 코드 참여 화면을 제공한다', async ({
  page,
}) => {
  await startProfile(page, '성인', '우리반타자')
  await page.getByRole('button', { name: /가족 점수판/ }).click()
  await page.getByRole('tab', { name: '반 점수판' }).click()

  await expect(
    page.getByRole('heading', { name: '반 점수판 연결' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '새 반 만들기' })).toBeVisible()
  await expect(page.getByLabel('반 코드')).toHaveAttribute(
    'placeholder',
    'ABCD2345',
  )

  await page.getByLabel('반 코드').fill('짧음')
  await page.getByRole('button', { name: '반 코드로 들어가기' }).click()
  await expect(page.getByRole('alert')).toContainText(
    '반 코드는 숫자와 영문 대문자 8자리',
  )
})

test('낱말 입력 뒤 뜻을 보고 틀린 낱말을 복습할 수 있다', async ({ page }) => {
  await startProfile(page, '성인', '정확한손')
  await page.getByRole('button', { name: /낱말 연습/ }).click()
  await expect(
    page.getByRole('heading', { name: '낱말 단계 고르기' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '1단계 받침 없는 글자 시작' }).click()
  await expect(page.getByRole('heading', { name: '낱말 연습' })).toBeVisible()

  const answers = ['다무', '사과', '바다', '기차', '모자']
  for (const [index, answer] of answers.entries()) {
    await page.getByLabel('입력').fill(answer)
    await page.getByRole('button', { name: '입력 확인' }).click()
    await expect(page.locator('.meaning-card')).toContainText(
      index === 1
        ? '모양이 둥글고 붉으며 새콤하고 단맛이 나는 과일.'
        : '뜻 카드',
    )
    await page
      .getByRole('button', {
        name: index === answers.length - 1 ? '결과 보기' : '다음 문제',
      })
      .click()
  }

  await expect(page.getByRole('heading', { name: '연습 결과' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '다음 낱말 단계 연습' }),
  ).toBeVisible()
  await expect(page.getByText('나무')).toBeVisible()
  await page.getByRole('button', { name: '다시 연습하기' }).click()
  await expect(
    page.getByRole('heading', { name: '틀린 낱말 다시 연습' }),
  ).toBeVisible()
  await expect(page.getByText('나무')).toBeVisible()
  await page.getByRole('button', { name: '연습하기' }).click()
  await expect(page.getByText('다시 연습')).toBeVisible()
})

test('받침 없는 낱말을 통과하면 받침 단계가 열리고 단계별 기록을 남긴다', async ({
  page,
}) => {
  await startProfile(page, '성인', '단계타자')
  await page.getByRole('button', { name: /낱말 연습/ }).click()

  const firstStage = page.getByRole('button', {
    name: '1단계 받침 없는 글자 시작',
  })
  const secondStage = page.getByRole('button', {
    name: '2단계 받침 연습 잠김',
  })
  const thirdStage = page.getByRole('button', {
    name: '3단계 쌍자음·겹받침 잠김',
  })

  await expect(firstStage).toBeEnabled()
  await expect(secondStage).toBeDisabled()
  await expect(thirdStage).toBeDisabled()
  await firstStage.click()

  for (let index = 0; index < 5; index += 1) {
    const answer = await page
      .locator('#practice-target')
      .getAttribute('aria-label')
    await page.getByLabel('입력').fill(answer ?? '')
    await page.getByRole('button', { name: '입력 확인' }).click()
    await page
      .getByRole('button', {
        name: index === 4 ? '결과 보기' : '다음 문제',
      })
      .click()
  }

  await expect(page.getByText('낱말 연습 · 1단계 받침 없는 글자')).toBeVisible()
  await page.getByRole('button', { name: '다음 낱말 단계 연습' }).click()
  await expect(page.getByText('2단계 · 받침 연습')).toBeVisible()
  await expect(page.locator('#practice-target')).toHaveAttribute(
    'aria-label',
    '학교',
  )
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

test('유행어 모드를 켜고 검수된 사용자 카드를 게임에서 플레이한다', async ({
  page,
}) => {
  await startProfile(page, '초등학생', '말빛')
  await page.getByRole('button', { name: '⚙ 설정' }).click()

  const slangMode = page.getByRole('checkbox', { name: '유행어 모드' })
  await expect(slangMode).not.toBeChecked()
  await slangMode.check()

  await page.getByLabel('유행어', { exact: true }).fill('ㅅ.ㅂ')
  await page.getByLabel('뜻', { exact: true }).fill('검사할 뜻')
  await page.getByRole('button', { name: '유행어 추가' }).click()
  await expect(page.getByRole('status')).toContainText(
    '학생에게 알맞지 않은 말',
  )

  await page.getByLabel('유행어', { exact: true }).fill('말빛')
  await page.getByLabel('뜻', { exact: true }).fill('말로 전하는 밝은 기운.')
  await page.getByLabel('예문 (선택)').fill('친구에게 말빛을 전했어.')
  await page.getByRole('button', { name: '유행어 추가' }).click()
  await expect(page.getByRole('status')).toContainText('카드를 추가')

  const customSlang = page
    .locator('.slang-library li')
    .filter({ hasText: '말빛' })
    .first()
  await expect(customSlang).toContainText('현재 유행어')
  await customSlang.getByRole('button', { name: '옛 유행어로 이동' }).click()
  await expect(page.getByRole('status')).toContainText('옛 유행어 모음')
  await customSlang.getByRole('button', { name: '현재 목록으로 복원' }).click()
  await expect(page.getByRole('status')).toContainText('현재 유행어로 다시')

  await page.getByRole('button', { name: '최신 목록 확인' }).click()
  await expect(page.getByRole('status')).toContainText('최신 유행어 목록')

  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.reload()

  await page.getByRole('button', { name: '게임 시작' }).click()
  await expect(
    page.getByRole('heading', { name: '유행어 카드게임' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: '말빛' })).toBeVisible()
  await expect(page.getByText(/등록 .*직접 추가/)).toBeVisible()

  await page.getByRole('button', { name: '말로 전하는 밝은 기운.' }).click()
  await page.getByLabel('유행어 입력').fill('말빛')
  await page.getByRole('button', { name: '입력 확인' }).click()
  await expect(page.getByRole('status')).toContainText('+150점')
  await page.getByRole('button', { name: '다음 문제' }).click()

  for (let question = 2; question <= 10; question += 1) {
    const word = await page.locator('#slang-word').innerText()
    await page.locator('.slang-choices button').first().click()

    const typingInput = page.getByLabel('유행어 입력')
    if (await typingInput.isVisible()) {
      await typingInput.fill(word)
      await page.getByRole('button', { name: '입력 확인' }).click()
    }

    await page
      .getByRole('button', {
        name: question === 10 ? '결과 보기' : '다음 문제',
      })
      .click()
  }

  await expect(
    page.getByRole('heading', { name: '유행어 게임 결과' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '점수판 보기' }).click()
  await expect(page.getByText('유행어 카드게임').first()).toBeVisible()
})

test('낱말 비에서 꾸러미를 고르고 새싹을 지킨 기록을 남긴다', async ({
  page,
}) => {
  await startProfile(page, '성인', '비구름')
  await page.getByRole('button', { name: '낱말 비 시작' }).click()
  await expect(
    page.getByRole('heading', { name: '낱말 비', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /표준어/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /요즘 말/ })).toHaveCount(0)

  await page.clock.install()
  await page.getByRole('button', { name: /표준어/ }).click()
  const firstDrop = page.locator('.rain-word').first()
  await expect(firstDrop).toBeVisible()
  const word = await firstDrop.innerText()

  await page.getByLabel('내리는 낱말 입력').fill(word)
  await page.getByRole('button', { name: '입력 확인' }).click()
  await expect(page.getByRole('status')).toContainText('빗방울을 없앴어요')

  await page.getByRole('button', { name: /일시정지/ }).click()
  await expect(
    page.getByText('잠깐 쉬고 있어요.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '계속하기', exact: true }).click()

  await page.clock.runFor(15_000)
  await expect(
    page.getByRole('heading', { name: '낱말 비 결과' }),
  ).toBeVisible()
  await expect(page.getByText('없앤 낱말')).toBeVisible()
  await page.getByRole('button', { name: '내 기록 보기' }).click()
  await expect(page.getByText('낱말 비 · 표준어').first()).toBeVisible()
})

test('유행어 모드를 켜면 요즘 말 낱말 비와 화면 확인 키를 쓸 수 있다', async ({
  page,
}) => {
  await startProfile(page, '초등학생', '말비')
  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByRole('checkbox', { name: '유행어 모드' }).check()
  await page.getByLabel('입력 키보드').selectOption('app')
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()

  await page.getByRole('button', { name: '낱말 비 시작' }).click()
  await expect(page.getByRole('button', { name: /^요즘 말/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /섞어서/ })).toBeVisible()
  await page.getByRole('button', { name: /^요즘 말/ }).click()

  await expect(page.locator('.page-shell')).toHaveAttribute(
    'data-theme',
    'pixel',
  )
  const firstDrop = page.locator('.rain-word').first()
  const word = await firstDrop.innerText()
  await page.getByLabel('내리는 낱말 입력').fill(word)
  await page
    .getByRole('button', { name: '입력 확인', exact: true })
    .last()
    .click()
  await expect(page.getByRole('status').last()).toContainText(
    '빗방울을 없앴어요',
  )
})

test('뜻을 보고 요즘 말을 입력해 스피드 퀴즈 기록을 남긴다', async ({
  page,
}) => {
  await startProfile(page, '성인', '번개타자')
  await expect(
    page.getByRole('heading', { name: '⚡ 요즘 말 스피드 퀴즈' }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: '⚙ 설정' }).click()
  await page.getByRole('checkbox', { name: '유행어 모드' }).check()
  await page.getByRole('button', { name: '설정 저장' }).click()
  await page.getByRole('button', { name: /메인으로/ }).click()
  await page.getByRole('button', { name: '스피드 퀴즈 시작' }).click()

  await expect(
    page.getByRole('heading', { name: '요즘 말 스피드 퀴즈' }),
  ).toBeVisible()
  await expect(page.getByText('문제 1/10')).toBeVisible()

  const slangItems = await page.evaluate(async () => {
    const response = await fetch('/data/slang.json')
    return (await response.json()).items as Array<{
      text: string
      meaning: string
    }>
  })
  const firstMeaning = await page.locator('#slang-quiz-meaning').innerText()
  const firstAnswer = slangItems.find(
    ({ meaning }) => meaning === firstMeaning,
  )?.text
  expect(firstAnswer).toBeTruthy()

  await page.getByLabel('요즘 말 입력').fill(firstAnswer!.split('').join(' '))
  await page.getByLabel('요즘 말 입력').press('Enter')
  await expect(page.getByText(/정답이에요|콤보 보너스/)).toBeVisible()
  await page.getByRole('button', { name: '다음 문제' }).click()

  for (let question = 2; question <= 10; question += 1) {
    const input = page.getByLabel('요즘 말 입력')
    await input.fill('없는답')
    await input.press('Enter')
    await expect(
      page.getByText('아쉬워요. 두 번 더 입력할 수 있어요.'),
    ).toBeVisible()
    await input.fill('다시오답')
    await input.press('Enter')
    await expect(
      page.getByText('아쉬워요. 한 번 더 입력할 수 있어요.'),
    ).toBeVisible()
    await input.fill('또오답')
    await input.press('Enter')
    await expect(
      page.getByText('다시 두 번 시도했어요. 정답을 확인해요.'),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: question === 10 ? '결과 보기' : '다음 문제',
      })
      .click()
  }

  await expect(
    page.getByRole('heading', { name: '요즘 말 스피드 퀴즈 결과' }),
  ).toBeVisible()
  await expect(page.getByText('1/10')).toBeVisible()
  await page.getByRole('button', { name: '내 기록 보기' }).click()
  await expect(page.getByText('요즘 말 스피드 퀴즈').first()).toBeVisible()
})

test('낱말 블록을 쌓고 세 번 흔들린 탑의 기록과 뜻을 확인한다', async ({
  page,
}) => {
  await startProfile(page, '성인', '탑쌓기')
  await page.getByRole('button', { name: '낱말 탑 시작' }).click()

  await expect(
    page.getByRole('heading', { name: '낱말 탑 쌓기' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '60초 도전' })).toBeVisible()
  await page.getByRole('button', { name: '표준어 꾸러미로 시작' }).click()

  const firstWord = await page.locator('#tower-word').innerText()
  const input = page.getByLabel('탑 낱말 입력')
  await input.fill(firstWord)
  await input.press('Enter')
  await expect(page.getByRole('status')).toContainText('1층 완성')
  await page.getByRole('button', { name: `뜻 보기: ${firstWord}` }).click()
  await expect(page.getByRole('button', { name: '뜻 카드 닫기' })).toBeVisible()

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await input.fill(`오답${attempt}`)
    await input.press('Enter')
  }

  await expect(
    page.getByRole('heading', { name: '낱말 탑 결과' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '1층까지 쌓았어요!' }),
  ).toBeVisible()
  await page.getByRole('button', { name: `1층 ${firstWord} 뜻 보기` }).click()
  await expect(page.getByText(firstWord).last()).toBeVisible()

  await page.getByRole('button', { name: '내 기록 보기' }).click()
  await expect(page.getByText('낱말 탑 · 표준어').first()).toBeVisible()
})

test('성인은 낱말 탑 60초 도전을 별도 기록으로 남긴다', async ({ page }) => {
  await startProfile(page, '성인', '시간탑')
  await page.getByRole('button', { name: '낱말 탑 시작' }).click()
  await page.getByRole('button', { name: '60초 도전' }).click()
  await page.getByRole('button', { name: '표준어 꾸러미로 시작' }).click()

  await expect(page.getByText('표준어 · 60초 도전')).toBeVisible()
  const input = page.getByLabel('탑 낱말 입력')
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await input.fill(`시간오답${attempt}`)
    await input.press('Enter')
  }

  await expect(
    page.getByRole('heading', { name: '낱말 탑 결과' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '내 기록 보기' }).click()
  await expect(page.getByText('낱말 탑 · 표준어 · 60초').first()).toBeVisible()
})

test('컴퓨터와 끝말잇기를 하고 탈락 결과를 기록한다', async ({ page }) => {
  await startProfile(page, '성인', '말꼬리')
  await page.getByRole('button', { name: '끝말잇기 시작' }).click()
  await expect(
    page.getByRole('heading', { name: '끝말잇기 타자' }),
  ).toBeVisible()
  await expect(page.getByText('컴퓨터와 1:1')).toBeVisible()
  await page.getByRole('button', { name: '끝말잇기 시작' }).click()

  await expect(page.getByText('말꼬리님 차례')).toBeVisible()
  await page.getByLabel('이을 낱말').fill('무지개')
  await page.getByRole('button', { name: '잇기' }).click()
  await expect(page.getByRole('status')).toContainText('무지개')

  for (let failure = 1; failure <= 3; failure += 1) {
    await expect(page.getByText('말꼬리님 차례')).toBeVisible()
    await page.getByLabel('이을 낱말').fill('없는말')
    await page.getByRole('button', { name: '잇기' }).click()
    if (failure < 3) {
      await expect(page.getByRole('status')).toContainText('목록에 없는 말')
    }
  }

  await expect(
    page.getByRole('heading', { name: '끝말잇기 결과' }),
  ).toBeVisible()
  await expect(page.getByText('한글봇님이 이겼어요!')).toBeVisible()
  await page.getByRole('button', { name: '점수판 보기' }).click()
  await expect(page.getByText('끝말잇기 타자').first()).toBeVisible()
})
