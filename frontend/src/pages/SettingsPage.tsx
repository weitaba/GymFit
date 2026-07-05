import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const KEY = 'gymfit_settings'

interface Settings {
  provider: string
  model: string
  api_key: string
}

const PROVIDERS = [
  { id: 'bailian', name: '阿里云百炼', models: ['qwen-vl-max', 'qwen-max', 'qwen-plus'] },
  { id: 'claude', name: 'Claude', models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] },
]

function load(): Settings {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} as Settings }
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [s, setS] = useState<Settings>({
    provider: 'bailian',
    model: 'qwen-vl-max',
    api_key: '',
  })

  useEffect(() => {
    const existing = load()
    if (existing.provider) setS((p) => ({ ...p, ...existing }))
  }, [])

  function update(k: string, v: string) {
    setS((p) => {
      const next = { ...p, [k]: v }
      if (k === 'provider') {
        const def = PROVIDERS.find((pr) => pr.id === v)
        if (def) next.model = def.models[0]
      }
      return next
    })
    setSaved(false)
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(s))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentProvider = PROVIDERS.find((p) => p.id === s.provider)

  return (
    <Layout>
      {saved && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: '#fff', padding: '10px 24px',
          borderRadius: 100, fontSize: 14, fontWeight: 600, zIndex: 200,
          boxShadow: 'var(--shadow-lg)',
        }}>
          ✅ 保存成功
        </div>
      )}

      <div className="page-header">
        <div className="page-header__icon">⚙️</div>
        <h2>设置</h2>
        <p>选择 AI 服务商并配置 API Key，设置保存在浏览器本地</p>
      </div>

      <div className="form-card">
        <div className="form-section">
          <div className="form-section__title">AI 服务商</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROVIDERS.map((p) => (
              <div key={p.id}
                className={`plan-card${s.provider === p.id ? ' plan-card--selected' : ''}`}
                onClick={() => update('provider', p.id)}
              >
                <span className="plan-card__icon" style={{ fontSize: 24 }}>
                  {p.id === 'bailian' ? '☁️' : p.id === 'claude' ? '🧠' : '🤖'}
                </span>
                <div className="plan-card__body">
                  <div className="plan-card__name">{p.name}</div>
                  <div className="plan-card__desc">模型：{p.models.join('、')}</div>
                </div>
                {s.provider === p.id && <span className="plan-card__check">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section__title">模型选择</div>
          <div className="form-group">
            <select className="form-select" value={s.model}
              onChange={(e) => update('model', e.target.value)}>
              {(currentProvider?.models || []).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section__title">API Key</div>
          <div className="form-group">
            <input
              className="form-input"
              type="password"
              placeholder="sk-..."
              value={s.api_key}
              onChange={(e) => update('api_key', e.target.value)}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Key 仅保存在浏览器本地，不会上传到服务器
            </p>
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={save}>
          💾 保存设置
        </button>
      </div>
    </Layout>
  )
}
