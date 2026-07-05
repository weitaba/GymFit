import { Outlet } from 'react-router-dom'
import Layout from '../components/Layout'
import DietNav from '../components/DietNav'

export default function DietPage() {
  return (
    <Layout title="减脂助手" showBack>
      <DietNav />
      <Outlet />
    </Layout>
  )
}
