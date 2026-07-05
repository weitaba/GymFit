import { NavLink } from 'react-router-dom'
import { EMOJI_DIET_RECOMMEND, EMOJI_DIET_PLANS, EMOJI_DIET_CALORIES } from '../emoji'

const LINKS = [
  { to: '/diet/recommend', label: '饮食推荐', icon: EMOJI_DIET_RECOMMEND },
  { to: '/diet/plans', label: '饮食计划', icon: EMOJI_DIET_PLANS },
  { to: '/diet/calories', label: '卡路里记录', icon: EMOJI_DIET_CALORIES },
]

export default function DietNav() {
  return (
    <div className="diet-nav">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          className={({ isActive }) =>
            `diet-nav__link${isActive ? ' active' : ''}`
          }
        >
          {link.icon}
          {link.label}
        </NavLink>
      ))}
    </div>
  )
}
