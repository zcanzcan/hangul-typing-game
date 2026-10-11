import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { disassemble, assemble } from 'es-hangul'

import { PageShell } from '../components/PageShell'
import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import type { Profile } from '../data/types'
import { loadLiteratureWorks } from '../literature/catalog'
import {
  judgePassage,
  normalizeLiteratureInput,
  passageMetrics,
} from '../literature/rules'
import {
  readLiteratureRecords,
  saveLiteratureRecord,
} from '../literature/storage'
import type { LiteratureRecord, LiteratureWork } from '../literature/types'
import {
  FONT_STEPS,
  readLiteratureFont,
  saveLiteratureFont,
  type LiteratureFontScale,
} from '../literature/preferences'
import { appendJamo } from '../typing/layout'

function WorkSource({ work }: { work: LiteratureWork }) {
  return (
    <div className="literature-source">
      <p>
        <strong>분류</strong> {work.category} · <strong>작가</strong>{' '}
        {work.author} · <strong>판본</strong> {work.edition}
      </p>
      <p>
        <strong>출처</strong>{' '}
        {work.sourceUrl ? (
          <a href={work.sourceUrl} target="_blank" rel="noreferrer">
            {work.sourceName} (새 창)
          </a>
        ) : (
          work.sourceName
        )}
      </p>
      <p>
        <strong>이용조건</strong>{' '}
        {work.licenseUrl ? (
          <a href={work.licenseUrl} target="_blank" rel="noreferrer">
            {work.licenseName} (새 창)
          </a>
        ) : (
          work.licenseName
        )}{' '}
        · {work.usage}
      </p>
      <p>
        <strong>가공 안내</strong> {work.processing}
        {work.verifiedAt ? ` · 확인일 ${work.verifiedAt}` : ''}
      </p>
    </div>
  )
}

