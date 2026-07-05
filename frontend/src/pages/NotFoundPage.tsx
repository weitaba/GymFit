import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function NotFoundPage() {
  return (
    <Layout title="404">
      <div className="empty-state">
        <div className="empty-state__icon">🔍</div>
        <p>页面不存在</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
          返回首页
        </Link>
      </div>
    </Layout>
  )
}
