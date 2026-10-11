import type { LiteratureWork } from './types'

// 직접 만든 기능 검증 문장입니다. 실제 작품으로 소개하거나 배포하지 않습니다.
export const LITERATURE_FIXTURES: LiteratureWork[] = [
  {
    id: 'fixture-reading',
    version: 'test-1',
    title: '내부 테스트 문장 · 천천히 읽기',
    author: '개발용 직접 작성',
    category: '개발 테스트',
    description:
      '실제 고전문학이 아닙니다. 입력 기능을 확인하는 내부 문장입니다.',
    edition: '내부 테스트 fixture',
    sourceName: '프로젝트 개발용 문장',
    sourceUrl: '',
    licenseName: '배포 작품 아님',
    licenseUrl: '',
    usage: '로컬 개발·테스트 전용. 고전문학으로 표시하지 않습니다.',
    processing: '직접 작성. 원문·판본을 모사하지 않았습니다.',
    verifiedAt: '',
    verification: 'fixture',
    passages: ['책을 펴고, 한 줄을 읽어요.', '천천히 적어도 괜찮아요.'],
  },
  {
    id: 'fixture-punctuation',
    version: 'test-1',
    title: '내부 테스트 문장 · 입력 확인',
    author: '개발용 직접 작성',
    category: '개발 테스트',
    description:
      '겹받침·쌍자음·문장부호 입력을 확인합니다. 실제 고전문학이 아닙니다.',
    edition: '내부 테스트 fixture',
    sourceName: '프로젝트 개발용 문장',
    sourceUrl: '',
    licenseName: '배포 작품 아님',
    licenseUrl: '',
    usage: '로컬 개발·테스트 전용. 고전문학으로 표시하지 않습니다.',
    processing: '직접 작성. 원문·판본을 모사하지 않았습니다.',
    verifiedAt: '',
    verification: 'fixture',
    passages: ['“꽃과 닭을 봐요.”', '사과를 읽고, 꼭꼭 적어요!'],
  },
]
