# 08. 기술 구성과 개발 순서

## 추천 기술 스택

바이브코딩(AI 코딩 도구)으로 만들기 쉽고, 무료로 배포할 수 있는 조합을 골랐다.

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **React + TypeScript + Vite** | AI 도구가 가장 잘 다루는 조합, 빠른 개발 서버 |
| 스타일 | CSS 변수 + CSS Modules (또는 Tailwind CSS) | 테마(캔디/픽셀) 전환이 쉬움 |
| 한글 처리 | `es-hangul` 등 자모 분해·조합 라이브러리 | 타수 계산, 다음 키 안내, 앱 화면 키보드 |
| 저장 | localStorage + IndexedDB (`idb-keyval` 등) | 서버 없이 기록 저장 |
| PWA | `vite-plugin-pwa` | 홈 화면 추가, 오프라인 사용 |
| 음성 | Web Speech API (`speechSynthesis`) | 소리 읽어주기, 추가 비용 없음 |
| 배포 | GitHub Pages 또는 Vercel/Netlify | 무료, 저장소에 올리면 자동 배포 |
| 테스트 | Vitest (판정·점수 로직), Playwright (화면) | |
| 서버 (P2, 반 점수판) | Supabase 또는 Firebase | 반 코드와 점수만 저장 |

## 폴더 구조 (제안)

```
src/
  app/            라우팅, 전역 상태
  screens/        Start, Menu, PositionPractice, WordPractice, MiniGame,
                  SlangCardGame, Result, Leaderboard, Settings
  components/     OnScreenKeyboard, MeaningCard, ProgressBar, ScoreBadge
  typing/         judge.ts (판정), metrics.ts (타수·정확도·점수), layout.ts (두벌식 자판)
  data/           불러오기, 금칙어 필터
  storage/        profiles, records, mistakes, customSlang
  styles/         themes (candy, pixel), tokens
public/data/      words.json, sentences.json, slang.json, blocklist.json
```

## 개발 순서

### 0단계. 준비
- Vite + React + TS 프로젝트 만들기, 린트/포맷 설정, GitHub Pages 자동 배포 설정

### 1단계. 타자 엔진 (가장 먼저, 테스트와 함께)
- `typing/judge.ts`: 조합 중 글자 처리, 글자별 맞음/틀림 판정
- `typing/metrics.ts`: 자모 기준 타수, 정확도, 점수
- `typing/layout.ts`: 두벌식 자판 배치, 글자 → 눌러야 할 키 목록
- 단위 테스트: `사과`=5타, 쌍자음, 겹받침(ㄳ, ㄺ 등), 조합 중 판정

### 2단계. MVP 화면
- 시작(연령대, 닉네임) → 메인 메뉴
- 자리 연습, 낱말 연습(뜻 카드), 짧은 문장 연습
- 화면 키보드(다음 키 빛남)
- 결과 화면, 내 기록, 최고 기록 축하, 틀린 낱말 복습
- 설정: 글자 크기 3단계, 효과음, 연령대 변경

### 3단계. 유행어 모드
- `slang.json` 불러오기, 카드게임, 설정에서 유행어 추가, 금칙어 필터

### 4단계. 태블릿 다듬기와 PWA
- iPad/Android 태블릿 실기기 테스트 (한글 조합 입력, 키보드 가림)
- PWA 설치, 오프라인 캐시

### 5단계. P1 기능
- 미니게임 낱말 비(떨어지는 낱말, 요즘 말 꾸러미 포함, [12](12-word-rain.md)), 요즘 말 스피드 퀴즈·낱말 탑 쌓기·끝말잇기([13](13-more-minigames.md)), 받침·쌍자음 단계, 가족 점수판, 소리 읽어주기, 오늘의 낱말, 유행어 원격 업데이트

### 6단계. P2 기능
- 반 점수판(서버), 맞춤법 고치기, 속담·사자성어 퀴즈, 하루 10분 도장

## 첫 버전 완료 기준

- [ ] PC 크롬/엣지, iPad 사파리, 안드로이드 태블릿 크롬에서 한글 입력이 정상 판정된다
- [ ] 초등학생/성인/어르신 프리셋이 글씨·시간 제한에 반영된다
- [ ] 낱말 입력 후 뜻 카드가 나온다
- [ ] 결과 화면에 타수·정확도·점수가 나오고 최고 기록 갱신이 표시된다
- [ ] 유행어 모드를 켜면 카드게임이 되고, 설정에서 추가한 유행어가 문제로 나온다
- [ ] 새로고침해도 기록이 남아 있다
- [ ] 개인정보(실명, 연락처 등)를 수집하지 않는다
