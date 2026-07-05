export type Category = 'posture' | 'movement' | 'diet'

export interface DetectionTypeSummary {
  id: string
  name: string
  category: Category
  description: string
  instructions: string
  tags: string[]
  output_format: Record<string, string>
  input_fields: string[]
  angles: { id: string; label: string; icon: string; desc: string; checks: string }[]
}

export interface AnalysisResult {
  id: string
  detection_type_id: string
  detection_type_name: string
  category: Category
  result: string
  provider_used: string
  model_used: string
  created_at: string
}

export interface DietRecommendRequest {
  diet_type_id: string
  user_input: Record<string, unknown>
  provider?: string
  model?: string
}

export interface CalorieEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  time: string
}

export interface CalorieLogs {
  [date: string]: CalorieEntry[]
}
