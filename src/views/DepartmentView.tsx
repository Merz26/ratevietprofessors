import React, { useState, useEffect, useRef, useMemo, memo } from 'react'
import { Plus, Search, Bookmark, BookmarkCheck, X } from 'lucide-react'
import { Avatar } from '@figma/astraui'
import { Institution, Professor, ProfStats } from '../types'
import { Button, ScoreBadge } from '../components/ui/UIComponents'
import DebouncedInput from '../components/DebouncedInput'
import { DepartmentDetailsSkeleton } from '../components/Skeletons'

interface DepartmentProfCardProps {
  prof: Professor
  stats: ProfStats
  isBookmarked: boolean
  idx: number
  onNavigate: () => void
  onToggleBookmark: (e: React.MouseEvent) => void
}

const DepartmentProfCard = memo<DepartmentProfCardProps>(({
  prof,
  stats,
  isBookmarked,
  idx,
  onNavigate,
  onToggleBookmark,
}) => {
  return (
    <div
      className="glass-panel glass-panel-interactive rounded-3xl p-xl text-left flex flex-col h-full"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <button
        type="button"
        onClick={onNavigate}
        className="flex flex-col h-full text-left w-full cursor-pointer"
      >
        <div className="flex items-start justify-between gap-lg w-full mb-lg">
          <div className="flex items-center gap-lg">
            <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="medium" shape="circle" />
            <div>
              <h3 className="text-label text-text-primary font-semibold">{prof.name}</h3>
              <p className="text-video-title text-text-secondary font-medium">{stats.total_ratings} đánh giá</p>
            </div>
          </div>
          
          <div className="flex items-center gap-sm z-10">
            <ScoreBadge value={stats.avg_rating} />
            <div
              role="button"
              onClick={onToggleBookmark}
              className={`p-1 cursor-pointer transition-colors ${isBookmarked ? 'text-brand-primary' : 'text-text-tertiary hover:text-brand-primary'}`}
              title={isBookmarked ? 'Xóa bookmark' : 'Lưu giảng viên'}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-xl pt-lg border-t border-border-secondary w-full">
          <div>
            <p className="text-video-title text-text-tertiary uppercase">Độ khó</p>
            <p className="text-label-sm text-text-primary font-medium">{stats.avg_difficulty > 0 ? stats.avg_difficulty.toFixed(1) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-video-title text-text-tertiary uppercase">Học lại</p>
            <p className="text-label-sm text-text-primary font-medium">{stats.would_take_again_pct}%</p>
          </div>
        </div>
      </button>
    </div>
  )
})

interface DepartmentViewProps {
  isLoadingData: boolean
  selectedInst: Institution | null
  selectedDept: string | null
  professors: Professor[]
  bookmarkedProfIds: number[]
  calculateProfStats: (prof_id: number) => ProfStats
  toggleBookmark: (profId: number) => void
  navigate: (view: string, inst?: Institution, dept?: string, prof?: Professor) => void
  renderBreadcrumb: () => React.ReactNode
}

export const DepartmentView: React.FC<DepartmentViewProps> = ({
  isLoadingData,
  selectedInst,
  selectedDept,
  professors,
  bookmarkedProfIds,
  calculateProfStats,
  toggleBookmark,
  navigate,
  renderBreadcrumb,
}) => {
  const [deptSearchTerm, setDeptSearchTerm] = useState('')
  const deptSearchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard navigation on DepartmentView
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Esc: blur search or clear if focused
      if (e.key === 'Escape') {
        if (document.activeElement === deptSearchInputRef.current) {
          e.preventDefault()
          deptSearchInputRef.current?.blur()
        }
        return
      }

      // 2. Ctrl+K or Cmd+K
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'

      // 3. '/' key when not inside an editable field
      const activeEl = document.activeElement
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.getAttribute('contenteditable') === 'true'
      )
      const isSlash = e.key === '/' && !isTyping

      if (isCmdK || isSlash) {
        e.preventDefault()
        deptSearchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        deptSearchInputRef.current?.focus()
        deptSearchInputRef.current?.select()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isLoadingData || !selectedInst || !selectedDept) {
    return <DepartmentDetailsSkeleton />
  }

  const deptProfs = useMemo(() => {
    return professors.filter(p => p.university === selectedInst.name && p.department === selectedDept)
  }, [professors, selectedInst.name, selectedDept])

  const filtered = useMemo(() => {
    const term = deptSearchTerm.trim().toLowerCase()
    return deptProfs.filter(p => p.name.toLowerCase().includes(term))
  }, [deptProfs, deptSearchTerm])

  return (
    <div className="flex flex-col gap-2xl">
      {renderBreadcrumb()}

      <div className="glass-panel rounded-3xl p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
        <div className="flex flex-col gap-xs">
          <p className="text-label-sm text-text-secondary">{selectedInst.name}</p>
          <h1 className="text-title text-text-primary">{selectedDept}</h1>
          <p className="text-label-sm text-text-secondary">{deptProfs.length} giảng viên</p>
        </div>
        <Button
          variant="neutral"
          size="small"
          iconStart={<Plus size={16} />}
          onClick={() => navigate('suggest')}
        >
          Thêm giảng viên
        </Button>
      </div>

      <div className="glass-panel rounded-3xl p-xl">
        <div className="relative flex items-center gap-md glass-search shadow-sm rounded-2xl focus-within:border-brand-primary transition-colors px-xl">
          <Search size={18} className="text-text-secondary shrink-0" />
          <DebouncedInput
            ref={deptSearchInputRef}
            id="dept-search-input"
            type="text"
            value={deptSearchTerm}
            placeholder="Tìm kiếm giảng viên..."
            onChange={val => setDeptSearchTerm(val)}
            className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full placeholder:text-text-tertiary"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {deptSearchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setDeptSearchTerm('')
                  deptSearchInputRef.current?.focus()
                }}
                aria-label="Xóa tìm kiếm"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 shrink-0 select-none pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-medium rounded-md border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] text-text-tertiary shadow-2xs">
                  Ctrl+K
                </kbd>
                <span className="text-text-tertiary text-[11px]">/</span>
                <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-medium rounded-md border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] text-text-tertiary shadow-2xs">
                  /
                </kbd>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-lg px-1">
          <p className="text-label-sm text-text-secondary font-medium">
            <span className="text-text-primary font-semibold">{filtered.length}</span> giảng viên {deptSearchTerm ? `phù hợp với "${deptSearchTerm}"` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {filtered.length === 0 ? (
            <div className="col-span-2 glass-panel rounded-3xl p-2xl text-center">
              <p className="text-label text-text-secondary">Không tìm thấy giảng viên</p>
            </div>
          ) : (
            filtered.map((prof, idx) => (
              <DepartmentProfCard
                key={prof.id}
                prof={prof}
                stats={calculateProfStats(prof.id)}
                isBookmarked={bookmarkedProfIds.includes(prof.id)}
                idx={idx}
                onNavigate={() => navigate('professor', selectedInst, selectedDept, prof)}
                onToggleBookmark={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleBookmark(prof.id)
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
