import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import DetectionCard from '../components/DetectionCard'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import { fetchDetectionTypes } from '../api/detection'
import type { DetectionTypeSummary } from '../types/detection'
import { EMOJI_CAT_POSTURE, EMOJI_CAT_MOVEMENT } from '../emoji'

const META: Record<string, { title: string; desc: string; icon: string }> = {
  posture: { title: '体态检测', desc: '上传体态照片，AI 分析潜在问题并给出矫正建议', icon: EMOJI_CAT_POSTURE },
  movement: { title: '动作检测', desc: '上传训练视频，AI 分析动作规范性和受伤风险', icon: EMOJI_CAT_MOVEMENT },
}

export default function DetectionListPage() {
  const { category } = useParams<{ category: string }>()
  const [types, setTypes] = useState<DetectionTypeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const meta = META[category || '']

  useEffect(() => {
    setLoading(true); setError('')
    fetchDetectionTypes(category)
      .then((d) => setTypes(d.types))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <Layout title={meta?.title || '检测'} showBack>
      {loading && <LoadingOverlay text="加载中..." />}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
      {!loading && !error && (
        <>
          {meta && (
            <div className="page-header">
              <div className="page-header__icon">{meta.icon}</div>
              <h2>{meta.title}</h2>
              <p>{meta.desc}</p>
            </div>
          )}
          {types.length === 0 ? (
            <EmptyState icon="📭" title="暂无检测类型" desc="该类别下还没有配置检测项目" />
          ) : (
            <div className="detection-grid">
              {types.map((t) => (<DetectionCard key={t.id} type={t} />))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
