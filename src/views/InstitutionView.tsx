import React, { useState, useMemo } from 'react'
import { MapPin, Share2, ChevronRight } from 'lucide-react'
import { Institution, Professor, InstitutionReview, InstStats } from '../types'
import { CRITERIA_KEYS } from '../constants'
import {
  Button,
  ButtonGroup,
  Badge,
  ScoreBadge,
  SearchableDropdown,
  VoteFooter,
  reviewAvg,
  barColorClass,
} from '../components/ui/UIComponents'
import { InstitutionDetailsSkeleton } from '../components/Skeletons'

interface InstitutionViewProps {
  isLoadingData: boolean
  selectedInst: Institution | null
  professors: Professor[]
  instReviews: InstitutionReview[]
  calculateInstStats: (inst_id: number) => InstStats
  handleInstVote: (id: string, vote: 'helpful' | 'not_helpful') => Promise<void>
  navigate: (view: string, inst?: Institution, dept?: string, prof?: Professor) => void
  renderBreadcrumb: () => React.ReactNode
  onOpenCompare: () => void
  showToast: (message: string, variant?: 'default' | 'success' | 'error') => void
}

export const InstitutionView: React.FC<InstitutionViewProps> = ({
  isLoadingData,
  selectedInst,
  professors,
  instReviews,
  calculateInstStats,
  handleInstVote,
  navigate,
  renderBreadcrumb,
  onOpenCompare,
  showToast,
}) => {
  const [instSort, setInstSort] = useState('newest')

  if (isLoadingData || !selectedInst) {
    return <InstitutionDetailsSkeleton />
  }

  const stats = calculateInstStats(selectedInst.id)
  
  const reviews = useMemo(() => {
    const list = instReviews.filter(r => r.inst_id === selectedInst.id)

    if (instSort === 'highest-rating') {
      list.sort((a, b) => reviewAvg(b.metrics || {}) - reviewAvg(a.metrics || {}))
    } else if (instSort === 'lowest-rating') {
      list.sort((a, b) => reviewAvg(a.metrics || {}) - reviewAvg(b.metrics || {}))
    } else if (instSort === 'helpful') {
      list.sort((a, b) => {
        const scoreA = (a.helpful || 0) - (a.not_helpful || 0)
        const scoreB = (b.helpful || 0) - (b.not_helpful || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return (b.helpful || 0) - (a.helpful || 0)
      })
    } else if (instSort === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return list
  }, [instReviews, selectedInst.id, instSort])

  const leftCriteria = CRITERIA_KEYS.slice(0, 5)
  const rightCriteria = CRITERIA_KEYS.slice(5)

  return (
    <div className="flex flex-col gap-2xl">
      {renderBreadcrumb()}

      <div className="glass-panel rounded-3xl p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
        <div className="flex flex-col items-start gap-1.5">
          <Badge label={selectedInst.short_name} variant="brand" />
          <h1 className="text-title text-text-primary">{selectedInst.name}</h1>
          <p className="text-label-sm text-text-secondary flex items-center gap-xs">
            <MapPin size={13} /> {selectedInst.location}
          </p>
        </div>
        <ButtonGroup align="end">
          <Button
            variant="neutral"
            size="small"
            iconStart={<Share2 size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              showToast('Đã sao chép liên kết!', 'success')
            }}
          >
            Chia sẻ
          </Button>
          <Button
            variant="neutral"
            size="small"
            onClick={onOpenCompare}
          >
            So sánh
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() => navigate('add-inst-review')}
          >
            Đánh giá
          </Button>
        </ButtonGroup>
      </div>

      <div className="glass-panel rounded-3xl p-2xl grid grid-cols-1 lg:grid-cols-3 gap-xl items-center">
        <div className="flex flex-col items-center justify-center p-xl">
          <span className="text-[56px] font-semibold text-text-primary leading-none">{stats.overall > 0 ? stats.overall.toFixed(1) : '0.0'}</span>
          <span className="text-label-sm text-text-secondary font-medium mt-xs">trên 5 ({stats.total} đánh giá)</span>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-xl">
          <div className="flex flex-col gap-lg">
            {leftCriteria.map(key => {
              const val = parseFloat(stats.metricsAvg[key] || '0')
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-label-sm text-text-secondary">{key}</span>
                  <ScoreBadge value={val} />
                </div>
              )
            })}
          </div>
          <div className="flex flex-col gap-lg">
            {rightCriteria.map(key => {
              const val = parseFloat(stats.metricsAvg[key] || '0')
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-label-sm text-text-secondary">{key}</span>
                  <ScoreBadge value={val} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-lg relative z-10">
        <h2 className="text-xl font-semibold text-text-primary text-slate-900 dark:text-slate-50 leading-tight">Khoa / Viện trực thuộc</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {selectedInst.departments?.map((dept, idx) => {
            const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === dept)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => navigate('department', selectedInst, dept)}
                className="glass-panel glass-panel-interactive rounded-3xl p-5 sm:p-6 text-left flex flex-col h-full transition-all group animate-slideInLeft cursor-pointer active:scale-[0.99]"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex flex-col gap-1.5 mb-5">
                  <h3 className="text-label font-semibold text-text-primary group-hover:text-brand-primary transition-colors">{dept}</h3>
                  <p className="text-video-title text-text-secondary">{deptProfs.length} giảng viên</p>
                </div>
                <div className="mt-auto flex items-center justify-end text-brand-primary">
                  <ChevronRight size={16} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-lg relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-text-primary text-slate-900 dark:text-slate-50 leading-tight">Đánh giá cơ sở</h2>
            <Badge label={`${stats.total} đánh giá`} variant="default" />
          </div>

          {instReviews.filter(r => r.inst_id === selectedInst.id).length > 0 && (
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">Sắp xếp:</span>
              <div className="w-48 sm:w-52">
                <SearchableDropdown
                  compact
                  options={[
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'highest-rating', label: 'Đánh giá cao nhất' },
                    { value: 'lowest-rating', label: 'Đánh giá thấp nhất' },
                    { value: 'helpful', label: 'Hữu ích nhất' },
                    { value: 'oldest', label: 'Cũ nhất' },
                  ]}
                  value={instSort}
                  onChange={(v: any) => setInstSort(v)}
                  placeholder="Sắp xếp"
                />
              </div>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="glass-panel rounded-3xl p-2xl text-center border-border-secondary" style={{ borderStyle: 'dashed' }}>
            <p className="text-label text-text-secondary">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          reviews.map(rev => {
            const revScore = reviewAvg(rev.metrics || {})
            return (
              <div key={rev.id} className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-text-primary">{rev.author_name || 'Người dùng ẩn danh'}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/35 dark:bg-white/[0.05] backdrop-blur-xs rounded-xl px-3 py-1 border border-black/[0.06] dark:border-white/[0.1] shadow-xs">
                    <span className={`text-base font-bold leading-none ${revScore >= 4 ? 'text-emerald-500 dark:text-emerald-400' : revScore >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500'}`}>
                      {revScore.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-text-tertiary font-medium">/ 5</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-text-primary">{rev.comment}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-3 sm:p-3.5 glass-panel rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  {Object.entries(rev.metrics || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-0.5 px-0.5">
                      <span className="text-xs font-medium text-text-secondary">{key}</span>
                      <div className="flex gap-1 items-center">
                        {[1, 2, 3, 4, 5].map(s => (
                          <div key={s} className={`h-1.5 w-4 rounded-full transition-all ${s <= Number(val) ? barColorClass(Number(val)) : 'bg-black/10 dark:bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <VoteFooter review={rev} onVote={handleInstVote} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