export function LiteratureScreen({
  profile,
  onBack,
  initialWorks,
}: {
  profile: Profile
  onBack: () => void
  initialWorks?: LiteratureWork[]
}) {
  const [works, setWorks] = useState<LiteratureWork[] | null>(
    initialWorks ?? null,
  )
  const [fontPreference, setFontPreference] = useState(readLiteratureFont)
  const [fontMessage, setFontMessage] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [selected, setSelected] = useState<LiteratureWork | null>(null)
  const [phase, setPhase] = useState<'choose' | 'read' | 'result'>('choose')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [composing, setComposing] = useState(false)
  const composition = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const startTime = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [message, setMessage] = useState('')
  const checks = useRef({ correct: 0, total: 0, count: 0, lastValue: '' })
  const [assessment, setAssessment] = useState({
    correct: 0,
    total: 0,
    count: 0,
  })
  const finished = useRef(false)
  const [result, setResult] = useState<LiteratureRecord | null>(null)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState(() =>
    readLiteratureRecords(profile.id),
  )

  useEffect(() => {
    if (initialWorks) return
    let cancelled = false
    void loadLiteratureWorks()
      .then((items) => {
        if (!cancelled) setWorks(items)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [initialWorks])

  useEffect(() => {
    if (phase !== 'read') return
    const timer = window.setInterval(() => {
      if (startTime.current !== null)
        setElapsed((performance.now() - startTime.current) / 1000)
    }, 500)
    const field = inputRef.current
    function preventTransfer(event: Event) {
      if (
        ['insertFromPaste', 'insertFromDrop'].includes(
          (event as InputEvent).inputType,
        )
      ) {
        event.preventDefault()
        setMessage('붙여넣기·끌어넣기 대신 직접 입력해 주세요.')
      }
    }
    field?.addEventListener('beforeinput', preventTransfer)
    field?.focus()
    return () => {
      window.clearInterval(timer)
      field?.removeEventListener('beforeinput', preventTransfer)
    }
  }, [phase, index])

  function changeFont(scale: LiteratureFontScale) {
    const stored = saveLiteratureFont(scale)
    setFontPreference({ scale, error: !stored })
    setFontMessage(
      stored
        ? `글자 크기 ${Math.round(scale * 100)}%를 저장했어요.`
        : '글자 크기를 이 화면에 적용했어요. 기기에 저장하지 못해 다음 방문에는 기본값으로 열릴 수 있어요.',
    )
  }

  function begin(work: LiteratureWork) {
    setSelected(work)
    setPhase('read')
    setIndex(0)
    setInput('')
    composition.current = false
    setComposing(false)
    startTime.current = null
    setElapsed(0)
    checks.current = { correct: 0, total: 0, count: 0, lastValue: '' }
    setAssessment({ correct: 0, total: 0, count: 0 })
    finished.current = false
    setResult(null)
    setMessage('')
  }

  function updateInput(value: string) {
    if (finished.current) return
    if (value && startTime.current === null)
      startTime.current = performance.now()
    setInput(value)
    setMessage('')
  }

  function chooseAgain() {
    composition.current = false
    setComposing(false)
    setPhase('choose')
    setInput('')
    setSelected(null)
    setMessage('')
    setHistory(readLiteratureRecords(profile.id))
  }

  function checkPassage() {
    if (!selected || composition.current || finished.current || !input) return
    const normalized = normalizeLiteratureInput(input)
    if (checks.current.lastValue === normalized) return
    checks.current.lastValue = normalized
    const judged = judgePassage(selected.passages[index], input, false)
    checks.current.correct += judged.correct
    checks.current.total += judged.total
    checks.current.count += 1
    setAssessment({
      correct: checks.current.correct,
      total: checks.current.total,
      count: checks.current.count,
    })
    if (!judged.complete) {
      setMessage(
        '아직 다른 글자가 있어요. 띄어쓰기와 문장부호까지 살펴보고 고쳐 주세요.',
      )
      inputRef.current?.focus()
      return
    }
    if (index < selected.passages.length - 1) {
      setIndex(index + 1)
      setInput('')
      checks.current.lastValue = ''
      setMessage('✓ 구절을 마쳤어요. 다음 구절도 천천히 읽어 보세요.')
      return
    }
    finished.current = true
    const durationSec =
      startTime.current === null
        ? 0
        : (performance.now() - startTime.current) / 1000
    const record: LiteratureRecord = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      workId: selected.id,
      workVersion: selected.version,
      title: selected.title,
      playedAt: new Date().toISOString(),
      durationSec,
      ...passageMetrics(
        selected.passages,
        durationSec,
        checks.current.correct,
        checks.current.total,
      ),
      completedCount: selected.passages.length,
      checks: checks.current.count,
    }
    setResult(record)
    setSaved(saveLiteratureRecord(record))
    setElapsed(durationSec)
    setPhase('result')
  }

  const target = selected?.passages[index] ?? ''
  const judgment = judgePassage(target, input, composing)
  const completedText = selected?.passages.slice(0, index) ?? []
  const completedCharacters = completedText.reduce(
    (sum, text) => sum + Array.from(normalizeLiteratureInput(text)).length,
    0,
  )
  const totalCharacters =
    selected?.passages.reduce(
      (sum, text) => sum + Array.from(normalizeLiteratureInput(text)).length,
      0,
    ) ?? 0
  const currentMetrics = passageMetrics(
    completedText,
    elapsed,
    assessment.correct,
    assessment.total,
  )
  const punctuation = Array.from(
    new Set(
      Array.from(target).filter(
        (char) => !/[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/u.test(char),
      ),
    ),
  )

  return (
    <PageShell
      className="literature-screen"
      style={
        { '--literature-font-scale': fontPreference.scale } as CSSProperties
      }
      title="고전문학 타자 연습"
      eyebrow="한 구절씩, 나의 속도로"
      onBack={onBack}
    >
      <div className="literature-layout">
        <section
          className="literature-card literature-font-controls"
          aria-label="문학 글자 크기 설정"
        >
          <h2>편하게 읽는 글자 크기</h2>
          <p>
            기본 글자 크기의 {Math.round(fontPreference.scale * 100)}% · 연령별
            글자 크기와 브라우저 확대도 함께 적용돼요.
          </p>
          <div className="button-row">
            <button
              className="button button--ghost"
              type="button"
              disabled={fontPreference.scale === 1}
              onClick={() =>
                changeFont(
                  FONT_STEPS[
                    Math.max(0, FONT_STEPS.indexOf(fontPreference.scale) - 1)
                  ],
                )
              }
              aria-label="문학 글자 크기 줄이기"
            >
              글자 줄이기
            </button>
            <button
              className="button button--primary"
              type="button"
              disabled={fontPreference.scale === 2}
              onClick={() =>
                changeFont(
                  FONT_STEPS[
                    Math.min(
                      FONT_STEPS.length - 1,
                      FONT_STEPS.indexOf(fontPreference.scale) + 1,
                    )
                  ],
                )
              }
              aria-label="문학 글자 크기 키우기"
            >
              글자 키우기
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => changeFont(1)}
              aria-label="문학 글자 크기 기본값으로 초기화"
            >
              기본 크기
            </button>
          </div>
          {fontPreference.error && !fontMessage ? (
            <p role="alert">
              글자 크기 설정을 읽지 못해 기본 크기로 열었어요. 이 화면에서 다시
              조절할 수 있어요.
            </p>
          ) : null}
          {fontMessage ? (
            <p role="status" className="literature-font-message">
              {fontMessage}
            </p>
          ) : null}
        </section>
        {phase === 'choose' ? (
          <>
            <section className="literature-card">
              <h2>읽고 싶은 작품을 골라요</h2>
              <p>
                시간 제한도 순위 경쟁도 없어요. 출처를 확인하고, 글을 읽으며
                따라 적어 보세요.
              </p>
              {works?.some((work) => work.verification === 'fixture') ? (
                <p className="literature-notice" role="note">
                  개발 미리보기: 아래는 직접 만든 내부 테스트 문장입니다. 실제
                  고전문학이 아니며 공개 빌드에는 포함되지 않습니다.
                </p>
              ) : null}
              {loadError ? (
                <p role="alert">
                  작품 목록을 불러오지 못했어요. 메인으로 돌아갔다 다시 열어
                  주세요.
                </p>
              ) : !works ? (
                <p role="status">작품 목록을 준비하고 있어요…</p>
              ) : works.length === 0 ? (
                <p role="status">
                  출처와 이용조건이 검증된 작품을 준비하고 있어요.
                </p>
              ) : null}
              <div className="literature-work-list">
                {works?.map((work) => (
                  <button
                    className={`literature-work ${selected?.id === work.id ? 'is-selected' : ''}`}
                    key={work.id}
                    type="button"
                    aria-pressed={selected?.id === work.id}
                    onClick={() => setSelected(work)}
                  >
                    <strong>{work.title}</strong>
                    <span>
                      {work.category} · {work.author} · {work.passages.length}
                      구절
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {selected ? (
              <section
                className="literature-card"
                aria-label="작품 출처와 이용조건"
              >
                <h2>{selected.title}</h2>
                <p>{selected.description}</p>
                <WorkSource work={selected} />
                <p>
                  입력은 띄어쓰기·문장부호까지 그대로 적어요. 줄바꿈은 공백 한
                  칸으로 처리하고, 붙여넣기는 사용하지 않아요. 수정한 뒤 버튼을
                  눌러 구절을 확인해요.
                </p>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => begin(selected)}
                >
                  이 작품 읽으며 연습하기
                </button>
              </section>
            ) : null}
            <section className="literature-card">
              <h2>나의 최근 문학 연습</h2>
              <p>
                이 브라우저에만 최근 100회가 저장돼요. 설정의 기록 초기화로 지울
                수 있어요.
              </p>
              {history.error ? (
                <p role="alert">
                  기록을 읽지 못했어요. 저장소가 차단됐거나 기록 형식에 문제가
                  있어요. 연습은 계속할 수 있어요.
                </p>
              ) : history.items.length === 0 ? (
                <p>아직 완료한 문학 연습이 없어요.</p>
              ) : (
                <ul className="literature-history">
                  {history.items.slice(0, 10).map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <span>
                        {new Date(item.playedAt).toLocaleDateString('ko-KR')} ·
                        정확도 {item.accuracy.toFixed(1)}% ·{' '}
                        {item.completedCount}구절 ·{' '}
                        {Math.round(item.durationSec)}초
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        {phase === 'read' && selected ? (
          <>
            <section className="literature-card">
              <div className="literature-heading">
                <div>
                  <p className="eyebrow">{selected.author}</p>
                  <h2>{selected.title}</h2>
                </div>
                <span>
                  {index + 1} / {selected.passages.length}구절
                </span>
              </div>
              {selected.verification === 'fixture' ? (
                <p className="literature-notice">
                  직접 만든 내부 테스트 문장 · 실제 고전문학 아님
                </p>
              ) : null}
              <label className="literature-progress">
                진행률{' '}
                {totalCharacters
                  ? Math.floor(
                      ((completedCharacters + judgment.correct) /
                        totalCharacters) *
                        100,
                    )
                  : 0}
                %
                <progress
                  max={totalCharacters || 1}
                  value={completedCharacters + judgment.correct}
                />
              </label>
              <div className="literature-stats" aria-label="연습 현황">
                <span>
                  걸린 시간 <strong>{Math.floor(elapsed)}초</strong>
                </span>
                <span>
                  확인 정확도{' '}
                  <strong>
                    {assessment.count
                      ? `${currentMetrics.accuracy.toFixed(1)}%`
                      : '—'}
                  </strong>
                </span>
                <span>
                  완료한 구절 타수{' '}
                  <strong>{Math.round(currentMetrics.cpm)}타/분</strong>
                </span>
              </div>
              <p className="literature-help">
                첫 입력부터 읽고 쉬는 시간도 포함해요. 타수는 참고용이에요.
                빠르게 칠 필요 없어요.
              </p>
              <blockquote
                className="literature-passage"
                aria-label="따라 읽을 구절"
              >
                {target}
              </blockquote>
              <div
                className="literature-feedback"
                aria-label="입력 글자별 확인"
              >
                {judgment.judgments.map((char) => (
                  <span
                    key={char.index}
                    className={`literature-character is-${char.status}`}
                    aria-label={`${char.actual === ' ' ? '공백' : char.actual} ${char.status === 'correct' ? '맞음' : char.status === 'incorrect' ? '다름' : '조합 중'}`}
                  >
                    {char.status === 'correct'
                      ? '✓'
                      : char.status === 'incorrect'
                        ? '✗'
                        : '…'}
                    {char.actual === ' ' ? '␣' : char.actual}
                  </span>
                ))}
              </div>
              <label
                className="literature-input-label"
                htmlFor="literature-input"
              >
                구절 따라 입력
              </label>
              <textarea
                key={index}
                id="literature-input"
                ref={inputRef}
                className="literature-input"
                value={input}
                rows={3}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby="literature-input-help"
                onChange={(event) => {
                  if (
                    ['insertFromPaste', 'insertFromDrop'].includes(
                      (event.nativeEvent as InputEvent).inputType,
                    )
                  ) {
                    event.currentTarget.value = input
                    setMessage('붙여넣기·끌어넣기 대신 직접 입력해 주세요.')
                    return
                  }
                  updateInput(event.currentTarget.value)
                }}
                onCompositionStart={() => {
                  composition.current = true
                  setComposing(true)
                }}
                onCompositionEnd={(event) => {
                  composition.current = false
                  setComposing(false)
                  updateInput(event.currentTarget.value)
                }}
                onPaste={(event) => {
                  event.preventDefault()
                  setMessage('붙여넣기 대신 직접 입력해 주세요.')
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  setMessage('끌어넣기 대신 직접 입력해 주세요.')
                }}
              />
              <p id="literature-input-help" className="literature-help">
                띄어쓰기와 문장부호도 그대로 적어요. Enter는 공백 한 칸으로
                처리해요. 언제든 지우거나 고칠 수 있어요.
              </p>
              <p role="status" className="literature-status">
                {composing
                  ? '한글 조합 중이에요. 조합이 끝난 뒤 확인해 주세요.'
                  : message || '다 적었으면 아래 버튼을 눌러 확인해 주세요.'}
              </p>
              <div className="button-row">
                <button
                  className="button button--primary"
                  type="button"
                  disabled={composing || !input}
                  onClick={checkPassage}
                >
                  {index === selected.passages.length - 1
                    ? '연습 완료 확인'
                    : '확인하고 다음 구절'}
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => begin(selected)}
                >
                  처음부터 다시
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={chooseAgain}
                >
                  작품 바꾸기
                </button>
              </div>
            </section>
            {profile.settings.keyboard === 'app' ? (
              <div className="literature-card">
                <OnScreenKeyboard
                  target={target}
                  input={input}
                  onJamo={(jamo) => {
                    if (!composition.current)
                      updateInput(appendJamo(input, jamo))
                  }}
                  onBackspace={() => {
                    if (!composition.current)
                      updateInput(
                        assemble(Array.from(disassemble(input)).slice(0, -1)),
                      )
                  }}
                />
                <div className="button-row" aria-label="문장부호 키">
                  {punctuation.map((char) => (
                    <button
                      className="button button--ghost"
                      type="button"
                      key={char}
                      onClick={() => {
                        if (!composition.current) updateInput(input + char)
                      }}
                    >
                      {char} 입력
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <details className="literature-card">
              <summary>작품 출처·이용조건 다시 보기</summary>
              <WorkSource work={selected} />
            </details>
          </>
        ) : null}

        {phase === 'result' && result && selected ? (
          <section className="literature-card literature-result">
            <p className="eyebrow">✓ 마지막 구절까지 읽었어요</p>
            <h2>문학 연습을 마쳤어요</h2>
            <p>
              {selected.title} · {selected.author}
            </p>
            <div className="literature-stats">
              <span>
                완료한 구절 <strong>{result.completedCount}구절</strong>
              </span>
              <span>
                확인 정확도 <strong>{result.accuracy.toFixed(1)}%</strong>
              </span>
              <span>
                걸린 시간 <strong>{Math.round(result.durationSec)}초</strong>
              </span>
              <span>
                참고 타수 <strong>{Math.round(result.cpm)}타/분</strong>
              </span>
            </div>
            <p>
              {result.keystrokes}자소 · {result.checks}회 확인 · 진행률 100%
            </p>
            <p>
              확인 정확도는 버튼을 눌렀을 때 맞은 글자 비율이에요. 틀린 구절을
              확인한 뒤 수정했다면 그 확인도 포함돼요.
            </p>
            <p role={saved ? 'status' : 'alert'}>
              {saved
                ? '이 브라우저에 기록을 저장했어요.'
                : '연습은 완료했지만 기록을 저장하지 못했어요. 저장 공간이나 브라우저 설정을 확인해 주세요.'}
            </p>
            <div className="button-row">
              {!saved ? (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setSaved(saveLiteratureRecord(result))}
                >
                  기록 저장 다시 시도
                </button>
              ) : null}
              <button
                className="button button--primary"
                type="button"
                onClick={() => begin(selected)}
              >
                같은 작품 다시하기
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={chooseAgain}
              >
                다른 작품 고르기
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={onBack}
              >
                메인으로 돌아가기
              </button>
            </div>
            <details>
              <summary>출처와 이용조건</summary>
              <WorkSource work={selected} />
            </details>
          </section>
        ) : null}
      </div>
    </PageShell>
  )
}
