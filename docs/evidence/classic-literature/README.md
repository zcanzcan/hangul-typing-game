# 고전문학 모드 개발 검증 — 2026-10-10

문학 모드와 공식 제공 판본 2편의 로컬 미리보기를 준비했다. 「진달래꽃」 12행·「서시」 9행을 공유마당 TXT·PDF와 대조해 수록했다. 코드 MIT와 작품별 만료저작물 이용조건을 분리하고, 근대문학 분류·판본·처리 범위·확인일을 UI와 출처 페이지에 표시한다. 「산유화」는 옛 표기와 PUA 글자 때문에 수록을 보류했다. [원문·해시 증거](../../../data/literature/README.md) 참고. 최초 개발은 로컬 전용으로 진행했고, 2026-10-11 사용자 승인 후 기존 GitHub/Vercel 연결로 배포 절차를 진행한다.

## 작업 상태

- 기준: 공개 GitHub `origin/main`의 `c3ec41e` (PR #21 출처 정리 반영).
- 로컬 브랜치: `step-5-classic-literature`. 독립 clone에서 구현했고 공개 반영 전 전체 검증을 수행한다.
- 기존 checkout은 `prepare/open-source-2026-10-09`의 깨끗한 상태였고, 원본을 변경하지 않았다. 별도의 `.agents/skills`/`.codex`나 로컬 memories 디렉터리는 없었다.
- `AGENTS.md`, `CLAUDE.md`, 기능·입력·타수·데이터·디자인·개발단계 문서를 확인했다. 사용자가 직접 요청한 새 기능 범위와 로컬 전용 조건을 기존 단계/PR 지침보다 우선 적용했다. 기존 개발 단계 체크박스는 변경하지 않았다.

## 실행 결과

Node v24.18.0, npm 11.16.0, Chromium/Playwright. 의존성은 `npm ci --offline`로 설치했다.

| 명령 | 결과 |
|---|---|
| `npm run lint` | 통과 |
| `npx tsc -b` | 통과 |
| `npm test` | 27 파일, 138 테스트 통과 (문학 규칙/저장/화면/글자 설정/원문 해시 22개 포함) |
| `npm run test:e2e` | 최종 38 테스트 통과 (기존 27개·문학 11개 포함) |
| `npm run test:e2e -- e2e/literature.spec.ts e2e/literature.mobile.spec.ts` | 작품 등록·확대 추가 후 문학 10 테스트 통과, 이후 대비·포커스 테스트를 포함한 전체 38개 통과 |
| `npm run build` | TypeScript·Vite·고지 생성·PWA 생성 통과, precache 24 항목 |
| `npm run test:pwa` | 2 테스트 통과: 오프라인 콘텐츠·고지, 공개 빌드 fixture 제외·기존 프로필 보존·오프라인 서시 9행 완료·기록과 125% 글자 설정 재방문 보존 |
| `git diff --check` | 통과 |
| 제작 JS와 JSON sentinel 검사 | `fixture-reading`, `fixture-punctuation`, 두 fixture 구절이 제작 JS에 없음, 제작 문학 JSON은 verified 작품 2개 |
| 임시 작업 폴더의 등록 게이트 검사 | 개발 fixture 분류와 누락 출처를 `readVerifiedLiterature()`가 거부함 |

처음 e2e에서 설정 초기화 확인 대화상자를 테스트가 자동 닫아 1개가 실패했다. 테스트에 기존 확인 대화상자 accept를 추가했고 최종 전체 테스트는 통과했다. 모바일 캡처의 좁은 헤더 문제는 문학 화면에서 한 열 헤더로 수정 후 다시 검증했다.

자동화로 검증한 입력은 NFC·개행 공백·띄어쓰기/문장부호·중간 수정·IME 이벤트·trailing input·수정 후 확인·붙여넣기/drop·화면 자모/문장부호·중복 완료다. 기록은 프로필 분리·100회 제한·손상/차단/용량 오류·저장 재시도·새로고침 보존·설정 초기화를 검증했다. 작품 교체·재시작·메인 이동 후 미완료 기록 없음과 기존 세 게임 진입도 확인했다.

## 로컬 미리보기

개발 서버: `http://127.0.0.1:4173/`. 처음 열면 연령과 별명을 고르고, 메인의 **고전문학 읽으며 연습**으로 들어간다. 이미 저장한 프로필이면 메인이 열린다. 「진달래꽃」 또는 「서시」를 선택해 출처 설명을 읽고 시작할 수 있다. 글자 크기 컨트롤은 작품 선택·입력·완료 모두에 적용되며 진행 중 값을 유지한다.

서버가 종료됐으면 다음 명령으로 다시 시작한다.

```bash
cd hangul-typing-game
npm run dev -- --host 127.0.0.1 --port 4173
```

## 보존한 스크린샷

최종 캡처는 실제 수록한 「진달래꽃」·「서시」를 표시한다. Playwright가 캡처했고 대표 PC·모바일·키보드 높이 캡처를 직접 열어 레이아웃을 확인했다. 캡처의 시간·타수는 자동 fill로 생성한 테스트 수치이며 사람의 타자 성적이 아니다.

- [PC 구절 입력](literature-desktop-reading.png)
- [PC 완료 요약](literature-desktop-result.png)
- [360px 작품·출처 선택](literature-mobile-source-360.png)
- [360px 입력·출처](literature-mobile-reading-360.png)
- [360px 완료](literature-mobile-result-360.png)
- [390px 작품·출처 선택](literature-mobile-source-390.png)
- [390px 입력·출처](literature-mobile-reading-390.png)
- [390px 완료](literature-mobile-result-390.png)
- [360px 키보드 높이 축소 시뮬레이션](literature-mobile-keyboard-height-360.png)
- [390px 키보드 높이 축소 시뮬레이션](literature-mobile-keyboard-height-390.png)

- [320px·어르신 기본 크기 × 추가 200%: 출처](literature-font-200-source-320.png)
- [320px·어르신 기본 크기 × 추가 200%: 입력](literature-font-200-reading-320.png)

320px에서 추가 200% 확대 및 화면 자모 키보드도 가로 넘침이 없었다. 글자 크기 버튼을 키보드 Enter로 조작하고, 현재 입력 유지·재방문 복원·기본값 초기화를 검증했다. 키보드 키 포함 48px 이상 터치 크기, 입력의 4px focus-visible 표시와 읽기/입력/상태/확정 맞음/활성 주 버튼의 텍스트 대비 4.5:1 이상을 측정했다. 전체 페이지의 WCAG 적합성 인증이나 실제 브라우저 기본 줌 조작으로 주장하지 않는다.

360/390px에서는 가로 넘침이 없었고 어르신 글자 크기의 입력·완료·출처 확인이 동작했다. 키보드 높이 축소는 420px 뷰포트 시뮬레이션이며 실제 OS 키보드 캡처가 아니다.

## 변경 파일

| 범위 | 파일 |
|---|---|
| 메뉴·라우팅·기록 초기화 | `src/App.tsx`, `src/screens/MenuScreen.tsx` |
| 연습 UI·모바일 헤더 | `src/screens/LiteratureScreen.tsx`, `src/components/PageShell.tsx`, `src/styles/app.css` |
| 작품·규칙·로컬 기록 | `src/literature/{types,catalog,fixtures,rules,storage,preferences}.ts`, `src/literature/works.json` |
| 단위 테스트 | `src/literature/{rules,storage,preferences,sources}.test.ts`, `src/screens/LiteratureScreen.test.tsx` |
| e2e·PWA | `e2e/literature.spec.ts`, `e2e/literature.mobile.spec.ts`, `e2e/pwa.spec.ts` |
| 데이터 검증·고지 생성 | `scripts/verify-literature.mjs`, `scripts/generate-notices.mjs` |
| 생성 출처 자료 | `public/licenses.html`, `public/data/literature.json`, `public/data/LITERATURE_LICENSE.txt` |
| 기획·증거 | `README.md`, `docs/14-classic-literature.md`, 이 보고서와 PNG 12개 및 원문 PDF 렌더 PNG 3개 |

## 남은 검증·차단 사항

1. 공식 원문 3편을 취득하고 2편의 TXT/PDF 대조·수록과 최종 테스트를 완료했다. 「산유화」는 입력 가능한 대체 판본 검증이 필요해 보류했다. 옛 철자를 임의 치환하지 않았다. 해당 작품 없이도 모드는 동작한다.
2. 한국어 OS IME·iPad Safari·Android Chrome의 실제 입력·브라우저 200% 줌·커서 수정·선택 교체·가상 키보드·회전·홈 화면 설치를 직접 보지 않았다. 합성 CompositionEvent와 Playwright fill은 OS IME를 검증하지 않는다.
3. 새 제작 빌드의 오프라인 작동과 프로필 보존은 확인했으나, 이전 공개 배포의 설치본에서 새 버전으로 실제 PWA 업데이트하는 과정은 미검증이다. 기존 저장소 키와 PWA 등록·업데이트 설정은 바꾸지 않았다.
4. 저장 차단·용량 초과·손상된 기록은 완료를 막지 않고 오류를 알린다. 웹에서 OS가 일반 insertText로 제공하는 클립보드/음성 입력을 전부 차단할 수는 없다. 속도 경쟁이나 인증 점수로 사용하지 않는다.
5. 원격 fetch와 로컬 서버/Chromium은 초기 sandbox 제한을 받아 승인된 escalation으로 실행했다. 자동 승인 거부는 없었다. 공식 원문 다운로드와 PDF 도구 설치도 기존 사용자 승인 범위에서 진행했다. 새 계약·추가 개인정보·결제는 없었다.

## 배포 전 재검증 — 2026-10-11

원격 `main`이 기준 커밋과 동일함을 확인했다. lint·TypeScript·unit 138개·e2e 38개·build·PWA 2개를 다시 실행해 통과했다. 실제 기기 검증 범위는 위 제한과 동일하다. 최종 원격 커밋·CI·운영 확인 결과는 PR 및 배포 보고로 남긴다.
