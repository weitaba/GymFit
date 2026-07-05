import { Link } from 'react-router-dom'
import type { DetectionTypeSummary } from '../types/detection'
import { EMOJI_CARD_POSTURE, EMOJI_CARD_MOVEMENT, EMOJI_CARD_DIET } from '../emoji'

const ICONS: Record<string, string> = {
  posture: EMOJI_CARD_POSTURE,
  movement: EMOJI_CARD_MOVEMENT,
  diet: EMOJI_CARD_DIET,
}

interface Props { type: DetectionTypeSummary }

export default function DetectionCard({ type }: Props) {
  return (
    <Link to={`/detect/${type.category}/${type.id}`} className="detection-card">
      <span className="detection-card__icon">{ICONS[type.category]}</span>
      <div className="detection-card__name">{type.name}</div>
      <div className="detection-card__desc">{type.description}</div>
    </Link>
  )
}
