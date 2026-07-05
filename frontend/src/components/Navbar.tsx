import { useNavigate, useLocation } from 'react-router-dom'
import { EMOJI_LOGO } from '../emoji'
import { ChevronLeft } from './icons'

interface Crumb {
  label: string
  to?: string
}

function getCrumbs(pathname: string): Crumb[] {
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length === 0) return []
  if (segs[0] === 'detect' && segs.length >= 2) {
    const cat = segs[1] === 'posture' ? '体态检测' : segs[1] === 'movement' ? '动作检测' : segs[1]
    const crumbs: Crumb[] = [{ label: cat, to: `/detect/${segs[1]}` }]
    if (segs.length >= 3) {
      crumbs.push({ label: segs[2] === 'scoliosis' ? '脊柱侧弯' : segs[2] === 'bench_press' ? '卧推' : segs[2] === 'lat_pulldown' ? '高位下拉' : segs[2] })
    }
    return crumbs
  }
  if (segs[0] === 'result') return [{ label: '分析结果' }]
  if (segs[0] === 'profile') return [{ label: '个人信息' }]
  if (segs[0] === 'settings') return [{ label: '设置' }]
  if (segs[0] === 'diet') {
    const sub: Record<string, string> = { recommend: '饮食推荐', plans: '饮食计划', calories: '卡路里记录' }
    const crumbs: Crumb[] = [{ label: '减脂助手', to: '/diet' }]
    if (segs[1] && sub[segs[1]]) crumbs.push({ label: sub[segs[1]] })
    return crumbs
  }
  return []
}

export default function Navbar() {
  const nav = useNavigate()
  const loc = useLocation()
  const crumbs = getCrumbs(loc.pathname)
  const isHome = loc.pathname === '/'
  // Back button goes to parent breadcrumb
  const parentTo = crumbs.length >= 2 ? crumbs[crumbs.length - 2].to || '/' : '/'

  return (
    <nav className="navbar">
      {isHome ? (
        <button className="navbar__logo-btn" onClick={() => nav('/')}>
          {EMOJI_LOGO}
          <span className="navbar__logo-text">GymFit</span>
        </button>
      ) : (
        <>
          <button className="navbar__back" onClick={() => nav(parentTo)} title="返回">
            <ChevronLeft size={20} />
          </button>
          {crumbs.length > 0 && (
            <div className="navbar__crumbs">
              {crumbs.map((c, i) => (
                <span key={i} className="navbar__crumb">
                  {i > 0 && <span className="navbar__crumb-sep">›</span>}
                  {c.to ? (
                    <button className="navbar__crumb-link" onClick={() => nav(c.to!)}>
                      {c.label}
                    </button>
                  ) : (
                    <span className="navbar__crumb-current">{c.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <button className="navbar__settings" onClick={() => nav('/settings')} title="设置"
        style={{ marginLeft: 'auto' }}>
        ⚙️
      </button>
    </nav>
  )
}
