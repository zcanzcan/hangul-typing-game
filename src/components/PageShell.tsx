import type { ReactNode } from 'react'

interface PageShellProps {
  title: string
  eyebrow?: string
  onBack?: () => void
  children: ReactNode
  theme?: 'candy' | 'pixel'
}

export function PageShell({
  title,
  eyebrow,
  onBack,
  children,
  theme = 'candy',
}: PageShellProps) {
  return (
    <main className="page-shell" data-theme={theme}>
      <header className="page-header">
        {onBack ? (
          <button
            className="button button--ghost"
            type="button"
            onClick={onBack}
          >
            ← 메인으로
          </button>
        ) : (
          <span />
        )}
        <div className="page-heading">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
        </div>
        <span />
      </header>
      {children}
    </main>
  )
}
