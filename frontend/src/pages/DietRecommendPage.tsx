import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorMessage from '../components/ErrorMessage'
import { analyzeDiet } from '../api/detection'
import { EMOJI_LOSE_FAT, EMOJI_GAIN_MUSCLE, EMOJI_MAINTAIN } from '../emoji'

function loadProfile() {
  try { return JSON.parse(localStorage.getItem('gymfit_profile') || '{}') } catch { return {} }
}

const GOALS = [
  { v: '减脂', l: '减脂', icon: EMOJI_LOSE_FAT, d: '创造热量缺口' },
  { v: '增肌', l: '增肌', icon: EMOJI_GAIN_MUSCLE, d: '热量盈余 + 高蛋白' },
  { v: '保持', l: '保持', icon: EMOJI_MAINTAIN, d: '维持当前体重' },
]
const ACTS = [
  { v: 'sedentary', l: '久坐不动' },
  { v: 'light', l: '轻度活动（每周 1-2 次）' },
  { v: 'moderate', l: '中度活动（每周 3-4 次）' },
  { v: 'active', l: '高度活跃（每周 5-6 次）' },
  { v: 'very_active', l: '极高强度（每天训练）' },
]

export default function DietRecommendPage() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({ height: '170', weight: '70', age: '25', gender: 'male', goal: '减脂', activity_level: 'moderate', dietary_restrictions: '', extra: '' })

  useEffect(() => {
    const p = loadProfile()
    if (p.height) setF((prev) => ({ ...prev, ...p }))
  }, [])

  function u(k: string, v: string) { setF((p) => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const r = f.dietary_restrictions ? f.dietary_restrictions.split(',').map((s) => s.trim()).filter(Boolean) : []
      const res = await analyzeDiet({ diet_type_id: 'diet_recommendation', user_input: { height: +f.height, weight: +f.weight, age: +f.age, gender: f.gender, goal: f.goal, activity_level: f.activity_level, dietary_restrictions: r, extra: f.extra } })
      nav(`/result/${res.id}`, { state: res })
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      {loading && <LoadingOverlay text="AI 正在生成饮食方案..." sub="预计 10-20 秒" />}
      {error && <ErrorMessage message={error} />}
      <form className="form-card" onSubmit={submit}>
        <div className="form-card__title">📊 饮食推荐</div>

        <div className="form-section">
          <div className="form-section__title">目标</div>
          <div className="goal-selector">
            {GOALS.map((g) => (
              <div key={g.v} className={`goal-option ${f.goal === g.v ? 'selected' : ''}`} onClick={() => u('goal', g.v)}>
                <span className="goal-option__icon">{g.icon}</span>
                {g.l}
                <div className="goal-option__desc">{g.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section__title">基本信息</div>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group"><label className="form-label">身高 (cm)</label><input className="form-input" type="number" required min="100" max="250" placeholder="170" value={f.height} onChange={(e) => u('height', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">体重 (kg)</label><input className="form-input" type="number" required min="30" max="300" placeholder="70" value={f.weight} onChange={(e) => u('weight', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">年龄</label><input className="form-input" type="number" required min="10" max="100" placeholder="25" value={f.age} onChange={(e) => u('age', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">性别</label><select className="form-select" value={f.gender} onChange={(e) => u('gender', e.target.value)}><option value="male">男</option><option value="female">女</option></select></div>
            <div className="form-group"><label className="form-label">活动水平</label><select className="form-select" value={f.activity_level} onChange={(e) => u('activity_level', e.target.value)}>{ACTS.map((a) => (<option key={a.v} value={a.v}>{a.l}</option>))}</select></div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section__title">偏好（选填）</div>
          <div className="form-group"><label className="form-label">饮食限制</label><input className="form-input" placeholder="不吃猪肉, 乳糖不耐受, 素食" value={f.dietary_restrictions} onChange={(e) => u('dietary_restrictions', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">额外需求</label><textarea className="form-textarea" placeholder="例如：想要一周的碳循环计划、偏好中式饮食..." value={f.extra} onChange={(e) => u('extra', e.target.value)} /></div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>🤖 生成饮食推荐</button>
      </form>
    </div>
  )
}
