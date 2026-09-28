# 05. 데이터 구조

첫 버전은 서버 없이 동작한다. 낱말·유행어 기본 목록은 앱과 함께 배포되는 JSON 파일이고, 사용자 기록은 브라우저 저장소에 둔다.

| 데이터 | 위치 | 비고 |
|---|---|---|
| 낱말, 문장 | `public/data/words.json`, `public/data/sentences.json` | 앱과 함께 배포 |
| 기본 유행어 | `public/data/slang.json` | 저장소에서 업데이트 ([06. 유행어 운영](06-slang-operations.md)) |
| 사용자가 추가한 유행어 | IndexedDB `customSlang` | 기기 안에만 저장 |
| 프로필(닉네임, 연령대, 설정) | localStorage `profiles` | |
| 기록, 틀린 낱말 | IndexedDB `records`, `mistakes` | |
| 반 코드, 반 점수 | Supabase `typing_game_classes`, `typing_game_scores` | 반 점수판을 사용할 때만 서버 저장, 30일 뒤 접근 만료 |

## 낱말 (Word)

```ts
interface Word {
  id: string;            // "w-0001"
  text: string;          // "사과"
  meaning: string;       // "사과나무의 열매."
  example?: string;      // "빨간 사과를 먹었다." (직접 쓴 문장만. 국어원 예문 중 인용 예문은 공개 범위 밖)
  emoji?: string;        // "🍎" (초등학생 그림 카드용)
  level: 1 | 2 | 3 | 4;  // 1: 받침 없음, 2: 받침, 3: 쌍자음·겹받침, 4: 어려운 낱말
  tags?: string[];       // ["과일", "음식"]
  audience: ("kid" | "adult" | "senior")[];
  source?: string;       // 뜻 출처 (예: "한국어기초사전"). 국어원 뜻풀이를 쓰면 필수, 파일은 CC BY-SA 2.0 KR
}
```

## 문장 (Sentence)

```ts
interface Sentence {
  id: string;
  text: string;          // "가는 말이 고와야 오는 말이 곱다."
  kind: "short" | "long" | "proverb" | "spelling";
  meaning?: string;      // 속담·사자성어 뜻
  wrongForm?: string;    // 맞춤법 고치기용 틀린 문장
  audience: ("kid" | "adult" | "senior")[];
}
```

## 유행어 (Slang)

```ts
interface Slang {
  id: string;            // "s-2026-0001"
  text: string;          // 유행어
  meaning: string;       // 뜻 (표준어로 풀이)
  example?: string;      // 예문
  standardForm?: string; // 비슷한 표준어 표현
  addedAt: string;       // 등록일 "2026-09-28"
  popularFrom?: string;  // 유행 시작 시기 "2026-07"
  source?: string;       // 출처 (기사, 방송 등 URL)
  status: "active" | "archived"; // archived = 옛 유행어
  kidSafe: boolean;      // 학생용 검수 통과 여부
  origin: "official" | "custom"; // 기본 목록 / 사용자 추가
}
```

`slang.json` 파일 최상위에는 버전 정보를 둔다. 앱은 `version`이 바뀌었을 때만 새로 받는다.

```json
{
  "version": "2026-09-28",
  "items": [ /* Slang[] */ ]
}
```

## 프로필 (Profile)

```ts
interface Profile {
  id: string;
  nickname: string;      // 실명 대신 닉네임만
  ageGroup: "kid" | "adult" | "senior";
  settings: {
    fontSize: "normal" | "large" | "xlarge";
    timeLimit: boolean;
    speech: boolean;     // 소리 읽어주기
    sfx: boolean;        // 효과음
    slangMode: boolean;
    keyboard: "app" | "device"; // 화면 키보드 종류
  };
  createdAt: string;
}
```

## 기록 (Record)

```ts
interface Record {
  id: string;
  profileId: string;
  mode: "position" | "word" | "sentence" | "minigame" | "slang";
  stage: number;
  game?: "wordRain" | "wordChain" | "tower" | "slangQuiz"; // mode가 "minigame"일 때 어느 게임인지 (12, 13번 문서)
  pack?: "standard" | "slang" | "mixed"; // 미니게임 꾸러미. 최고 기록을 게임 × 꾸러미별로 나눔
  cpm: number;           // 타수
  accuracy: number;      // 0~100
  score: number;
  durationSec: number;
  isBest: boolean;
  playedAt: string;
}
```

## 틀린 낱말 (Mistake)

```ts
interface Mistake {
  profileId: string;
  itemId: string;        // Word/Sentence/Slang id
  count: number;         // 틀린 횟수
  lastWrongAt: string;
  mastered: boolean;     // 복습에서 3번 연속 맞히면 true
}
```

## 반 점수판

반 점수판은 반 코드가 있는 사용자끼리만 공유한다. 서버에는 무작위 반 코드, 닉네임,
점수, 모드, 단계, 기록 시각만 저장한다. 실명, 연락처, 로그인 계정, 기기 식별자는
수집하지 않는다.

- `typing_game_classes`: 8자리 반 코드, 생성 시각, 30일 접근 만료 시각
- `typing_game_scores`: 반, 닉네임, 점수, 모드, 단계, 기록 시각
- 점수 수정 권한용 임의 토큰은 브라우저에만 보관하고 서버에는 SHA-256 해시만 저장
- RLS가 요청의 반 코드를 확인해 다른 반의 조회를 막음
- 점수 수정과 삭제는 해당 기록의 임의 토큰을 가진 브라우저만 허용

SQL 원본은
[`supabase/migrations/20260928161038_create_typing_game_class_scoreboard.sql`](../supabase/migrations/20260928161038_create_typing_game_class_scoreboard.sql)에 있다.

예시 데이터: [`data/samples/words.sample.json`](../data/samples/words.sample.json), [`data/samples/slang.sample.json`](../data/samples/slang.sample.json)
