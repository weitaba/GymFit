interface Props {
  icon?: string
  title?: string
  desc?: string
}

export default function EmptyState({ icon = '📭', title, desc }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      {title && <div className="empty-state__title">{title}</div>}
      {desc && <div className="empty-state__desc">{desc}</div>}
    </div>
  )
}
