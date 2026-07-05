import apiClient from './client'
import type { AnalysisResult, DetectionTypeSummary, DietRecommendRequest } from '../types/detection'

function getSettings() {
  try { return JSON.parse(localStorage.getItem('gymfit_settings') || '{}') } catch { return {} }
}

function settingsParams(): Record<string, string> {
  const s = getSettings()
  const p: Record<string, string> = {}
  if (s.provider) p.provider = s.provider
  if (s.model) p.model = s.model
  if (s.api_key) p.api_key = s.api_key
  return p
}

export async function fetchDetectionTypes(category?: string): Promise<{
  types: DetectionTypeSummary[]
  total: number
  category: string | null
}> {
  const params = category ? { category } : {}
  const { data } = await apiClient.get('/detection-types', { params })
  return data
}

export async function fetchDetectionType(id: string): Promise<DetectionTypeSummary> {
  const { data } = await apiClient.get(`/detection-types/${id}`)
  return data
}

export async function analyzeImage(
  detection_type_id: string,
  image: File,
  description?: string,
  provider?: string,
): Promise<AnalysisResult> {
  const form = new FormData()
  const sp = settingsParams()
  form.append('detection_type_id', detection_type_id)
  form.append('image', image)
  if (description) form.append('description', description)
  form.append('provider', provider || sp.provider || '')
  if (sp.model) form.append('model', sp.model)
  if (sp.api_key) form.append('api_key', sp.api_key)

  const { data } = await apiClient.post('/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function analyzeMultiAngle(
  detection_type_id: string,
  files: File[],
  angles: string[],
  description?: string,
): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('detection_type_id', detection_type_id)
  files.forEach((f) => form.append('files', f))
  form.append('angles', angles.join(','))
  if (description) form.append('description', description)
  const sp = settingsParams()
  if (sp.provider) form.append('provider', sp.provider)
  if (sp.model) form.append('model', sp.model)
  if (sp.api_key) form.append('api_key', sp.api_key)

  const { data } = await apiClient.post('/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return data
}

export async function analyzeDiet(req: DietRecommendRequest): Promise<AnalysisResult> {
  const sp = settingsParams()
  const { data } = await apiClient.post('/diet/recommend', { ...req, ...sp })
  return data
}

export interface FoodEstimate {
  name: string; amount: string
  calories: number; protein: number; carbs: number; fat: number
  note?: string
}

export async function estimateFood(food: string, amount: string): Promise<FoodEstimate> {
  const sp = settingsParams()
  const { data } = await apiClient.post('/diet/estimate-food', { food, amount, ...sp })
  return data
}

export async function fetchResult(id: string): Promise<AnalysisResult> {
  const { data } = await apiClient.get(`/results/${id}`)
  return data
}
