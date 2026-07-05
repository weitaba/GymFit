import { useRef, useState, useEffect } from 'react'
import { ChevronDown } from './icons'
import { EMOJI_UPLOAD_IMAGE, EMOJI_UPLOAD_VIDEO, EMOJI_PREVIEW_CAM, EMOJI_PREVIEW_VID } from '../emoji'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
  acceptVideo?: boolean
}

const MAX_IMAGE = 10 * 1024 * 1024
const MAX_VIDEO = 50 * 1024 * 1024
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp']
const VID_MIME = ['video/mp4', 'video/webm', 'video/quicktime']

export default function MediaUploader({ onFile, disabled, acceptVideo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  function validate(file: File): string | null {
    const allMime = acceptVideo ? [...IMG_MIME, ...VID_MIME] : IMG_MIME
    if (!allMime.includes(file.type)) {
      return acceptVideo
        ? '仅支持 JPEG / PNG / WEBP / MP4 / WEBM 格式'
        : '仅支持 JPEG、PNG、WEBP 格式'
    }
    const maxSize = VID_MIME.includes(file.type) ? MAX_VIDEO : MAX_IMAGE
    if (file.size > maxSize) {
      const limit = VID_MIME.includes(file.type) ? '50MB' : '10MB'
      return `文件大小不能超过 ${limit}`
    }
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError('')
    setFileName(file.name)
    setShowPreview(false)
    const isVid = VID_MIME.includes(file.type)
    setIsVideo(isVid)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }

  function handleRemove() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null); setFileName(''); setError('')
  }

  // Paste support
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      for (const item of e.clipboardData?.items || []) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile(); if (f) handleFile(f)
          break
        }
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  const accept = acceptVideo ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'
  const icon = acceptVideo ? EMOJI_UPLOAD_VIDEO : EMOJI_UPLOAD_IMAGE
  const text = acceptVideo ? '拖拽图片或视频到此处' : '拖拽图片到此处或点击上传'
  const hint = acceptVideo
    ? '支持 JPEG / PNG / WEBP / MP4 / WEBM，图片最大 10MB，视频最大 50MB · Ctrl+V 粘贴'
    : '支持 JPEG / PNG / WEBP，最大 10MB · Ctrl+V 粘贴'

  return (
    <div>
      {!preview ? (
        <div
          className={`media-uploader ${dragover ? 'dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
          onDragLeave={() => setDragover(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragover(false)
            const f = e.dataTransfer.files[0]; if (f) handleFile(f)
          }}
        >
          <span className="media-uploader__icon">{icon}</span>
          <div className="media-uploader__text">{disabled ? '上传中...' : text}</div>
          <div className="media-uploader__hint">{hint}</div>
          <input ref={inputRef} type="file" accept={accept} hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      ) : (
        <div className="media-preview">
          <div className="media-preview__header">
            <span>{isVideo ? EMOJI_PREVIEW_VID : EMOJI_PREVIEW_CAM} {fileName}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="upload__info-toggle" onClick={() => setShowPreview(!showPreview)}
                style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ transform: showPreview ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'flex' }}>
                  <ChevronDown />
                </span>
                预览
              </button>
              <button className="media-preview__remove" onClick={handleRemove}>移除</button>
            </div>
          </div>
          {showPreview && (
            isVideo
              ? <video src={preview} controls style={{ width: '100%', maxHeight: 420 }} />
              : <img src={preview} alt="预览" />
          )}
        </div>
      )}
      {error && <div className="error-message" style={{ marginTop: 12 }}><span className="error-message__icon">⚠️</span>{error}</div>}
    </div>
  )
}
