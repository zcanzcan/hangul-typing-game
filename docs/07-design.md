# 07. 디자인 가이드

핀터레스트에서 찾은 세 가지 방향 중 **A(파스텔 캔디)를 기본**으로, 유행어 모드·카드게임·점수판에는 **C(레트로 픽셀)를 스킨**으로 입힌다.
원본 무드보드: [Miro 7 디자인 무드보드](https://miro.com/app/board/uXjVHh1L6eg=/?moveToWidget=3458764685178454349)

## A. 파스텔 캔디 (기본)

듀오링고처럼 납작한 일러스트, 둥근 버튼, 캐릭터 칭찬. 초등학생 첫인상에 가장 잘 맞는다.

| 역할 | 이름 | 색 |
|---|---|---|
| 배경 | 크림 | `#FFF8EC` |
| 주 색 (버튼, 강조) | 하늘 | `#6EC1FF` |
| 보조 (별, 칭찬) | 해님 | `#FFD84D` |
| 정답, 성공 | 민트 | `#7BE0B5` |
| 오답, 경고 | 코랄 | `#FF8A80` |

- 글꼴: 제목 **배민 주아**, 본문 **Pretendard**
- 모서리: 버튼 16px, 카드 24px
- 참고: [Kids Educational Game Interface](https://www.pinterest.com/ideas/kids-educational-game-interface/924149752088/) · [Duolingo style](https://kr.pinterest.com/hyunjinkim0527/duolingo-style/) · [Kids App Design](https://www.pinterest.com/ideas/kids-app-design/913124999511/)

## C. 레트로 픽셀 아케이드 (유행어·점수판 스킨)

| 역할 | 이름 | 색 |
|---|---|---|
| 배경 | 밤하늘 | `#1B1F3B` |
| 강조 | 네온 핑크 | `#FF5DA2` |
| 보조 | 시안 | `#3DE0FF` |
| 점수, 코인 | 코인 노랑 | `#FFE45E` |
| 글자 | 흰색 | `#FFFFFF` |

- 글꼴: **갈무리(Galmuri)** 또는 **Neo둥근모** (둘 다 SIL OFL 1.1 무료 한글 픽셀 글꼴)
- 참고: [Retro Game Text](https://www.pinterest.com/ideas/retro-game-text/911519040869/) · [Pixel UI ideas](https://www.pinterest.com/laceyahawkins/pixel-ui/) · [Typppe 타자 게임](https://www.pinterest.com/pin/typppe-a-fun-little-typing-game--506584658088622873/)

## B. 말랑 키보드 (참고용, 화면 키보드에 부분 적용 가능)

연회색 `#EEF0F7`, 라벤더 `#B9A7FF`, 피치 `#FFC7B2`, 민트 `#A8E6CF`, 잉크 `#3A3F5C`.
키캡이 살짝 튀어나온 입체감(소프트 UI)은 화면 키보드에만 빌려 써도 좋다.

## 공통 규칙 (접근성)

- 어르신 모드 글자 **24px 이상**, 버튼 **최소 48×48px** (WCAG 2.2 기준 AA 24px·AAA 44px보다 넉넉한 이 앱의 자체 기준)
- 글자와 배경 명암 대비 **4.5:1 이상** (WCAG AA)
- **색만으로 정답/오답을 구분하지 않는다.** ✓ / ✗ 아이콘과 소리를 함께 쓴다.
- 애니메이션은 `prefers-reduced-motion` 설정을 따른다.
- 모든 버튼에 글자 라벨을 붙인다 (아이콘만 있는 버튼 금지).

## 구현 팁

- 색은 CSS 변수(`--color-bg`, `--color-primary` …)로 두고, 스킨은 `data-theme="candy" | "pixel"`로 바꾼다.
- 연령대별 글자 크기는 `--font-scale` 변수 하나로 조절한다.
- 글꼴 라이선스: Pretendard·갈무리는 SIL OFL 1.1, 배민 주아는 웹·앱 무료 사용 가능(폰트 파일 판매만 금지). Neo둥근모도 SIL OFL 1.1이다 ([검증 결과](10-verification.md)).
