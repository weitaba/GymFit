import { useRef, useState, useEffect } from 'react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUploader({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  function validate(file: File): string | null {
    if (!ALLOWED.includes(file.type)) return '仅支持 JPEG、PNG、WEBP 格式'
    if (file.size > MAX_SIZE) return '图片大小不能超过 10MB'
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError('')
    setFileName(file.name)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName('')
    setError('')
    // Notify parent with null-like state — parent handles via the btn-outline
  }

  // Handle paste from clipboard
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  return (
    <div>
      {!preview ? (
        <div
          className={`image-uploader ${dragOver ? 'dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="image-uploader__icon">📁</span>
          <div className="image-uploader__text">
            {disabled ? '分析中...' : '拖拽图片到此处或点击上传'}
          </div>
          <div className="image-uploader__hint">
            支持 JPEG / PNG / WEBP，最大 10MB &nbsp;·&nbsp; 也支持 Ctrl+V 粘贴
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file) }}
          />
        </div>
      ) : (
        <div className="image-preview">
          <div className="image-preview__header">
            <span>📷 {fileName}</span>
            <button className="image-preview__remove" onClick={handleRemove} type="button">
              移除
            </button>
          </div>
          <img src={preview} alt="预览" />
        </div>
      )}

      {error && <div className="error-message" style={{ marginTop: 12 }}>⚠️ {error}</div>}
    </div>
  )
}
