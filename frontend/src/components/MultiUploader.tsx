import { useRef, useState, useEffect, useMemo } from 'react'
import { ChevronDown } from './icons'

interface AngleSlot {
  id: string; label: string; icon: string; desc: string; checks: string
}

const DEFAULT_ANGLES: AngleSlot[] = [
  { id: 'front', label: '正面拍', icon: '📷', desc: '手机置于脚端正对拍摄', checks: '握距 · 握法 · 呼吸 · 躺姿对称' },
  { id: 'side', label: '侧面拍', icon: '👀', desc: '手机置于身体侧面平行拍摄', checks: '躺姿起桥 · 出杆 · 腿部驱动' },
  { id: 'top', label: '俯拍', icon: '🔽', desc: '手机固定在正上方拍摄', checks: '向心落点 · 肘部角度 · 出杆稳定性' },
]

const VID_MIME = ['video/mp4', 'video/webm', 'video/quicktime']
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp']
const ALL_MIME = [...IMG_MIME, ...VID_MIME]
const MAX_SIZE = 50 * 1024 * 1024

interface SlotState { file: File | null; preview: string | null; error: string }

interface Props {
  onFiles: (data: { file: File; angle: string }[]) => void
  disabled?: boolean
  angles?: AngleSlot[]
}

export default function MultiUploader({ onFiles, disabled, angles: angleList }: Props) {
  const angles = angleList?.length ? angleList : DEFAULT_ANGLES

  const initSlots = (): Record<string, SlotState> => {
    const s: Record<string, SlotState> = {}
    angles.forEach((a) => { s[a.id] = { file: null, preview: null, error: '' } })
    return s
  }

  const [slots, setSlots] = useState<Record<string, SlotState>>(initSlots)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Re-init slots when angles change
  useMemo(() => {
    setSlots(initSlots())
  }, [angleList])

  useEffect(() => {
    const files = Object.entries(slots)
      .filter(([, s]) => s.file)
      .map(([angle, s]) => ({ file: s.file!, angle }))
    onFiles(files)
  }, [slots, onFiles])

  useEffect(() => {
    return () => { Object.values(slots).forEach((s) => { if (s.preview) URL.revokeObjectURL(s.preview) }) }
  }, [])

  function handleFile(angleId: string, file: File) {
    const err = validate(file)
    if (err) { setSlots((p) => ({ ...p, [angleId]: { ...p[angleId], error: err } })); return }
    const prev = slots[angleId]?.preview
    if (prev) URL.revokeObjectURL(prev)
    setSlots((p) => ({ ...p, [angleId]: { file, preview: URL.createObjectURL(file), error: '' } }))
  }

  function removeSlot(angleId: string) {
    const prev = slots[angleId]?.preview
    if (prev) URL.revokeObjectURL(prev)
    setSlots((p) => ({ ...p, [angleId]: { file: null, preview: null, error: '' } }))
    if (inputRefs.current[angleId]) inputRefs.current[angleId]!.value = ''
  }

  function validate(file: File): string | null {
    if (!ALL_MIME.includes(file.type)) return '仅支持 JPEG/PNG/WEBP/MP4/WEBM'
    if (file.size > MAX_SIZE) return '最大 50MB'
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {angles.map((angle) => {
        const slot = slots[angle.id] || { file: null, preview: null, error: '' }
        const filled = !!slot.file
        const isVideo = slot.file && VID_MIME.includes(slot.file.type)

        return (
          <div key={angle.id}>
            <div className={`angle-card${filled ? ' angle-card--filled' : ''}`}>
              <div
                className="angle-card__header"
                onClick={() => { if (!filled && !disabled) inputRefs.current[angle.id]?.click() }}
              >
                <span className="angle-card__icon">{angle.icon}</span>
                <div className="angle-card__body">
                  <div className="angle-card__label">
                    {angle.label}
                    {filled && <span className="angle-card__check">✓ 已上传</span>}
                  </div>
                  <div className="angle-card__desc">{angle.desc}</div>
                  <div className="angle-card__checks">{angle.checks}</div>
                </div>
                {!filled ? (
                  <span className="angle-card__add">+</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button
                      className="upload__info-toggle"
                      onClick={(e) => { e.stopPropagation(); setExpanded((p) => ({ ...p, [angle.id]: !p[angle.id] })) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                      <span style={{ transform: expanded[angle.id] ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'flex' }}>
                        <ChevronDown />
                      </span>
                      预览视频
                    </button>
                    <button className="angle-card__remove" onClick={(e) => { e.stopPropagation(); removeSlot(angle.id) }}>移除</button>
                  </div>
                )}
              </div>

              {slot.error && <div className="angle-card__error">⚠️ {slot.error}</div>}

              <input ref={(el) => { inputRefs.current[angle.id] = el }} type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(angle.id, f) }} />
            </div>

            {expanded[angle.id] && slot.preview && (
              <div className="angle-card__preview">
                {isVideo
                  ? <video src={slot.preview} controls />
                  : <img src={slot.preview} alt={angle.label} />
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
