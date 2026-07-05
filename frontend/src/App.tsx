import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DetectionListPage from './pages/DetectionListPage'
import UploadPage from './pages/UploadPage'
import ResultPage from './pages/ResultPage'
import DietPage from './pages/DietPage'
import DietRecommendPage from './pages/DietRecommendPage'
import DietPlanPage from './pages/DietPlanPage'
import CalorieTrackerPage from './pages/CalorieTrackerPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/detect/:category" element={<DetectionListPage />} />
      <Route path="/detect/:category/:typeId" element={<UploadPage />} />
      <Route path="/result/:resultId" element={<ResultPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/diet" element={<DietPage />}>
        <Route index element={<DietRecommendPage />} />
        <Route path="recommend" element={<DietRecommendPage />} />
        <Route path="plans" element={<DietPlanPage />} />
        <Route path="calories" element={<CalorieTrackerPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
