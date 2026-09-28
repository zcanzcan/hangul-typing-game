interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : (current / total) * 100

  return (
    <div className="progress" aria-label={`진행률 ${current} / ${total}`}>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${percentage}%` }} />
      </div>
      <strong>
        {current} / {total}
      </strong>
    </div>
  )
}
