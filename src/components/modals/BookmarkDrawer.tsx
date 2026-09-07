import React from 'react'
import { Bookmark, BookmarkCheck, X } from 'lucide-react'
import { Avatar } from '@figma/astraui'
import { Skeleton } from '../Skeletons'
import { Professor, Institution, ProfStats } from '../../types'

interface BookmarkDrawerProps {
  isOpen: boolean
  onClose: () => void
  bookmarkedProfIds: number[]
  professors: Professor[]
  institutions: Institution[]
  isLoadingData: boolean
  calculateProfStats: (id: number) => ProfStats
  toggleBookmark: (id: number) => void
  navigate: (view: string, inst?: Institution, dept?: string, prof?: Professor) => void
}

export const BookmarkDrawer: React.FC<BookmarkDrawerProps> = ({
  isOpen,
  onClose,
  bookmarkedProfIds,
  professors,
  institutions,
  isLoadingData,
  calculateProfStats,
  toggleBookmark,
  navigate,
}) => {
  return (
    <>
      {/* Desktop Bookmark Panel */}
      <div className={`hidden md:flex flex-col glass-bar border-r border-black/[0.06] dark:border-white/[0.1] shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${isOpen ? 'w-72' : 'w-0'}`}>
        <div className="p-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/40 dark:bg-black/20">
          <h2 className="text-label text-text-primary dark:text-slate-50 font-semibold flex items-center gap-sm">
            <BookmarkCheck size={14} className="text-brand-primary" />
            Đã lưu ({bookmarkedProfIds.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách đã lưu"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 text-text-secondary hover:text-text-primary transition-all duration-300 border border-black/5 dark:border-white/10 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-xs">
          {isLoadingData && bookmarkedProfIds.length > 0 ? (
            Array.from({ length: Math.min(bookmarkedProfIds.length, 3) }).map((_, i) => (
              <div key={i} className="flex items-center gap-md p-md rounded-2xl">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="w-28 h-4 rounded-md" />
                  <Skeleton className="w-20 h-3 rounded-md" />
                </div>
              </div>
            ))
          ) : bookmarkedProfIds.length === 0 ? (
            <div className="p-xl text-center mt-4xl">
              <Bookmark size={32} className="text-text-tertiary mx-auto mb-md opacity-50" />
              <p className="text-label-sm text-text-tertiary">Chưa lưu giảng viên nào</p>
              <p className="text-video-title text-text-tertiary mt-xs">Nhấn biểu tượng bookmark trên trang giảng viên để lưu</p>
            </div>
          ) : (
            bookmarkedProfIds.map(id => {
              const prof = professors.find(p => p.id === id)
              if (!prof) return null
              const inst = institutions.find(i => i.name === prof.university)
              const stats = calculateProfStats(prof.id)
              return (
                <div key={id} className="group flex items-start gap-sm p-md rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => {
                      if (inst) {
                        navigate('professor', inst, prof.department, prof)
                        onClose()
                      }
                    }}
                    className="flex items-start gap-md flex-1 min-w-0 text-left"
                  >
                    <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                    <div className="flex-1 min-w-0">
                      <p className="text-label-sm text-text-primary leading-tight line-clamp-2">{prof.name}</p>
                      <p className="text-video-title text-text-secondary line-clamp-1">{prof.department}</p>
                      {stats.avg_rating > 0 && (
                        <p className="text-video-title text-brand-primary mt-xs font-medium">{stats.avg_rating.toFixed(1)} ★</p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(id)}
                    className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all shrink-0 p-xs cursor-pointer"
                    title="Xóa bookmark"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Mobile bookmark sheet */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50 dark:bg-black/80 transition-opacity" onClick={onClose} />
          <div className="glass-flyout rounded-t-3xl border-t border-black/[0.06] dark:border-white/[0.1] max-h-[70vh] flex flex-col animate-slideInLeft">
            <div className="p-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-label text-text-primary dark:text-slate-50 font-semibold flex items-center gap-sm">
                <BookmarkCheck size={14} className="text-brand-primary" />
                Giảng viên đã lưu ({bookmarkedProfIds.length})
              </h2>
              <button 
                type="button" 
                onClick={onClose} 
                aria-label="Đóng danh sách đã lưu"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 text-text-secondary hover:text-text-primary transition-all duration-300 border border-black/5 dark:border-white/10 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-xs">
              {bookmarkedProfIds.length === 0 ? (
                <div className="p-2xl text-center">
                  <Bookmark size={28} className="text-text-tertiary mx-auto mb-sm" />
                  <p className="text-label-sm text-text-tertiary">Chưa lưu giảng viên nào</p>
                </div>
              ) : (
                bookmarkedProfIds.map(id => {
                  const prof = professors.find(p => p.id === id)
                  if (!prof) return null
                  const inst = institutions.find(i => i.name === prof.university)
                  const stats = calculateProfStats(prof.id)
                  return (
                    <div key={id} className="group flex items-start gap-sm p-sm rounded-corner-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <button
                        type="button"
                        onClick={() => {
                          if (inst) {
                            navigate('professor', inst, prof.department, prof)
                            onClose()
                          }
                        }}
                        className="flex items-start gap-sm flex-1 min-w-0 text-left"
                      >
                        <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                        <div className="flex-1 min-w-0">
                          <p className="text-label-sm text-text-primary leading-tight">{prof.name}</p>
                          <p className="text-video-title text-text-secondary">{prof.department}</p>
                          {stats.avg_rating > 0 && <p className="text-video-title text-brand-primary">{stats.avg_rating.toFixed(1)} ★</p>}
                        </div>
                      </button>
                      <button type="button" onClick={() => toggleBookmark(id)} className="text-text-tertiary hover:text-danger transition-colors mt-xs shrink-0 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
