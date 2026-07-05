interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="error-message">
      <span className="error-message__icon">⚠️</span>
      <div style={{ flex: 1 }}>
        <p>{message}</p>
        {onRetry && (
          <button className="btn btn-sm btn-outline" style={{ marginTop: 8 }} onClick={onRetry}>
            重试
          </button>
        )}
      </div>
    </div>
  )
}
