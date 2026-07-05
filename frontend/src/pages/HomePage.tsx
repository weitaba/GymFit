import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { EMOJI_HOME_POSTURE, EMOJI_HOME_MOVEMENT, EMOJI_HOME_DIET, EMOJI_HOME_PROFILE } from '../emoji'

const MODULES = [
  { icon: EMOJI_HOME_POSTURE, title: '体态检测', desc: '脊柱侧弯筛查 — 上传照片获取专业分析', to: '/detect/posture', cls: 'module-card--posture' },
  { icon: EMOJI_HOME_MOVEMENT, title: '动作检测', desc: '卧推动作分析 — 上传视频评估动作规范性', to: '/detect/movement', cls: 'module-card--movement' },
  { icon: EMOJI_HOME_DIET, title: '减脂助手', desc: '饮食推荐 · 碳循环计划 · 卡路里记录', to: '/diet', cls: 'module-card--diet' },
  { icon: EMOJI_HOME_PROFILE, title: '个人信息', desc: '身高体重年龄等基础数据，一次填写多模块共享', to: '/profile', cls: 'module-card--posture' },
]

export default function HomePage() {
  return (
    <Layout>
      <div className="home__hero">
        <div className="home__hero-badge">✨ AI 驱动</div>
        <h1>智能健身助手</h1>
        <p>拍照或上传视频，AI 即刻给出专业分析。体态评估、动作纠正、饮食规划，一站式解决。</p>
      </div>
      <div className="home__modules">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className={`module-card ${m.cls}`}>
            <div className="module-card__icon">{m.icon}</div>
            <div className="module-card__content">
              <div className="module-card__title">{m.title}</div>
              <div className="module-card__desc">{m.desc}</div>
            </div>
            <span className="module-card__arrow">→</span>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
