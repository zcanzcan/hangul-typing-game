interface ScoreBadgeProps {
  label: string
  value: string
}

export function ScoreBadge({ label, value }: ScoreBadgeProps) {
  return (
    <div className="score-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
