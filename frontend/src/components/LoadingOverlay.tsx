interface Props {
  text?: string
  sub?: string
}

export default function LoadingOverlay({ text, sub }: Props) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <div className="loading-overlay__text">{text || 'AI 分析中，预计 10-30 秒...'}</div>
      {sub && <div className="loading-overlay__sub">{sub}</div>}
    </div>
  )
}
