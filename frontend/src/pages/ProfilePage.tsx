import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { EMOJI_HOME_PROFILE, EMOJI_EXPORT } from '../emoji'

const KEY = 'gymfit_profile'

interface Profile {
  height: string; weight: string; age: string; gender: string
  goal: string; activity_level: string
}

function load(): Profile {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} as Profile }
}

const ACTIVITIES = [
  { v: 'sedentary', l: '久坐不动' },
  { v: 'light', l: '轻度活动（每周 1-2 次）' },
  { v: 'moderate', l: '中度活动（每周 3-4 次）' },
  { v: 'active', l: '高度活跃（每周 5-6 次）' },
  { v: 'very_active', l: '极高强度（每天训练）' },
]

const GOALS = [
  { v: '减脂', l: '减脂' },
  { v: '增肌', l: '增肌' },
  { v: '保持', l: '保持体重' },
]

export default function ProfilePage() {
  const [saved, setSaved] = useState(false)
  const [f, setF] = useState<Profile>({
    height: '170', weight: '70', age: '25', gender: 'male',
    goal: '减脂', activity_level: 'moderate',
  })

  useEffect(() => {
    const existing = load()
    if (existing.height) setF((p) => ({ ...p, ...existing }))
  }, [])

  function u(k: string, v: string) { setF((p) => ({ ...p, [k]: v })) }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(f))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout>
      {saved && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: '#fff', padding: '10px 24px',
          borderRadius: 100, fontSize: 14, fontWeight: 600, zIndex: 200,
          boxShadow: 'var(--shadow-lg)', animation: 'fadeIn .3s',
        }}>
          ✅ 保存成功
        </div>
      )}

      <div className="page-header">
        <div className="page-header__icon">{EMOJI_HOME_PROFILE}</div>
        <h2>个人信息</h2>
        <p>填写后，饮食推荐等模块会自动读取你的数据，无需重复输入</p>
      </div>

      <div className="form-card">
        <div className="form-section">
          <div className="form-section__title">基本信息</div>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">身高 (cm)</label>
              <input className="form-input" type="number" value={f.height}
                onChange={(e) => u('height', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">体重 (kg)</label>
              <input className="form-input" type="number" value={f.weight}
                onChange={(e) => u('weight', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">年龄</label>
              <input className="form-input" type="number" value={f.age}
                onChange={(e) => u('age', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">性别</label>
              <select className="form-select" value={f.gender} onChange={(e) => u('gender', e.target.value)}>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">活动水平</label>
              <select className="form-select" value={f.activity_level} onChange={(e) => u('activity_level', e.target.value)}>
                {ACTIVITIES.map((a) => (<option key={a.v} value={a.v}>{a.l}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section__title">健身目标</div>
          <div className="form-group">
            <select className="form-select" value={f.goal} onChange={(e) => u('goal', e.target.value)}>
              {GOALS.map((g) => (<option key={g.v} value={g.v}>{g.l}</option>))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={save}>
          {EMOJI_EXPORT} 保存信息
        </button>
      </div>
    </Layout>
  )
}
