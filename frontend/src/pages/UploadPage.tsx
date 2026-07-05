import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import Layout from '../components/Layout'
import MediaUploader from '../components/MediaUploader'
import MultiUploader from '../components/MultiUploader'
import LoadingOverlay from '../components/LoadingOverlay'
import ErrorMessage from '../components/ErrorMessage'
import { fetchDetectionType, analyzeImage, analyzeMultiAngle } from '../api/detection'
import type { DetectionTypeSummary } from '../types/detection'

export default function UploadPage() {
  const { category, typeId } = useParams<{ category: string; typeId: string }>()
  const navigate = useNavigate()
  const [type, setType] = useState<DetectionTypeSummary | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [multiFiles, setMultiFiles] = useState<{ file: File; angle: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInstr, setShowInstr] = useState(false)
  const [resultId, setResultId] = useState<string | null>(null)
  const isMovement = category === 'movement'

  useEffect(() => {
    if (!typeId) return
    fetchDetectionType(typeId).then(setType).catch((e) => setError(e.message)).finally(() => setPageLoading(false))
  }, [typeId])

  const handleMulti = useCallback((files: { file: File; angle: string }[]) => setMultiFiles(files), [])

  async function handleSubmit() {
    if (!type) return
    if (isMovement ? multiFiles.length === 0 : !file) return
    setLoading(true); setError('')
    try {
      let result
      if (isMovement) {
        result = await analyzeMultiAngle(type.id, multiFiles.map((m) => m.file), multiFiles.map((m) => m.angle))
      } else {
        result = await analyzeImage(type.id, file!)
      }
      setResultId(result.id)
      sessionStorage.setItem('last_result_id', result.id)
      sessionStorage.setItem('last_result_data', JSON.stringify(result))
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const hasFiles = isMovement ? multiFiles.length > 0 : !!file

  return (
    <Layout>
      {pageLoading && <LoadingOverlay text="加载中..." />}
      {!pageLoading && error && !hasFiles && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      <div className="upload-steps">
        <div className={`upload-step ${hasFiles ? 'done' : 'active'}`}>
          <span className="upload-step__num">{hasFiles ? '✓' : '1'}</span>
          {isMovement ? '上传视频' : '上传图片'}
        </div>
        <div className={`upload-step ${loading ? 'active' : resultId ? 'done' : ''}`}>
          <span className="upload-step__num">{loading ? '⏳' : resultId ? '✓' : '2'}</span>
          AI 分析
        </div>
      </div>

      {type && (
        <>

          <div className="upload__info">
            <div className="upload__info-header">
              <div>
                <h2>{type.name}</h2>
                <p className="upload__info-desc">{type.description}</p>
              </div>
              <button className="upload__info-toggle" onClick={() => setShowInstr(!showInstr)}>
                {showInstr ? '收起 ▲' : '展开指引 ▼'}
              </button>
            </div>
            {showInstr && <div className="instructions"><ReactMarkdown>{type.instructions}</ReactMarkdown></div>}
          </div>

          {isMovement ? <MultiUploader onFiles={handleMulti} disabled={loading} angles={type.angles} /> : <MediaUploader onFile={setFile} disabled={loading} />}

          {hasFiles && !resultId && (
            <div className="submit-area">
              <button className="btn btn-secondary" onClick={() => { setFile(null); setMultiFiles([]); setError('') }} disabled={loading}>清空重选</button>
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? '⏳ 分析中...' : `🔍 开始 AI 分析${isMovement ? `（${multiFiles.length} 个角度）` : ''}`}
              </button>
            </div>
          )}

          {resultId && (
            <div className="submit-area">
              <button className="btn btn-secondary" onClick={() => { setFile(null); setMultiFiles([]); setResultId(null); setError('') }}>重新上传</button>
              <button className="btn btn-primary btn-lg" onClick={() => {
                const raw = sessionStorage.getItem('last_result_data')
                navigate(`/result/${resultId}`, { state: raw ? JSON.parse(raw) : null })
              }}>📊 查看分析结果</button>
            </div>
          )}

        </>
      )}

      {loading && <LoadingOverlay text="AI 正在分析..." sub={isMovement ? '视频抽帧 + 多角度综合分析，预计 20-50 秒' : '预计 10-30 秒'} />}
      {error && hasFiles && <ErrorMessage message={error} onRetry={handleSubmit} />}
    </Layout>
  )
}
