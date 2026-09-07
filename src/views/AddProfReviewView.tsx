import React, { useState, type FormEvent } from 'react'
import { InputField, TextareaField } from '@figma/astraui'
import { Professor, ProfessorReview, Institution } from '../types'
import { GRADE_OPTIONS, PROF_TAGS } from '../constants'
import {
  Button,
  ButtonGroup,
  RatingSelector,
  SearchableDropdown,
} from '../components/ui/UIComponents'
import { supabase } from '../supabaseClient'

interface AddProfReviewViewProps {
  selectedProf: Professor | null
  onReviewAdded: (newReview: ProfessorReview) => void
  navigate: (view: string, inst?: Institution, dept?: string, prof?: Professor) => void
  renderBreadcrumb: () => React.ReactNode
  showToast: (message: string, variant?: 'default' | 'success' | 'error') => void
}

export const AddProfReviewView: React.FC<AddProfReviewViewProps> = ({
  selectedProf,
  onReviewAdded,
  navigate,
  renderBreadcrumb,
  showToast,
}) => {
  const [reviewAuthorName, setReviewAuthorName] = useState('')
  const [reviewCourse, setReviewCourse] = useState('')
  const [reviewTeaching, setReviewTeaching] = useState(5)
  const [reviewDifficulty, setReviewDifficulty] = useState(3)
  const [reviewWouldTakeAgain, setReviewWouldTakeAgain] = useState(true)
  const [reviewForCredit, setReviewForCredit] = useState('Có')
  const [reviewTextbook, setReviewTextbook] = useState('Không')
  const [reviewAttendance, setReviewAttendance] = useState('Có')
  const [reviewGrade, setReviewGrade] = useState('A')
  const [reviewSelectedTags, setReviewSelectedTags] = useState<string[]>([])
  const [reviewComment, setReviewComment] = useState('')

  if (!selectedProf) return null

  const handleSub = async (e: FormEvent) => {
    e.preventDefault()
    if (!reviewCourse.trim() || !reviewComment.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error')
      return
    }

    const finalName = reviewAuthorName.trim() || 'Ẩn danh'

    const newRev = {
      prof_id: selectedProf.id, 
      author_name: finalName,
      course: reviewCourse.trim(),
      teaching_rating: reviewTeaching,
      difficulty_rating: reviewDifficulty,
      would_take_again: reviewWouldTakeAgain,
      for_credit: reviewForCredit,
      textbook: reviewTextbook,
      attendance: reviewAttendance,
      grade: reviewGrade,
      tags: reviewSelectedTags,
      comment: reviewComment.trim(),
      helpful: 0,
      not_helpful: 0,
    }

    const { data, error } = await supabase.from('professor_reviews').insert([newRev]).select() as any
    if (error) {
      showToast(error.message, 'error')
      return
    }
    if (data) {
      onReviewAdded({ ...data[0], userVote: null } as ProfessorReview)
    }
    showToast('Đánh giá đã được gửi thành công!', 'success')
    
    // Reset form
    setReviewAuthorName('')
    setReviewCourse('')
    setReviewTeaching(5)
    setReviewDifficulty(3)
    setReviewWouldTakeAgain(true)
    setReviewForCredit('Có')
    setReviewTextbook('Không')
    setReviewAttendance('Có')
    setReviewGrade('A')
    setReviewSelectedTags([])
    setReviewComment('')

    setTimeout(() => navigate('professor'), 1200)
  }

  return (
    <div className="flex flex-col gap-2xl max-w-2xl mx-auto">
      {renderBreadcrumb()}

      <div className="flex flex-col gap-xs">
        <h1 className="text-title text-text-primary">Đánh giá {selectedProf.name}</h1>
        <p className="text-label-sm text-text-secondary">{selectedProf.department} • {selectedProf.university}</p>
      </div>

      <form onSubmit={handleSub} className="flex flex-col gap-xl">
        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
          <InputField
            label="Tên hiển thị (Tùy chọn)"
            placeholder="VD: Sinh viên năm 3..."
            value={reviewAuthorName}
            onChange={setReviewAuthorName}
          />
          <InputField
            label="Mã môn học *"
            placeholder="VD: CS101, MTH201..."
            value={reviewCourse}
            onChange={setReviewCourse}
          />
        </div>

        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-xl">
          <RatingSelector label="Đánh giá giảng viên *" value={reviewTeaching} onChange={setReviewTeaching} lowLabel="1 - Rất tệ" highLabel="5 - Tuyệt vời" />
          <RatingSelector label="Độ khó môn học *" value={reviewDifficulty} onChange={setReviewDifficulty} lowLabel="1 - Rất dễ" highLabel="5 - Rất khó" />
        </div>

        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
          <div>
            <p className="text-label text-text-primary mb-lg">Bạn có muốn học lại không?</p>
            <div className="flex gap-md">
              <Button variant={reviewWouldTakeAgain ? 'primary' : 'neutral'} onClick={() => setReviewWouldTakeAgain(true)}>Có</Button>
              <Button variant={!reviewWouldTakeAgain ? 'primary' : 'neutral'} onClick={() => setReviewWouldTakeAgain(false)}>Không</Button>
            </div>
          </div>

          {[
            { label: 'Môn học tính tín chỉ?', value: reviewForCredit, set: setReviewForCredit, opts: ['Có', 'Không'] },
            { label: 'Giáo viên dùng giáo trình?', value: reviewTextbook, set: setReviewTextbook, opts: ['Có', 'Không'] },
            { label: 'Điểm danh bắt buộc?', value: reviewAttendance, set: setReviewAttendance, opts: ['Có', 'Không'] },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-label-sm text-text-primary">{label}</span>
              <div className="flex gap-sm">
                {opts.map(opt => (
                  <Button key={opt} size="small" variant={value === opt ? 'primary' : 'neutral'} onClick={() => set(opt)}>{opt}</Button>
                ))}
              </div>
            </div>
          ))}

          <SearchableDropdown
            label="Điểm số đạt được"
            options={GRADE_OPTIONS.map(g => ({ value: g, label: g }))}
            value={reviewGrade}
            onChange={setReviewGrade}
            placeholder="-- Chọn điểm --"
          />
        </div>

        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
          <p className="text-label text-text-primary font-medium">Chọn tối đa 3 thẻ đặc điểm</p>
          <div className="flex flex-wrap gap-sm">
            {PROF_TAGS.map(t => {
              const sel = reviewSelectedTags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (sel) setReviewSelectedTags(prev => prev.filter(x => x !== t))
                    else if (reviewSelectedTags.length < 3) setReviewSelectedTags(prev => [...prev, t])
                  }}
                  className={`h-8 px-3.5 rounded-full text-label-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer border ${
                    sel
                      ? 'bg-brand-primary text-on-brand border-brand-primary/30 shadow-[0_2px_8px_rgba(20,90,220,0.25)]'
                      : 'bg-white/35 dark:bg-gray-900/40 backdrop-blur-xs border-black/[0.08] dark:border-white/[0.12] text-text-primary hover:bg-white/55 dark:hover:bg-gray-800/60'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-xl">
          <TextareaField
            label="Nhận xét chi tiết *"
            placeholder="Bạn muốn sinh viên khác biết điều gì về giảng viên này?"
            rows={4}
            value={reviewComment}
            onChange={setReviewComment}
          />
        </div>

        <ButtonGroup align="justify">
          <Button variant="neutral" onClick={() => navigate('professor')}>Hủy</Button>
          <Button variant="primary" type="submit">Gửi đánh giá</Button>
        </ButtonGroup>
      </form>
    </div>
  )
}
