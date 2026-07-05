import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ResultCard from '../components/ResultCard'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorMessage from '../components/ErrorMessage'
import { fetchResult } from '../api/detection'
import type { AnalysisResult } from '../types/detection'
import { EMOJI_RESULT_POSTURE, EMOJI_RESULT_MOVEMENT, EMOJI_RESULT_DIET, EMOJI_RETRY, EMOJI_HOME } from '../emoji'

const ICONS: Record<string, string> = {
  posture: EMOJI_RESULT_POSTURE, movement: EMOJI_RESULT_MOVEMENT, diet: EMOJI_RESULT_DIET,
}

const PROVIDER_NAMES: Record<string, string> = {
  claude: 'Claude', openai: 'OpenAI', bailian: '阿里云百炼',
}

function getBadge(text: string) {
  if (/高风险|存在风险|明显/.test(text)) return { label: '需关注', cls: 'badge--warning' }
  if (/中风险|需要改进/.test(text)) return { label: '可改进', cls: 'badge--info' }
  if (/低风险|优秀|良好|正常/.test(text)) return { label: '良好', cls: 'badge--success' }
  return null
}

export default function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>()
  const loc = useLocation()
  const nav = useNavigate()
  const [result, setResult] = useState<AnalysisResult | null>((loc.state as AnalysisResult) || null)
  const [loading, setLoading] = useState(!result)
  const [error, setError] = useState('')

  useEffect(() => {
    if (result || !resultId) return
    setLoading(true)
    fetchResult(resultId).then(setResult).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [resultId, result])

  const badge = result ? getBadge(result.result) : null

  return (
    <Layout title="分析结果" showBack>
      {loading && <LoadingOverlay text="加载结果..." />}
      {error && <ErrorMessage message={error} />}

      {result && (
        <>
          <div className="result-header">
            <div className="result-header__left">
              <div className="result-header__icon">{ICONS[result.category] || '📋'}</div>
              <div>
                <div className="result-header__title">{result.detection_type_name}</div>
                <div className="result-header__meta">
                  {PROVIDER_NAMES[result.provider_used] || result.provider_used} · {result.model_used} · {new Date(result.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
            {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
          </div>

          <ResultCard markdown={result.result} />

          <div className="result-actions">
            <button className="btn btn-secondary" onClick={() => nav(-1)}>{EMOJI_RETRY} 重新检测</button>
            <button className="btn btn-primary" onClick={() => nav('/')}>{EMOJI_HOME} 返回首页</button>
          </div>
        </>
      )}
    </Layout>
  )
}
