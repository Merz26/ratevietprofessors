import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { InputField } from '@figma/astraui';
import { X, ChevronRight, Star, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { Institution, Professor, InstitutionReview, ProfessorReview, Suggestion } from '../../types';
import { VIETNAM_PROVINCES, PROF_TAGS, CRITERIA_KEYS, GRADE_OPTIONS } from '../../constants';
// ==========================================
// RATING COLOR HELPERS
// ==========================================
const ratingSelectedClass = (n: number): string => {
  const map: Record<number, string> = {
    1: 'bg-red-500 border-red-500 text-white',
    2: 'bg-orange-400 border-orange-400 text-white',
    3: 'bg-yellow-400 border-yellow-400 text-gray-900',
    4: 'bg-lime-500 border-lime-500 text-white',
    5: 'bg-green-500 border-green-500 text-white',
  }
  return map[n] ?? 'bg-brand-primary border-brand-primary text-on-brand'
}

const barColorClass = (v: number): string => {
  if (v >= 4.5) return 'bg-green-500'
  if (v >= 3.5) return 'bg-lime-500'
  if (v >= 2.5) return 'bg-yellow-400'
  if (v >= 1.5) return 'bg-orange-400'
  return 'bg-red-500'
}

export const reviewAvg = (metrics: Record<string, number>): number => {
  const vals = Object.values(metrics)
  if (!vals.length) return 0
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
}

// ==========================================
// BUTTON & BUTTON GROUP
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'neutral' | 'subtle' | 'danger'
  size?: 'small' | 'medium' | 'large'
  iconStart?: React.ReactNode
  iconEnd?: React.ReactNode
  children?: React.ReactNode
}

function Button({
  variant = 'neutral',
  size = 'medium',
  iconStart,
  iconEnd,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium select-none cursor-pointer active:scale-[0.96] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  const sizeClasses = {
    small: 'h-9 px-4 text-xs gap-1.5 rounded-full',
    medium: 'h-11 px-5 text-sm gap-2 rounded-full',
    large: 'h-12 px-7 text-base gap-2.5 rounded-full',
  }[size]

  const variantClasses = {
    primary: 'bg-brand-primary text-on-brand shadow-[0_2px_12px_rgba(20,90,220,0.28)] hover:shadow-[0_4px_20px_rgba(20,90,220,0.38)] hover:brightness-105 border border-brand-primary/20',
    neutral: 'bg-white/55 dark:bg-[#111827]/55 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-white/80 dark:hover:bg-[#111827]/80 text-text-primary',
    subtle: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent',
    danger: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 shadow-sm',
  }[variant]

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {iconStart && <span className="shrink-0 flex items-center">{iconStart}</span>}
      {children && <span className="truncate">{children}</span>}
      {iconEnd && <span className="shrink-0 flex items-center">{iconEnd}</span>}
    </button>
  )
}

function ButtonGroup({
  children,
  align = 'start',
  className = '',
}: {
  children: React.ReactNode
  align?: 'start' | 'end' | 'center' | 'justify'
  className?: string
}) {
  const alignClass = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    justify: 'justify-between w-full',
  }[align]

  return (
    <div className={`flex items-center gap-md flex-wrap ${alignClass} ${className}`}>
      {children}
    </div>
  )
}

