import type { CSSProperties, ReactNode } from 'react'

interface PageShellProps {
  title: string
  eyebrow?: string
  onBack?: () => void
  children: ReactNode
  theme?: 'candy' | 'pixel'
  className?: string
  style?: CSSProperties
}

export function PageShell({
  title,
  eyebrow,
  onBack,
  children,
  theme = 'candy',
  className = '',
  style,
}: PageShellProps) {
  return (
    <main
      className={`page-shell ${className}`}
      data-theme={theme}
      style={style}
    >
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
