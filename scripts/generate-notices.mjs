import { readVerifiedLiterature } from './verify-literature.mjs'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

// 설치된 패키지의 원문 고지를 배포 파일에 보존합니다. 새 패키지를 내려받지 않습니다.
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const lock = readJson('package-lock.json')
const notices = []
for (const [directory, metadata] of Object.entries(lock.packages)) {
  if (
    !directory ||
    (metadata.dev && !/node_modules\/workbox-/.test(directory))
  ) {
    continue
  }
  const pkg = readJson(`${directory}/package.json`)
  const files = readdirSync(directory)
    .filter((name) => /^(licen[cs]e|notice|copying)(\.|$)/i.test(name))
    .sort()
  if (!files.some((name) => /^licen[cs]e/i.test(name))) {
    throw new Error(`라이선스 원문이 없는 패키지: ${pkg.name}`)
  }
  notices.push(
    `${pkg.name}@${pkg.version} (${pkg.license ?? metadata.license})\n` +
      files
        .map(
          (name) =>
            `--- ${name} ---\n${readFileSync(`${directory}/${name}`, 'utf8')}`,
        )
        .join('\n'),
  )
}
writeFileSync(
  'public/THIRD_PARTY_NOTICES.txt',
  '타사 소프트웨어 고지\n\n' +
    '런타임 의존성과 PWA의 Workbox 관련 패키지 고지를 포함합니다.\n' +
    'Workbox 관련 패키지는 개발 시 쓰는 항목까지 보수적으로 포함합니다.\n' +
    '패키지별 저작권·이용허락·보증 부인 원문은 아래와 같습니다.\n\n' +
    notices.join(
      '\n\n============================================================\n\n',
    ),
)
writeFileSync('public/CODE_LICENSE.txt', readFileSync('LICENSE', 'utf8'))

const words = readJson('public/data/words.json')
const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  )
const literature = readVerifiedLiterature()
const literatureSources = literature.length
  ? literature
      .map(
        (work) =>
          `<article><h3>${escapeHtml(work.title)}</h3><p>분류: ${escapeHtml(work.category)} · 작가: ${escapeHtml(work.author)} · 판본: ${escapeHtml(work.edition)}</p><p>출처: <a href="${escapeHtml(work.sourceUrl)}">${escapeHtml(work.sourceName)}</a> · 이용조건: <a href="${escapeHtml(work.licenseUrl)}">${escapeHtml(work.licenseName)}</a></p><p>${escapeHtml(work.usage)}</p><p>가공: ${escapeHtml(work.processing)} · 원문 대조일: ${escapeHtml(work.verifiedAt)} · 데이터 버전: ${escapeHtml(work.version)}</p></article>`,
      )
      .join('\n')
  : '<p>현재 출처와 이용조건을 검증해 등록한 작품은 없습니다. 개발 전용 직접 작성 테스트 문장은 고전문학이 아니며 공개 빌드에 포함하지 않습니다.</p>'
writeFileSync(
  'public/data/literature.json',
  JSON.stringify(literature, null, 2) + '\n',
)
writeFileSync(
  'public/data/LITERATURE_LICENSE.txt',
  '문학 작품 데이터 이용 안내\n\n프로그램 코드의 MIT와 작품별 이용조건은 별개입니다.\n' +
    (literature.length
      ? literature
          .map(
            (work) =>
              `${work.title} / ${work.author}\n분류: ${work.category} / 판본: ${work.edition}\n출처: ${work.sourceName} (${work.sourceUrl})\n이용조건: ${work.licenseName} (${work.licenseUrl})\n${work.usage}\n가공: ${work.processing}\n확인일: ${work.verifiedAt} / 버전: ${work.version}\n`,
          )
          .join('\n')
      : '등록 작품 없음. 개발용 테스트 문장은 고전문학이 아니며 공개 빌드에 포함하지 않습니다.\n'),
)
const rows = words.items
  .map(({ text, meaning, provenance }) => {
    if (!provenance || provenance.license !== 'CC-BY-SA-2.0-KR') {
      throw new Error(`사전 출처가 없는 낱말: ${text}`)
    }
    return `<tr><th scope="row"><a href="${escapeHtml(provenance.url)}">${escapeHtml(text)}</a></th><td>${escapeHtml(meaning)}</td><td>${escapeHtml(provenance.entryId)} / ${provenance.sense}</td></tr>`
  })
  .join('\n')