// ==========================================
// LIQUID MODAL
// ==========================================
function LiquidModal({ isOpen, onClose, title, children, size = 'small', footer }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-backdropFade">
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />
      <div 
        className={`relative flex flex-col bg-white/75 dark:bg-[#111827]/75 backdrop-blur-3xl border border-black/10 dark:border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.35)] rounded-[28px] animate-scaleIn ${size === 'small' ? 'max-w-md w-full' : 'max-w-2xl w-full'} max-h-[90vh] overflow-hidden`}
        style={{ backdropFilter: 'blur(56px)', WebkitBackdropFilter: 'blur(56px)' }}
      >
        {title ? (
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
             <h2 className="text-base font-semibold text-text-primary">{title}</h2>
             <button 
               type="button" 
               onClick={onClose} 
               aria-label="Đóng"
               className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 text-text-secondary hover:text-text-primary backdrop-blur-md transition-all duration-300 border border-black/5 dark:border-white/10 shrink-0 cursor-pointer"
             >
               <X size={16} />
             </button>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="Đóng"
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 text-text-secondary hover:text-text-primary backdrop-blur-md transition-all duration-300 border border-black/5 dark:border-white/10 z-30 cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function SearchableDropdown({
  options, value, onChange, placeholder, label, disabled, compact = false, size = 'medium', className = ''
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  label?: string
  disabled?: boolean
  compact?: boolean
  size?: 'small' | 'medium'
  className?: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
    placeAbove: boolean
    maxHeight: number
  }>({ top: 0, left: 0, width: 200, placeAbove: false, maxHeight: 260 })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isCompact = compact || size === 'small'
  const showSearchInput = options.length > 6

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()

    // If trigger button is completely scrolled offscreen, close dropdown
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false)
      return
    }

    const spaceBelow = window.innerHeight - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const minHeight = 160

    const placeAbove = spaceBelow < minHeight && spaceAbove > spaceBelow

    const width = Math.max(rect.width, 180)
    let left = rect.left
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - 12 - width)
    }
    if (left < 12) left = 12

    const maxHeight = Math.max(120, placeAbove ? Math.min(280, spaceAbove) : Math.min(280, spaceBelow))
    const top = placeAbove ? rect.top - 6 : rect.bottom + 6

    setCoords({
      top,
      left,
      width,
      placeAbove,
      maxHeight,
    })
  }, [])

  useEffect(() => {
    if (!open) return

    updatePosition()

    const handleScrollOrResize = () => {
      updatePosition()
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, updatePosition])

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && (
        <span className="text-label-sm text-text-secondary">{label}</span>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen(v => !v)
        }}
        className={`flex items-center justify-between transition-all duration-200 select-none ${
          isCompact
            ? 'h-9 px-3.5 bg-white/55 dark:bg-[#111827]/55 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-xs rounded-full text-xs font-medium text-text-primary hover:bg-white/80 dark:hover:bg-[#111827]/80'
            : 'px-xl py-lg bg-white/55 dark:bg-[#111827]/55 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-sm rounded-corner-md text-label text-text-primary hover:bg-white/80 dark:hover:bg-[#111827]/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-primary cursor-pointer active:scale-[0.98]'}`}
      >
        <span className={`truncate mr-2 ${selected ? 'text-text-primary' : 'text-text-tertiary'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronRight
          size={isCompact ? 14 : 16}
          className={`text-text-secondary shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.placeAbove ? undefined : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 999999,
          }}
          className="glass-dropdown rounded-2xl animate-scaleIn overflow-hidden flex flex-col shadow-2xl"
        >
          {showSearchInput && (
            <div className="p-2 border-b border-black/5 dark:border-white/10 bg-transparent shrink-0">
              <InputField
                value={search}
                placeholder="Tìm kiếm..."
                onChange={setSearch}
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto bg-transparent py-1.5 dropdown-scrollbar">
            {filtered.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center p-4">Không tìm thấy kết quả</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`w-full text-left transition-colors cursor-pointer ${
                    isCompact
                      ? 'px-3.5 py-2 text-xs font-medium'
                      : 'px-xl py-lg text-label-sm'
                  } hover:bg-black/5 dark:hover:bg-white/10 ${opt.value === value ? 'text-brand-primary font-semibold bg-brand-primary/10' : 'text-text-primary'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ==========================================
// BADGE & SCORE BADGE
// ==========================================
function Badge({
  label,
  variant = 'default',
  className = '',
}: {
  label: React.ReactNode
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'secondary'
  className?: string
}) {
  const variantStyles = {
    brand: 'bg-brand-primary/15 text-brand-primary border-brand-primary/30 font-semibold shadow-xs',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold shadow-xs',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold shadow-xs',
    danger: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-bold shadow-xs',
    secondary: 'bg-black/5 dark:bg-white/[0.08] text-text-secondary border-black/[0.08] dark:border-white/[0.12] font-medium',
    default: 'bg-black/5 dark:bg-white/[0.08] text-text-primary border-black/[0.08] dark:border-white/[0.12] font-medium',
  }[variant]

  return (
    <span
      className={`inline-flex items-center justify-center w-fit max-w-fit shrink-0 self-start px-3 py-1 text-xs leading-none rounded-full border backdrop-blur-md select-none tracking-tight transition-colors whitespace-nowrap ${variantStyles} ${className}`}
    >
      {label}
    </span>
  )
}

function ScoreBadge({ value, className = '' }: { value: number; className?: string }) {
  if (value === 0) return <Badge label="N/A" variant="default" className={className} />
  const label = value.toFixed(1)
  if (value >= 3.5) return <Badge label={label} variant="success" className={className} />
  if (value >= 2.5) return <Badge label={label} variant="warning" className={className} />
  return <Badge label={label} variant="danger" className={className} />
}

// ==========================================
// RATING SELECTOR
// ==========================================
function RatingSelector({
  label, value, onChange, lowLabel, highLabel,
}: {
  label: string; value: number; onChange: (n: number) => void; lowLabel?: string; highLabel?: string
}) {
  return (
    <div className="flex flex-col gap-sm">
      <span className="text-label text-text-primary font-medium">{label}</span>
      <div className="flex gap-md">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-11 rounded-2xl text-label transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border font-semibold active:scale-95 cursor-pointer ${
              value === n
                ? `${ratingSelectedClass(n)} shadow-[0_2px_12px_rgba(0,0,0,0.15)]`
                : 'bg-white/55 dark:bg-[#111827]/55 backdrop-blur-2xl border-black/[0.08] dark:border-white/[0.12] text-text-primary hover:bg-white/80 dark:hover:bg-[#111827]/80'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-video-title text-text-tertiary px-xs">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  )
}

// ==========================================
// VOTE FOOTER
// ==========================================
function VoteFooter({
  review, onVote,
}: {
  review: { id: string; helpful: number; not_helpful: number; userVote?: 'helpful' | 'not_helpful' | null }
  onVote: (id: string, vote: 'helpful' | 'not_helpful') => void
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3.5 mt-1 border-t border-black/[0.08] dark:border-white/[0.1]">
      <button
        type="button"
        onClick={() => onVote(review.id, 'helpful')}
        className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer border ${
          review.userVote === 'helpful'
            ? 'bg-brand-primary text-on-brand border-brand-primary/30 shadow-[0_2px_8px_rgba(20,90,220,0.25)]'
            : 'bg-white/55 dark:bg-[#111827]/55 backdrop-blur-xl border-black/[0.08] dark:border-white/[0.12] text-text-secondary hover:text-brand-primary hover:bg-white/80 dark:hover:bg-[#111827]/80'
        }`}
      >
        <ThumbsUp size={13} />
        <span>{review.helpful || 0}</span>
      </button>
      <button
        type="button"
        onClick={() => onVote(review.id, 'not_helpful')}
        className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer border ${
          review.userVote === 'not_helpful'
            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 shadow-xs'
            : 'bg-white/55 dark:bg-[#111827]/55 backdrop-blur-xl border-black/[0.08] dark:border-white/[0.12] text-text-secondary hover:text-danger hover:bg-white/80 dark:hover:bg-[#111827]/80'
        }`}
      >
        <ThumbsDown size={13} />
        <span>{review.not_helpful || 0}</span>
      </button>
      <button 
        type="button" 
        aria-label="Báo cáo"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/55 dark:bg-[#111827]/55 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] text-text-secondary hover:text-danger hover:bg-white/80 dark:hover:bg-[#111827]/80 transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <Flag size={13} />
      </button>
    </div>
  )
}


export {
  ratingSelectedClass,
  barColorClass,
  Button,
  ButtonGroup,
  LiquidModal,
  SearchableDropdown,
  Badge,
  ScoreBadge,
  RatingSelector,
  VoteFooter
};
