import React, { useState, type FormEvent } from 'react'
import { InputField, TextareaField } from '@figma/astraui'
import { Institution, InstitutionReview } from '../types'
import { CRITERIA_KEYS } from '../constants'
import {
  Button,
  ButtonGroup,
  RatingSelector,
} from '../components/ui/UIComponents'
import { supabase } from '../supabaseClient'

interface AddInstReviewViewProps {
  selectedInst: Institution | null
  onReviewAdded: (newReview: InstitutionReview) => void
  navigate: (view: string, inst?: Institution) => void
  renderBreadcrumb: () => React.ReactNode
  showToast: (message: string, variant?: 'default' | 'success' | 'error') => void
}

export const AddInstReviewView: React.FC<AddInstReviewViewProps> = ({
  selectedInst,
  onReviewAdded,
  navigate,
  renderBreadcrumb,
  showToast,
}) => {
  const [instAuthorName, setInstAuthorName] = useState('')
  const [instMetrics, setInstMetrics] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA_KEYS.map(k => [k, 5]))
  )
  const [instReviewComment, setInstReviewComment] = useState('')

  if (!selectedInst) return null

  const handleSub = async (e: FormEvent) => {
    e.preventDefault()
    if (!instReviewComment.trim()) {
      showToast('Vui lòng nhập nhận xét', 'error')
      return
    }

    const finalName = instAuthorName.trim() || 'Ẩn danh'
    const newRev = { 
      inst_id: selectedInst.id, 
      author_name: finalName, 
      metrics: { ...instMetrics }, 
      comment: instReviewComment.trim(), 
      helpful: 0, 
      not_helpful: 0 
    }

    const { data, error } = await supabase.from('institution_reviews').insert([newRev]).select() as any
    if (error) {
      showToast(error.message, 'error')
      return
    }
    if (data) {
      onReviewAdded({ ...data[0], userVote: null } as InstitutionReview)
    }
    showToast('Đánh giá trường đã được gửi!', 'success')
    
    // Reset form
    setInstAuthorName('')
    setInstMetrics(Object.fromEntries(CRITERIA_KEYS.map(k => [k, 5])))
    setInstReviewComment('')

    setTimeout(() => navigate('institution'), 1200)
  }

  return (
    <div className="flex flex-col gap-2xl max-w-2xl mx-auto">
      {renderBreadcrumb()}
      <div className="flex flex-col gap-xs">
        <h1 className="text-title text-text-primary">Đánh giá {selectedInst.name}</h1>
        <p className="text-label-sm text-text-secondary">{selectedInst.location}</p>
      </div>

      <form onSubmit={handleSub} className="flex flex-col gap-xl">
        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
          <InputField
            label="Tên hiển thị (Tùy chọn)"
            placeholder="VD: Cựu sinh viên..."
            value={instAuthorName}
            onChange={setInstAuthorName}
          />
        </div>
        {CRITERIA_KEYS.map(criteria => (
          <div key={criteria} className="glass-panel rounded-3xl p-xl">
            <RatingSelector
              label={`${criteria} *`}
              value={instMetrics[criteria]}
              onChange={val => setInstMetrics(prev => ({ ...prev, [criteria]: val }))}
              lowLabel="1 - Rất tệ"
              highLabel="5 - Tuyệt vời"
            />
          </div>
        ))}

        <div className="glass-panel rounded-3xl p-xl">
          <TextareaField
            label="Nhận xét chi tiết *"
            placeholder="Chia sẻ trải nghiệm thực tế tại trường..."
            rows={4}
            value={instReviewComment}
            onChange={setInstReviewComment}
          />
        </div>

        <ButtonGroup align="justify">
          <Button variant="neutral" onClick={() => navigate('institution')}>Hủy</Button>
          <Button variant="primary" type="submit">Gửi đánh giá</Button>
        </ButtonGroup>
      </form>
    </div>
  )
}
