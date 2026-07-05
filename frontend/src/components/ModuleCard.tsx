import { Link } from 'react-router-dom'

interface Props {
  icon: string
  title: string
  description: string
  to: string
}

export default function ModuleCard({ icon, title, description, to }: Props) {
  return (
    <Link to={to} className="module-card">
      <div className="module-card__icon">{icon}</div>
      <div className="module-card__title">{title}</div>
      <div className="module-card__desc">{description}</div>
    </Link>
  )
}
