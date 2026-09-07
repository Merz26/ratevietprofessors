import React, { useState } from 'react'
import {
  Share2,
  GitCompare,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { Avatar } from '@figma/astraui'
import { Institution, Professor, ProfessorReview, ProfStats } from '../types'
import {
  Button,
  Badge,
  ScoreBadge,
  SearchableDropdown,
  VoteFooter,
  barColorClass,
} from '../components/ui/UIComponents'
import { ProfessorDetailsSkeleton } from '../components/Skeletons'

interface ProfessorViewProps {
  isLoadingData: boolean
  selectedInst: Institution | null
  selectedDept: string | null
  selectedProf: Professor | null
  professors: Professor[]
  profReviews: ProfessorReview[]
  bookmarkedProfIds: number[]
  calculateProfStats: (prof_id: number) => ProfStats
  toggleBookmark: (profId: number) => void
  handleProfVote: (id: string, vote: 'helpful' | 'not_helpful') => Promise<void>
  navigate: (view: string, inst?: Institution, dept?: string, prof?: Professor) => void
  renderBreadcrumb: () => React.ReactNode
  onOpenCompare: () => void
  showToast: (message: string, variant?: 'default' | 'success' | 'error') => void
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({
  isLoadingData,
  selectedInst,
  selectedDept,
  selectedProf,
  professors,
  profReviews,
  bookmarkedProfIds,
  calculateProfStats,
  toggleBookmark,
  handleProfVote,
  navigate,
  renderBreadcrumb,
  onOpenCompare,
  showToast,
}) => {
  const [profSort, setProfSort] = useState('newest')
  const [profTagFilter, setProfTagFilter] = useState('all')

  if (isLoadingData || !selectedProf || !selectedInst) {
    return <ProfessorDetailsSkeleton />
  }

  const stats = calculateProfStats(selectedProf.id)
  let reviews = profReviews.filter(r => r.prof_id === selectedProf.id)

  if (profSort === 'highest-quality') reviews.sort((a, b) => b.teaching_rating - a.teaching_rating)
  else if (profSort === 'lowest-quality') reviews.sort((a, b) => a.teaching_rating - b.teaching_rating)
  else if (profSort === 'highest-difficulty') reviews.sort((a, b) => b.difficulty_rating - a.difficulty_rating)
  else if (profSort === 'helpful') {
    reviews.sort((a, b) => {
      const scoreA = (a.helpful || 0) - (a.not_helpful || 0)
      const scoreB = (b.helpful || 0) - (b.not_helpful || 0)
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.helpful || 0) - (a.helpful || 0)
    })
  }
  else if (profSort === 'oldest') reviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (profTagFilter !== 'all') reviews = reviews.filter(r => r.tags?.includes(profTagFilter))

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => { const rating = Math.round(r.teaching_rating); if (rating >= 1 && rating <= 5) distribution[rating]++ })
  const maxDist = Math.max(...Object.values(distribution), 1)

  const isBookmarked = bookmarkedProfIds.includes(selectedProf.id)

  return (
    <div className="flex flex-col gap-2xl">
      {renderBreadcrumb()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        <div className="glass-panel rounded-3xl p-2xl flex flex-col gap-xl relative">
          {/* Top Right Corner Save / Bookmark Button */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10">
            <button
              type="button"
              onClick={() => toggleBookmark(selectedProf.id)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs font-semibold backdrop-blur-xs border transition-all duration-300 active:scale-95 cursor-pointer select-none shadow-xs ${
                isBookmarked
                  ? 'bg-brand-primary text-white border-brand-primary shadow-brand-primary/25 hover:bg-brand-hover'
                  : 'bg-white/25 dark:bg-white/[0.04] text-text-primary hover:text-brand-primary hover:bg-white/45 dark:hover:bg-white/[0.08] border-black/[0.08] dark:border-white/[0.12]'
              }`}
              title={isBookmarked ? 'Xóa khỏi danh sách đã lưu' : 'Lưu giảng viên'}
              aria-label="Lưu giảng viên"
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck size={16} className="text-white shrink-0" />
                  <span>Đã lưu</span>
                </>
              ) : (
                <>
                  <Bookmark size={16} className="shrink-0 text-text-secondary" />
                  <span>Lưu</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-xs pr-28">
            <span className="text-[48px] font-semibold text-text-primary leading-none">
              {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '0.0'}
            </span>
            <p className="text-label-sm text-text-secondary font-medium">Dựa trên {stats.total_ratings} đánh giá</p>
          </div>

          <div className="flex items-center gap-lg">
            <Avatar type="initial" initials={selectedProf.name.split(' ').pop()?.charAt(0) || 'P'} size="large" shape="circle" />
            <div>
              <h1 className="text-title text-text-primary">{selectedProf.name}</h1>
              <p className="text-label-sm text-text-secondary">{selectedProf.department} • {selectedProf.university}</p>
            </div>
          </div>

          <div className="flex gap-2xl py-lg border-y border-border-secondary">
            <div>
              <p className="text-[28px] font-semibold text-text-primary leading-none">{stats.would_take_again_pct}%</p>
              <p className="text-video-title text-text-tertiary uppercase mt-xs">Sẽ học tiếp</p>
            </div>
            <div className="w-px bg-border-secondary" />
            <div>
              <p className="text-[28px] font-semibold text-text-primary leading-none">{stats.avg_difficulty > 0 ? stats.avg_difficulty.toFixed(1) : '0.0'}</p>
              <p className="text-video-title text-text-tertiary uppercase mt-xs">Độ khó</p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border-secondary flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2.5">
              <Button
                variant="neutral"
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
                iconStart={<GitCompare size={16} />}
                onClick={onOpenCompare}
              >
                So sánh
              </Button>
            </div>
            <Button
              variant="primary"
              iconEnd={<ChevronRight size={16} />}
              onClick={() => navigate('add-prof-review')}
            >
              Đánh giá giảng viên
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-xl">
          <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
            <h3 className="text-label text-text-primary font-semibold">Tổng hợp đánh giá</h3>
            {([5, 4, 3, 2, 1] as const).map(star => (
              <div key={star} className="flex items-center gap-lg">
                <span className="text-label-sm text-text-secondary w-20 shrink-0">{star} sao</span>
                <div className="flex-1 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColorClass(star)}`}
                    style={{ width: `${(distribution[star] / maxDist) * 100}%` }}
                  />
                </div>
                <span className="text-video-title text-text-secondary w-4 text-right">{distribution[star]}</span>
              </div>
            ))}
          </div>

          {selectedProf.tags && selectedProf.tags.length > 0 && (
            <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
              <h3 className="text-label text-text-primary font-semibold">Đặc điểm nổi bật</h3>
              <div className="flex flex-wrap gap-sm">
                {selectedProf.tags.map(t => (
                  <Badge key={t} label={t} variant="secondary" />
                ))}
              </div>
            </div>
          )}

          {(() => {
            const similarProfs = professors
              .filter(p => p.id !== selectedProf.id && p.university === selectedProf.university)
              .map(p => ({ prof: p, s: calculateProfStats(p.id) }))
              .filter(({ prof, s }) =>
                prof.tags.some(t => selectedProf.tags.includes(t)) ||
                Math.abs(s.avg_rating - stats.avg_rating) <= 0.8
              )
              .slice(0, 3)

            if (similarProfs.length === 0) return null
            return (
              <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
                <h3 className="text-label text-text-primary font-semibold">Giảng viên tương tự</h3>
                {similarProfs.map(({ prof, s }) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => navigate('professor', selectedInst!, selectedDept!, prof)}
                    className="flex items-center justify-between gap-lg hover:bg-black/5 dark:hover:bg-white/5 p-sm rounded-corner-md transition-all duration-200 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-md">
                      <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                      <div>
                        <p className="text-label-sm text-text-primary leading-tight">{prof.name}</p>
                        <p className="text-video-title text-text-secondary">{prof.department}</p>
                      </div>
                    </div>
                    <ScoreBadge value={s.avg_rating} />
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
        <div className="flex flex-col sm:flex-row gap-lg items-start sm:items-center justify-between">
          <div className="flex flex-col gap-sm flex-1">
            <span className="text-label-sm text-text-secondary">Lọc theo thẻ:</span>
            <div className="flex flex-wrap gap-sm">
              <button
                type="button"
                onClick={() => setProfTagFilter('all')}
                className={`h-8 px-3.5 rounded-full text-label-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer border ${
                  profTagFilter === 'all'
                    ? 'bg-brand-primary text-on-brand border-brand-primary/30 shadow-[0_2px_8px_rgba(20,90,220,0.25)]'
                    : 'bg-white/35 dark:bg-gray-900/40 backdrop-blur-xs border-black/[0.08] dark:border-white/[0.12] text-text-primary hover:bg-white/55 dark:hover:bg-gray-800/60'
                }`}
              >
                Tất cả
              </button>
              {(selectedProf.tags || []).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProfTagFilter(t === profTagFilter ? 'all' : t)}
                  className={`h-8 px-3.5 rounded-full text-label-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer border ${
                    profTagFilter === t
                      ? 'bg-brand-primary text-on-brand border-brand-primary/30 shadow-[0_2px_8px_rgba(20,90,220,0.25)]'
                      : 'bg-white/35 dark:bg-gray-900/40 backdrop-blur-xs border-black/[0.08] dark:border-white/[0.12] text-text-primary hover:bg-white/55 dark:hover:bg-gray-800/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-medium text-text-secondary whitespace-nowrap">Sắp xếp:</span>
            <div className="w-48 sm:w-52">
              <SearchableDropdown
                compact
                options={[
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'highest-quality', label: 'Chất lượng cao nhất' },
                  { value: 'lowest-quality', label: 'Chất lượng thấp nhất' },
                  { value: 'highest-difficulty', label: 'Độ khó cao nhất' },
                  { value: 'helpful', label: 'Hữu ích nhất' },
                  { value: 'oldest', label: 'Cũ nhất' },
                ]}
                value={profSort}
                onChange={setProfSort}
                placeholder="Sắp xếp"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-3">
          <h2 className="text-heading text-text-primary">Đánh giá từ sinh viên</h2>
          <Badge label={`${reviews.length} đánh giá`} variant="default" />
        </div>
        {reviews.length === 0 ? (
          <div className="glass-panel rounded-3xl p-2xl text-center border-border-secondary" style={{ borderStyle: 'dashed' }}>
            <p className="text-label text-text-secondary">Không có đánh giá phù hợp với bộ lọc</p>
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{rev.author_name || 'Người dùng ẩn danh'}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white/35 dark:bg-white/[0.05] backdrop-blur-xs border border-black/[0.06] dark:border-white/[0.1] rounded-xl px-2.5 py-1 text-center min-w-[56px] shadow-xs">
                      <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Chất lượng</p>
                      <p className={`text-sm font-bold leading-tight mt-0.5 ${rev.teaching_rating >= 4 ? 'text-emerald-500 dark:text-emerald-400' : rev.teaching_rating >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500'}`}>
                        {rev.teaching_rating.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white/35 dark:bg-white/[0.05] backdrop-blur-xs border border-black/[0.06] dark:border-white/[0.1] rounded-xl px-2.5 py-1 text-center min-w-[56px] shadow-xs">
                      <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Độ khó</p>
                      <p className={`text-sm font-bold leading-tight mt-0.5 ${rev.difficulty_rating >= 4 ? 'text-red-500' : rev.difficulty_rating >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {rev.difficulty_rating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    {rev.course}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  ['Tính điểm', rev.for_credit],
                  ['Học lại', rev.would_take_again ? 'Có' : 'Không'],
                  ['Điểm', rev.grade],
                  ['Giáo trình', rev.textbook],
                ].map(([k, v]) => (
                  <div key={k} className="glass-panel backdrop-blur-sm border border-black/[0.04] dark:border-white/[0.06] rounded-full px-2.5 py-0.5 flex items-center gap-1">
                    <span className="text-xs text-text-tertiary">{k}:</span>
                    <span className="text-xs text-text-primary font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-text-primary">{rev.comment}</p>

              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.tags.map(t => <Badge key={t} label={t} variant="secondary" className="px-2.5 py-0.5 text-xs" />)}
                </div>
              )}

              <VoteFooter review={rev} onVote={handleProfVote} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
