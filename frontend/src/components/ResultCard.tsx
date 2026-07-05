import ReactMarkdown from 'react-markdown'

interface Props {
  markdown: string
}

export default function ResultCard({ markdown }: Props) {
  return (
    <div className="result-card">
      <div className="markdown">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  )
}
