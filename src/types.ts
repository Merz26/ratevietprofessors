export interface Institution {
  id: number
  name: string
  short_name: string
  location: string
  departments: string[]
}
export interface Professor {
  id: number
  name: string
  university: string
  department: string
  tags: string[]
}
export interface InstitutionReview {
  id: string
  inst_id: number
  author_name: string
  comment: string
  created_at: string
  metrics: Record<string, number>
  helpful: number
  not_helpful: number
  userVote?: 'helpful' | 'not_helpful' | null
}
export interface ProfessorReview {
  id: string
  prof_id: number
  author_name: string
  course: string
  teaching_rating: number
  difficulty_rating: number
  would_take_again: boolean
  for_credit: string
  textbook: string
  attendance: string
  grade: string
  tags: string[]
  comment: string
  created_at: string
  helpful: number
  not_helpful: number
  userVote?: 'helpful' | 'not_helpful' | null
}
export interface Suggestion {
  id?: number
  type: string
  targetName: string
  university?: string
  department?: string
  short_name?: string
  location?: string
  departments?: string[]
  content: string
  author_name: string
  status: string
  created_at?: string
}
