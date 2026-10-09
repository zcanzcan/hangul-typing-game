import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import './styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('앱을 표시할 요소를 찾을 수 없습니다.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <footer className="license-footer">
      <p>낱말 뜻풀이: 국립국어원 한국어기초사전 · CC BY-SA 2.0 KR</p>
      <a
        href={`${import.meta.env.BASE_URL}licenses.html`}
        target="_blank"
        rel="noopener noreferrer"
      >
        출처·라이선스 (새 창)
      </a>
    </footer>
  </StrictMode>,
)
