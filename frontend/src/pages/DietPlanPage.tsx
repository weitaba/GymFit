import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorMessage from '../components/ErrorMessage'
import { analyzeDiet } from '../api/detection'
import { EMOJI_CARB_CYCLING, EMOJI_KETO } from '../emoji'

const PLANS = [
  { id: 'carb_cycling', name: '碳循环饮食', icon: EMOJI_CARB_CYCLING, desc: '高低碳水日交替安排，保持训练表现的同时最大化脂肪燃烧' },
  { id: 'keto_plan', name: '生酮饮食', icon: EMOJI_KETO, desc: '极低碳水高脂肪摄入，让身体进入酮症状态以脂肪为主要能源' },
]

export default function DietPlanPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('carb_cycling')
  const [extra, setExtra] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const result = await analyzeDiet({ diet_type_id: selected, user_input: { extra } })
      navigate(`/result/${result.id}`, { state: result })
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      {loading && <LoadingOverlay text="AI 正在生成饮食方案..." sub="预计 10-20 秒" />}
      {error && <ErrorMessage message={error} />}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-card__title">📋 选择饮食方案</div>
        <div className="form-section">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            选择一种饮食方案，AI 将生成详细的执行计划。在额外说明中可以补充个人信息。
          </p>

          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card${selected === plan.id ? ' plan-card--selected' : ''}`}
              onClick={() => setSelected(plan.id)}
            >
              <span className="plan-card__icon">{plan.icon}</span>
              <div className="plan-card__body">
                <div className="plan-card__name">{plan.name}</div>
                <div className="plan-card__desc">{plan.desc}</div>
              </div>
              {selected === plan.id && <span className="plan-card__check">✓</span>}
            </div>
          ))}
        </div>

        <div className="form-section">
          <div className="form-section__title">额外说明（选填）</div>
          <div className="form-group">
            <textarea className="form-textarea" placeholder="例如：体重 70kg，目标减脂到 65kg，每周训练 4 天，有胃病需要注意..." value={extra} onChange={(e) => setExtra(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
          📋 生成{PLANS.find((p) => p.id === selected)?.name}方案
        </button>
      </form>
    </div>
  )
}
