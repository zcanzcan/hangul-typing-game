import { assemble, disassembleCompleteCharacter, getChoseong } from 'es-hangul'

import type { AgeGroup, Word } from '../../data/types'

export const WORD_CHAIN_MAX_FAILURES = 3
export const WORD_CHAIN_HINTS = 3

export type WordChainValidationCode =
  | 'ok'
  | 'too-short'
  | 'not-in-list'
  | 'already-used'
  | 'wrong-start'
  | 'dead-end'

export interface WordChainValidation {
  ok: boolean
  code: WordChainValidationCode
  word?: Word
  expectedStarts?: string[]
}

const NIEUN_TO_IEUNG = new Set(['ㅕ', 'ㅛ', 'ㅠ', 'ㅣ'])
const RIEUL_TO_IEUNG = new Set(['ㅑ', 'ㅕ', 'ㅖ', 'ㅛ', 'ㅠ', 'ㅣ'])
const RIEUL_TO_NIEUN = new Set(['ㅏ', 'ㅐ', 'ㅗ', 'ㅚ', 'ㅜ', 'ㅡ'])

function replaceChoseong(character: string, choseong: string) {
  const parts = disassembleCompleteCharacter(character)

  if (!parts) {
    return character
  }

  return assemble([choseong, parts.jungseong, parts.jongseong])
}

export function getAllowedStartCharacters(
  previousWord: string,
  applyInitialSoundRule = true,
) {
  const lastCharacter = Array.from(previousWord.trim()).at(-1)

  if (!lastCharacter) {
    return []
  }

  const allowed = new Set([lastCharacter])
  const parts = disassembleCompleteCharacter(lastCharacter)

  if (!applyInitialSoundRule || !parts) {
    return [...allowed]
  }

  if (parts.choseong === 'ㄴ' && NIEUN_TO_IEUNG.has(parts.jungseong)) {
    allowed.add(replaceChoseong(lastCharacter, 'ㅇ'))
  }

  if (parts.choseong === 'ㄹ' && RIEUL_TO_IEUNG.has(parts.jungseong)) {
    allowed.add(replaceChoseong(lastCharacter, 'ㅇ'))
  }

  if (parts.choseong === 'ㄹ' && RIEUL_TO_NIEUN.has(parts.jungseong)) {
    allowed.add(replaceChoseong(lastCharacter, 'ㄴ'))
  }

  return [...allowed]
}

export function getEligibleChainWords(
  words: readonly Word[],
  ageGroup: AgeGroup,
) {
  return words.filter(
    ({ text, audience }) =>
      audience.includes(ageGroup) &&
      Array.from(text.trim()).length >= 2 &&
      !/\s/u.test(text),
  )
}

export function getChainCandidates({
  previousWord,
  words,
  usedWordIds,
  applyInitialSoundRule = true,
}: {
  previousWord: string
  words: readonly Word[]
  usedWordIds: ReadonlySet<string>
  applyInitialSoundRule?: boolean
}) {
  const allowedStarts = getAllowedStartCharacters(
    previousWord,
    applyInitialSoundRule,
  )

  return words.filter(
    ({ id, text }) =>
      !usedWordIds.has(id) &&
      allowedStarts.some((character) => text.startsWith(character)),
  )
}

function hasFollowUp(
  candidate: Word,
  words: readonly Word[],
  usedWordIds: ReadonlySet<string>,
  applyInitialSoundRule: boolean,
) {
  const usedWithCandidate = new Set(usedWordIds)
  usedWithCandidate.add(candidate.id)
  return (
    getChainCandidates({
      previousWord: candidate.text,
      words,
      usedWordIds: usedWithCandidate,
      applyInitialSoundRule,
    }).length > 0
  )
}

export function validateChainWord({
  input,
  previousWord,
  words,
  usedWordIds,
  ageGroup,
  applyInitialSoundRule = true,
}: {
  input: string
  previousWord: string
  words: readonly Word[]
  usedWordIds: ReadonlySet<string>
  ageGroup: AgeGroup
  applyInitialSoundRule?: boolean
}): WordChainValidation {
  const normalized = input.trim()

  if (Array.from(normalized).length < 2) {
    return { ok: false, code: 'too-short' }
  }

  const word = words.find(({ text }) => text === normalized)

  if (!word) {
    return { ok: false, code: 'not-in-list' }
  }

  if (usedWordIds.has(word.id)) {
    return { ok: false, code: 'already-used', word }
  }

  const expectedStarts = getAllowedStartCharacters(
    previousWord,
    applyInitialSoundRule,
  )

  if (!expectedStarts.some((character) => normalized.startsWith(character))) {
    return { ok: false, code: 'wrong-start', word, expectedStarts }
  }

  if (
    ageGroup !== 'adult' &&
    !hasFollowUp(word, words, usedWordIds, applyInitialSoundRule)
  ) {
    return { ok: false, code: 'dead-end', word }
  }

  return { ok: true, code: 'ok', word }
}

export function applyChainFailure(failures: number) {
  const nextFailures = Math.min(WORD_CHAIN_MAX_FAILURES, failures + 1)
  return {
    failures: nextFailures,
    eliminated: nextFailures >= WORD_CHAIN_MAX_FAILURES,
  }
}

export function getChainWordScore(text: string, quick: boolean) {
  return Array.from(text).length * 10 + (quick ? 10 : 0)
}

export function getChainHint(words: readonly Word[]) {
  const first = words[0]
  return first ? getChoseong(first.text).slice(0, 2) : ''
}

export function pickComputerWord(words: readonly Word[]) {
  return [...words].sort(
    (a, b) => a.level - b.level || a.text.localeCompare(b.text, 'ko'),
  )[0]
}