writeFileSync(
  'public/licenses.html',
  `<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>출처·라이선스 | 한글 타자 놀이터</title>
<style>
body{font-family:system-ui,sans-serif;line-height:1.65;color:#24304a;background:#fff8ec;max-width:64rem;margin:auto;padding:1.5rem}a{color:#145b8b;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #145b8b}h1{font-size:1.8rem}h2{font-size:1.4rem}th,td{padding:.7rem;text-align:left;vertical-align:top;border-bottom:1px solid #d8dde8}table{border-collapse:collapse;width:100%}th{white-space:nowrap}.table-scroll{overflow-x:auto}a{display:inline-block;min-height:48px;align-content:center}
</style>
<main>
<h1>출처·라이선스</h1>
<p><a href="./">한글 타자 놀이터 열기</a> · 이 창을 닫으면 진행 중이던 게임으로 돌아갈 수 있어요.</p>
<h2>낱말 뜻풀이</h2>
<p>저작자: <strong>국립국어원</strong> · 원 자료: <a href="https://krdict.korean.go.kr">한국어기초사전</a></p>
<p>아래 ${words.items.length}개 표제어의 의미를 ${escapeHtml(words.items[0].provenance.verifiedAt)}에 공식 공개 원문에서 확인해 선별했습니다. 뜻풀이 문장은 원문을 유지하고 웹 표시의 공백을 정리했습니다. 한 항목의 의미 번호를 선택하고 게임용 ID, 난도·대상·태그와 이모지를 결합했습니다. 이 분류는 국립국어원의 교육 등급이나 추천이 아닙니다.</p>
<p>사전 뜻풀이와 그 가공 데이터는 <a href="https://creativecommons.org/licenses/by-sa/2.0/kr/">CC BY-SA 2.0 KR (저작자표시-동일조건변경허락 2.0 대한민국)</a>로 이용됩니다. 재배포 시 국립국어원·한국어기초사전 출처와 라이선스, 가공 여부를 유지하고 변경한 사전 자료에는 동일조건을 적용하세요. 원 자료는 보증 없이 제공됩니다.</p>
<p><a href="https://krdict.korean.go.kr/kor/kboardPolicy/copyRightTermsInfo">공식 저작권 정책</a> · <a href="https://creativecommons.org/licenses/by-sa/2.0/kr/legalcode.ko">이용허락규약 전문</a> · <a href="data/words.json">항목별 원문 링크·확인일을 담은 정적 JSON</a> · <a href="data/DATA_LICENSE.txt">데이터 이용 안내</a></p>
<p>사전 예문, 이미지, 발음 음원 등 멀티미디어는 포함하지 않았습니다. 과거 데이터의 뜻풀이·예문 출처가 불명확하여 뜻풀이는 교체하고 예문은 제거했습니다. 이 앱은 국립국어원의 공식 서비스나 인증 제품이 아닙니다.</p>
<h2>고전문학 타자 연습의 작품 데이터</h2>
<p>프로그램 코드의 MIT 라이선스와 작품별 이용조건은 구분합니다. 출처·판본·이용조건과 실제 원문 대조를 완료한 자료만 등록합니다. 고전·근대문학의 시대 구분은 작품 안내에서 밝힙니다.</p>
${literatureSources}
<p><a href="data/literature.json">문학 작품·구절·항목별 출처</a> · <a href="data/LITERATURE_LICENSE.txt">문학 데이터 이용 안내</a></p>
<h2>그 밖의 콘텐츠와 소프트웨어</h2>
<p>코드와 프로젝트 문서는 <a href="CODE_LICENSE.txt">MIT 라이선스</a>입니다. 사전 데이터에는 별도의 위 라이선스가 적용됩니다. 별도 유행어·문장·맞춤법·속담 콘텐츠는 프로젝트에 포함된 기존 학습 자료이며 공식 사전에서 검증된 데이터로 표시하지 않습니다. 그 자료의 원작성 경위와 교육적 적합성은 별도 검토가 필요합니다.</p>
<p>효과음은 앱에서 합성하고 PNG 아이콘은 생성 스크립트로 만듭니다. 이모지는 기기의 표시를 사용하며 외부 폰트 파일은 동봉하지 않습니다. 한국어 읽어주기는 기기·브라우저의 음성을 사용합니다.</p>
<p>React, es-hangul, Supabase 클라이언트, idb-keyval, Workbox 등 배포에 포함되는 타사 소프트웨어의 원문은 <a href="THIRD_PARTY_NOTICES.txt">타사 소프트웨어 고지</a>를 확인하세요.</p>
<h2>항목별 출처</h2>
<div class="table-scroll" role="region" aria-label="낱말 출처 표" tabindex="0"><table><caption>한국어기초사전 표제어 ${words.items.length}개 (낱말 링크는 원문)</caption><thead><tr><th scope="col">낱말</th><th scope="col">뜻풀이</th><th scope="col">표제어 ID / 의미 번호</th></tr></thead><tbody>${rows}</tbody></table></div>
</main>
</html>
`,
)
console.log(
  `출처 페이지 ${words.items.length}개 항목, 타사 고지 ${notices.length}개 패키지 생성`,
)
