import { useState, useEffect, useRef, useContext, type FormEvent } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti'
import easterEggImg from './easter-egg-logo.jpg'
import {
  SidebarNavigation,
  SidebarButton,
  Avatar,
  Tooltip,
  Modal,
  InputField,
  TextareaField,
  SearchComponent,
  Toast,
} from '@figma/astraui'
import {
  Home,
  Star,
  MapPin,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Plus,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  GraduationCap,
  Moon,
  Sun,
  GitCompare,
  X,
  Bookmark,
  BookmarkCheck,
  Search,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import { ThemeContext } from './main'
import logoImg from './logo.jpg'
import InteractiveBackground from './components/InteractiveBackground'
import {
  Skeleton,
  InstitutionCardSkeleton,
  InstitutionListSkeleton,
  ProfessorDetailsSkeleton,
  InstitutionDetailsSkeleton,
  DepartmentDetailsSkeleton,
} from './components/Skeletons'

// ==========================================
// TYPES
// ==========================================
interface Institution {
  id: number
  name: string
  short_name: string
  location: string
  departments: string[]
}

interface Professor {
  id: number
  name: string
  university: string
  department: string
  tags: string[]
}

interface InstitutionReview {
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

interface ProfessorReview {
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

interface Suggestion {
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

const VIETNAM_PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau',
  'Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên',
  'Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội',
  'Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên',
  'Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn',
  'Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận',
  'Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh',
  'Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
  'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Hồ Chí Minh','Trà Vinh',
  'Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
]

const PROF_TAGS = ['Nghiêm khắc','Bài giảng tuyệt vời','Tiêu chí chấm rõ ràng','Phản hồi tốt','Truyền cảm hứng','Nhiều bài tập','Tận tâm','Được tôn trọng']
const CRITERIA_KEYS = ['Uy tín trường','Địa điểm','Cơ hội việc làm','Cơ sở vật chất','Mạng Internet','Đồ ăn','Câu lạc bộ','Đời sống xã hội','Độ hài lòng','An toàn']
const GRADE_OPTIONS = ['A+','A','A-','B+','B','B-','C+','C','C-','D','F','Đạt','Chưa hoàn thành']

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

const reviewAvg = (metrics: Record<string, number>): number => {
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
    neutral: 'bg-white/60 dark:bg-white/[0.08] backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-white/85 dark:hover:bg-white/[0.16] text-text-primary',
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
        className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />
      <div 
        className={`relative flex flex-col bg-white/85 dark:bg-[#141416]/90 backdrop-blur-3xl border border-black/10 dark:border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.28)] rounded-[28px] animate-scaleIn ${size === 'small' ? 'max-w-md w-full' : 'max-w-2xl w-full'} max-h-[90vh] overflow-hidden`}
        style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
      >
        {title ? (
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/20 dark:bg-white/[0.02]">
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
  const ref = useRef<HTMLDivElement>(null)

  const isCompact = compact || size === 'small'
  const showSearchInput = options.length > 6

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={`relative flex flex-col gap-xs ${className} ${open ? 'z-50' : ''}`} ref={ref}>
      {label && (
        <span className="text-label-sm text-text-secondary">{label}</span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`flex items-center justify-between transition-all duration-200 select-none ${
          isCompact
            ? 'h-9 px-3.5 bg-white/50 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] shadow-xs rounded-full text-xs font-medium text-text-primary hover:bg-white/80 dark:hover:bg-white/[0.14]'
            : 'px-xl py-lg bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 shadow-sm rounded-corner-md text-label text-text-primary'
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

      {open && (
        <div 
          className="absolute z-50 top-full mt-1.5 w-full min-w-[180px] bg-white/80 dark:bg-[#18181b]/90 backdrop-blur-2xl border border-black/10 dark:border-white/15 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] animate-scaleIn overflow-hidden"
          style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
        >
          {showSearchInput && (
            <div className="p-2 border-b border-black/5 dark:border-white/10 bg-transparent">
              <InputField
                value={search}
                placeholder="Tìm kiếm..."
                onChange={setSearch}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto bg-transparent py-1.5">
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
        </div>
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
                : 'bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border-black/[0.08] dark:border-white/[0.12] text-text-primary hover:bg-white/70 dark:hover:bg-white/[0.12]'
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
            : 'bg-white/40 dark:bg-white/[0.06] backdrop-blur-md border-black/[0.08] dark:border-white/[0.12] text-text-secondary hover:text-brand-primary hover:bg-white/60 dark:hover:bg-white/[0.12]'
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
            : 'bg-white/40 dark:bg-white/[0.06] backdrop-blur-md border-black/[0.08] dark:border-white/[0.12] text-text-secondary hover:text-danger hover:bg-white/60 dark:hover:bg-white/[0.12]'
        }`}
      >
        <ThumbsDown size={13} />
        <span>{review.not_helpful || 0}</span>
      </button>
      <button 
        type="button" 
        aria-label="Báo cáo"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/40 dark:bg-white/[0.06] backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] text-text-secondary hover:text-danger hover:bg-white/60 dark:hover:bg-white/[0.12] transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <Flag size={13} />
      </button>
    </div>
  )
}

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  const { theme, setTheme } = useContext(ThemeContext)
  const isInitialized = useRef(false)

  // Local storage theme persistence
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      const savedTheme = localStorage.getItem('astra-theme')
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme)
      }
    }
  }, [setTheme])

  // Unified theme effect to write changes to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (root.classList.contains(theme) && root.getAttribute('data-theme') === theme) return;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    localStorage.setItem('astra-theme', theme);
  }, [theme]);

  const [toast, setToast] = useState<{ message: string; variant: 'default' | 'success' | 'error' } | null>(null)

  // Header Logo States
  const [showInfoMenu, setShowInfoMenu] = useState(false)
  const [sidebarRotation, setSidebarRotation] = useState(0)
  const [flyoutRotation, setFlyoutRotation] = useState(0)
  const [isFlyoutSpinning, setIsFlyoutSpinning] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleLogoClick = () => {
    setSidebarRotation(prev => prev + 360);
    setShowInfoMenu(true);
  }

  const handleFlyoutLogoClick = () => {
    if (isFlyoutSpinning) return;
    setIsFlyoutSpinning(true);
    setFlyoutRotation(prev => prev + 360);
    
    const nextSpinCount = spinCount + 1;
    setSpinCount(nextSpinCount);
    
    if (nextSpinCount === 10 && confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, { resize: true, useWorker: true });
      myConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
    
    setTimeout(() => setIsFlyoutSpinning(false), 500);
  }

  // Bookmarks
  const [bookmarkedProfIds, setBookmarkedProfIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_profs')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showBookmarkPanel, setShowBookmarkPanel] = useState<boolean>(false)

  // Comparison state
  const [compareModal, setCompareModal] = useState(false)
  const [compareSearch, setCompareSearch] = useState('')
  const [compareUniv, setCompareUniv] = useState('')
  const [compareDept, setCompareDept] = useState('')
  const [compareProf, setCompareProf] = useState<Professor | null>(null)

  const [compareInstModal, setCompareInstModal] = useState(false)
  const [compareInstSearch, setCompareInstSearch] = useState('')
  const [compareInstSelected, setCompareInstSelected] = useState<Institution | null>(null)

  // Data
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [instReviews, setInstReviews] = useState<InstitutionReview[]>([])
  const [profReviews, setProfReviews] = useState<ProfessorReview[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Navigation
  const routerNavigate = useNavigate()
  const location = useLocation()
  
  const [currentView, setCurrentView] = useState('home')
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedProf, setSelectedProf] = useState<Professor | null>(null)
  const [activeSideNav, setActiveSideNav] = useState('home')

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 0) {
      setCurrentView('home')
      setSelectedInst(null)
      setSelectedDept(null)
      setSelectedProf(null)
      return
    }

    if (parts[0] === 'suggest') {
      setCurrentView('suggest')
      return
    }

    if (parts[0] === 'add-inst-review') {
      setCurrentView('add-inst-review')
      if (institutions.length > 0 && parts[1]) {
        const inst = institutions.find(i => i.short_name.toLowerCase() === decodeURIComponent(parts[1]).toLowerCase())
        if (inst) setSelectedInst(inst)
      }
      return
    }

    if (parts[0] === 'add-prof-review') {
      setCurrentView('add-prof-review')
      if (professors.length > 0 && parts[1]) {
        const prof = professors.find(p => p.id === parseInt(parts[1]))
        if (prof) {
          setSelectedProf(prof)
          const inst = institutions.find(i => i.name === prof.university)
          if (inst) setSelectedInst(inst)
          setSelectedDept(prof.department)
        }
      }
      return
    }

    // Standard hierarchical routes
    if (parts.length >= 3) {
      setCurrentView('professor')
    } else if (parts.length === 2) {
      setCurrentView('department')
    } else if (parts.length === 1) {
      setCurrentView('institution')
    }

    if (institutions.length > 0) {
      const inst = institutions.find(i => i.short_name.toLowerCase() === decodeURIComponent(parts[0]).toLowerCase())
      if (inst) {
        setSelectedInst(inst)
        if (parts[1]) {
          setSelectedDept(decodeURIComponent(parts[1]))
          if (parts[2]) {
            const prof = professors.find(p => p.id.toString() === parts[2])
            if (prof) {
              setSelectedProf(prof)
              setCurrentView('professor')
            } else {
              setCurrentView('department')
            }
          } else {
            setCurrentView('department')
          }
        } else {
          setCurrentView('institution')
        }
      } else {
        if (!isLoadingData) {
          setCurrentView('home')
        }
      }
    }
  }, [location.pathname, institutions, professors, isLoadingData])

  const navigate = (view: string, inst?: Institution, dept?: string, prof?: Professor) => {
    const targetInst = inst !== undefined ? inst : (selectedInst || undefined);
    const targetDept = dept !== undefined ? dept : (selectedDept || undefined);
    const targetProf = prof !== undefined ? prof : (selectedProf || undefined);
    
    if (view === 'home') routerNavigate('/')
    else if (view === 'suggest') routerNavigate('/suggest')
    else if (view === 'add-inst-review' && targetInst) routerNavigate(`/add-inst-review/${encodeURIComponent(targetInst.short_name)}`)
    else if (view === 'add-prof-review' && targetProf) routerNavigate(`/add-prof-review/${targetProf.id}`)
    else if (view === 'institution' && targetInst) routerNavigate(`/${encodeURIComponent(targetInst.short_name)}`)
    else if (view === 'department' && targetInst && targetDept) routerNavigate(`/${encodeURIComponent(targetInst.short_name)}/${encodeURIComponent(targetDept)}`)
    else if (view === 'professor' && targetInst && targetDept && targetProf) routerNavigate(`/${encodeURIComponent(targetInst.short_name)}/${encodeURIComponent(targetDept)}/${targetProf.id}`)
  }

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<Institution[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews'>('name')
  const [locationFilter, setLocationFilter] = useState('')
  const [deptSearchTerm, setDeptSearchTerm] = useState('')
  const [profSort, setProfSort] = useState('newest')
  const [instSort, setInstSort] = useState('newest')
  const [profTagFilter, setProfTagFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 16
  
  // Prof review form
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

  // Inst review form
  const [instAuthorName, setInstAuthorName] = useState('')
  const [instMetrics, setInstMetrics] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA_KEYS.map(k => [k, 5]))
  )
  const [instReviewComment, setInstReviewComment] = useState('')

  // Suggest form
  const [suggAuthorName, setSuggAuthorName] = useState('')
  const [suggestionType, setSuggestionType] = useState<'professor' | 'institution' | 'department'>('professor')
  const [suggProfName, setSuggProfName] = useState('')
  const [suggSelectedUniv, setSuggSelectedUniv] = useState('')
  const [suggSelectedDept, setSuggSelectedDept] = useState('')
  const [suggInstName, setSuggInstName] = useState('')
  const [suggInstShortName, setSuggInstShortName] = useState('')
  const [suggInstLocation, setSuggInstLocation] = useState('')
  const [suggInstDepts, setSuggInstDepts] = useState('')
  const [suggNewDeptName, setSuggNewDeptName] = useState('')
  const [suggestionContent, setSuggestionContent] = useState('')

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, locationFilter])

  // Fetch info and review data
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoadingData(true)
      try {
        const [
          { data: instData, error: instErr },
          { data: profData, error: profErr },
          { data: instRevData, error: instRevErr },
          { data: profRevData, error: profRevErr }
        ] = await Promise.all([
          supabase.from('institutions').select('*'),
          supabase.from('professors').select('*'),
          supabase.from('institution_reviews').select('*'),
          supabase.from('professor_reviews').select('*')
        ]);

        if (instErr) console.error("Error fetching institutions:", instErr);
        if (profErr) console.error("Error fetching professors:", profErr);

        if (instData) setInstitutions(instData);
        if (profData) setProfessors(profData);
        if (instRevData) setInstReviews(instRevData);
        if (profRevData) setProfReviews(profRevData);
        
      } catch (error) {
        console.error("Failed to load database data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRealData();
  }, []);

  // Predictive search suggestions
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const matches = institutions.filter(inst =>
        (inst.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.short_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
      setSearchSuggestions(matches)
      setShowSearchSuggestions(true)
    } else {
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
    }
  }, [searchTerm, institutions])

  const showToast = (message: string, variant: 'success' | 'error' | 'default' = 'default') => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 3000)
  }

  // ==========================================
  // HELPERS
  // ==========================================
  const toSlug = (text: string) =>
    text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')

  const calculateInstStats = (inst_id: number) => {
    const list = instReviews.filter(r => r.inst_id === inst_id)
    if (list.length === 0) return { overall: 0, total: 0, metricsAvg: {} as Record<string, string> }
    const metricsAvg: Record<string, string> = {}
    let sumTotal = 0
    CRITERIA_KEYS.forEach(key => {
      const mSum = list.reduce((acc, r) => acc + (r.metrics[key] || 0), 0)
      metricsAvg[key] = (mSum / list.length).toFixed(1)
      sumTotal += mSum / list.length
    })
    return { overall: parseFloat((sumTotal / CRITERIA_KEYS.length).toFixed(1)), total: list.length, metricsAvg }
  }

  const calculateProfStats = (prof_id: number) => {
    const list = profReviews.filter(r => r.prof_id === prof_id)
    if (list.length === 0) return { avg_rating: 0, avg_difficulty: 0, total_ratings: 0, would_take_again_pct: 0 }
    const sumRating = list.reduce((acc, r) => acc + r.teaching_rating, 0)
    const sumDiff = list.reduce((acc, r) => acc + r.difficulty_rating, 0)
    const wouldTakeCount = list.filter(r => r.would_take_again).length
    return {
      avg_rating: sumRating / list.length,
      avg_difficulty: sumDiff / list.length,
      total_ratings: list.length,
      would_take_again_pct: Math.round((wouldTakeCount / list.length) * 100),
    }
  }

  const handleInstVote = async (id: string, vote: 'helpful' | 'not_helpful') => {
    const targetReview = instReviews.find(r => r.id === id)
    if (!targetReview) return

    let h = targetReview.helpful || 0
    let nh = targetReview.not_helpful || 0
    let newVote: typeof targetReview.userVote = vote

    if (targetReview.userVote === vote) { 
      vote === 'helpful' ? h-- : nh--; 
      newVote = null 
    }
    else if (targetReview.userVote === 'helpful') { h--; nh++ }
    else if (targetReview.userVote === 'not_helpful') { nh--; h++ }
    else { vote === 'helpful' ? h++ : nh++ }

    setInstReviews(prev => prev.map(r => 
      r.id === id ? { ...r, helpful: h, not_helpful: nh, userVote: newVote } : r
    ))

    try {
      const { error } = await supabase
        .from('institution_reviews')
        .update({ helpful: h, not_helpful: nh })
        .eq('id', id)
        
      if (error) throw error
    } catch (error) {
      console.error("Failed to push vote:", error)
      showToast('Lỗi khi lưu tương tác. Vui lòng thử lại.', 'error')
    }
  }

  const toggleBookmark = (profId: number) => {
    const isBookmarked = bookmarkedProfIds.includes(profId)
    const updated = isBookmarked
      ? bookmarkedProfIds.filter(id => id !== profId)
      : [...bookmarkedProfIds, profId]
    
    setBookmarkedProfIds(updated)
    localStorage.setItem('bookmarked_profs', JSON.stringify(updated))
    showToast(isBookmarked ? 'Đã xóa khỏi danh sách lưu' : 'Đã lưu giảng viên', isBookmarked ? 'default' : 'success')
  }

  const handleProfVote = async (id: string, vote: 'helpful' | 'not_helpful') => {
    const targetReview = profReviews.find(r => r.id === id)
    if (!targetReview) return

    let h = targetReview.helpful || 0
    let nh = targetReview.not_helpful || 0
    let newVote: typeof targetReview.userVote = vote

    if (targetReview.userVote === vote) { 
      vote === 'helpful' ? h-- : nh--; 
      newVote = null 
    }
    else if (targetReview.userVote === 'helpful') { h--; nh++ }
    else if (targetReview.userVote === 'not_helpful') { nh--; h++ }
    else { vote === 'helpful' ? h++ : nh++ }

    setProfReviews(prev => prev.map(r => 
      r.id === id ? { ...r, helpful: h, not_helpful: nh, userVote: newVote } : r
    ))

    try {
      const { error } = await supabase
        .from('professor_reviews')
        .update({ helpful: h, not_helpful: nh })
        .eq('id', id)
        
      if (error) throw error
    } catch (error) {
      console.error("Failed to push vote:", error)
      showToast('Lỗi khi lưu tương tác. Vui lòng thử lại.', 'error')
    }
  }

  // ==========================================
  // BREADCRUMB
  // ==========================================
  const renderBreadcrumb = () => {
    const crumbs: { label: string; onClick?: () => void }[] = [{ label: 'Trang chủ', onClick: () => navigate('home') }]
    if (selectedInst) crumbs.push({ label: selectedInst.short_name, onClick: () => navigate('institution', selectedInst) })
    if (selectedDept) crumbs.push({ label: selectedDept, onClick: () => selectedInst ? navigate('department', selectedInst, selectedDept) : undefined })
    if (selectedProf) crumbs.push({ label: selectedProf.name })

    return (
      <div className="flex items-center gap-1.5 flex-wrap mb-2xl">
        {crumbs.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-text-tertiary" />}
            {c.onClick ? (
              <button 
                type="button"
                onClick={c.onClick} 
                className="h-8 px-3 rounded-full text-label-sm text-text-secondary hover:text-brand-primary bg-white/40 dark:bg-white/[0.05] hover:bg-white/70 dark:hover:bg-white/[0.1] backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer font-medium"
              >
                {c.label}
              </button>
            ) : (
              <span className="h-8 px-3 flex items-center rounded-full text-label-sm font-semibold text-text-primary bg-white/60 dark:bg-white/[0.09] backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12]">
                {c.label}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ==========================================
  // HOME VIEW
  // ==========================================
  const renderHome = () => {
    if (isLoadingData && institutions.length === 0) {
      return <InstitutionListSkeleton />
    }

    const locationOptions = [
      { value: '', label: 'Tất cả tỉnh thành' },
      ...VIETNAM_PROVINCES.map(p => ({ value: p, label: p })),
    ]

    const filtered = institutions.filter(inst => {
      const safeName = inst.name || '';
      const safeShortName = inst.short_name || '';

      const matchSearch = !searchTerm ||
        safeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        safeShortName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchLocation = !locationFilter || inst.location === locationFilter
      return matchSearch && matchLocation
    })
    let sorted = [...filtered]
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'rating') sorted.sort((a, b) => calculateInstStats(b.id).overall - calculateInstStats(a.id).overall)
    else sorted.sort((a, b) => calculateInstStats(b.id).total - calculateInstStats(a.id).total)

    const totalPages = Math.ceil(sorted.length / entriesPerPage)
    const paginated = sorted.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        <div className="relative z-30 flex flex-col gap-xl p-2xl rounded-3xl shadow-lg shadow-black/5">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-3xl -z-10" />
          <div className="flex flex-col gap-xs">
            <h1 className="text-title text-text-primary">Tìm kiếm Trường Đại học</h1>
            <p className="text-label-sm text-text-secondary">Xem đánh giá thực tế từ sinh viên về trường và giảng viên</p>
          </div>

          <div className="relative flex items-center gap-md bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 rounded-2xl focus-within:border-brand-primary transition-all duration-300 px-xl shadow-sm">
            <Search size={18} className="text-text-secondary shrink-0" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Tìm kiếm theo tên trường hoặc mã trường..."
              onChange={e => {
                setSearchTerm(e.target.value)
                setShowSearchSuggestions(true)
              }}
              className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full placeholder:text-text-tertiary"
            />

            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-md bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 animate-scaleIn overflow-hidden py-xs"
                style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
              >
                {searchSuggestions.map(inst => {
                  const stats = calculateInstStats(inst.id)
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => { navigate('institution', inst); setSearchTerm(''); setShowSearchSuggestions(false) }}
                      className="w-full flex items-center justify-between px-xl py-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-lg">
                        <div className="w-8 h-8 bg-brand-tertiary rounded-corner-md flex items-center justify-center shrink-0">
                          <GraduationCap size={14} className="text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-label-sm text-text-primary">{inst.name}</p>
                          <p className="text-video-title text-text-secondary flex items-center gap-xs">
                            <MapPin size={10} />
                            {inst.location}
                          </p>
                        </div>
                      </div>
                      <ScoreBadge value={stats.overall} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-lg flex-wrap">
            <div className="flex items-center gap-sm text-label-sm text-text-secondary">
              <Filter size={14} />
              <span>Lọc:</span>
            </div>
            <div className="w-48">
              <SearchableDropdown
                options={locationOptions}
                value={locationFilter}
                onChange={setLocationFilter}
                placeholder="Tỉnh / thành"
              />
            </div>
            <div className="flex items-center gap-sm text-label-sm text-text-secondary ml-auto">
              <ArrowUpDown size={14} />
              <span>Sắp xếp:</span>
            </div>
            <div className="flex gap-sm">
              {([['name', 'A-Z'], ['rating', 'Điểm ⭐'], ['reviews', 'Phổ biến']] as const).map(([val, label]) => (
                <Button
                  key={val}
                  variant={sortBy === val ? 'primary' : 'neutral'}
                  size="small"
                  onClick={() => setSortBy(val)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-lg">
            <p className="text-label-sm text-text-secondary">
              {filtered.length} trường {locationFilter ? `tại ${locationFilter}` : ''}
            </p>
            {totalPages > 1 && (
              <p className="text-label-sm text-text-secondary">Trang {currentPage} / {totalPages}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
            {paginated.map(inst => {
              const stats = calculateInstStats(inst.id)
              return (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => navigate('institution', inst)}
                  className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl p-6 flex flex-col h-full text-left border border-black/5 dark:border-white/10 hover:bg-white/65 dark:hover:bg-black/65 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 group animate-scaleIn shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex flex-col gap-2 flex-1 min-w-0 mb-5">
                    <div className="flex items-start justify-between gap-sm">
                      <Badge label={inst.short_name} variant="brand" />
                    </div>
                    <h3 className="text-label font-semibold text-text-primary leading-snug group-hover:text-brand-primary transition-colors line-clamp-2 mt-1">
                      {inst.name}
                    </h3>
                  </div>
                  
                  <div className="mt-auto w-full flex flex-col gap-3.5">
                    <p className="text-video-title text-text-secondary flex items-center gap-1.5">
                      <MapPin size={12} className="shrink-0 text-text-tertiary" />
                      <span className="truncate">{inst.location}</span>
                    </p>
                    <div className="flex items-center justify-between pt-3.5 border-t border-border-secondary w-full shrink-0">
                      <ScoreBadge value={stats.overall} />
                      <span className="text-video-title text-text-secondary font-medium">{stats.total} đánh giá</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {paginated.length === 0 && (
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl text-center">
              <p className="text-label text-text-secondary">Không tìm thấy trường phù hợp</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10 pb-4xl">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1))
                  const mainContainer = document.querySelector('main')
                  if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="group inline-flex items-center gap-2.5 h-11 px-5 rounded-full bg-white/60 dark:bg-white/[0.08] backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-none hover:bg-white/90 dark:hover:bg-white/[0.16] hover:border-black/[0.14] dark:hover:border-white/[0.22] active:scale-[0.96] transition-all duration-200 ease-out select-none disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:hover:bg-white/60 dark:disabled:hover:bg-white/[0.08] disabled:hover:border-black/[0.08] dark:disabled:hover:border-white/[0.12]"
                style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
                aria-label="Trang trước"
              >
                <ChevronLeft size={17} strokeWidth={2.25} className="text-text-primary group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="text-[14px] font-medium text-text-primary tracking-tight">Trước</span>
              </button>

              <div 
                className="h-11 px-4 flex items-center justify-center rounded-full bg-white/40 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.05] dark:border-white/[0.08] text-[13px] font-medium text-text-secondary tracking-tight select-none"
                style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
              >
                <span>{currentPage}</span>
                <span className="mx-1.5 opacity-40">/</span>
                <span>{totalPages}</span>
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1))
                  const mainContainer = document.querySelector('main')
                  if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="group inline-flex items-center gap-2.5 h-11 px-5 rounded-full bg-white/60 dark:bg-white/[0.08] backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-none hover:bg-white/90 dark:hover:bg-white/[0.16] hover:border-black/[0.14] dark:hover:border-white/[0.22] active:scale-[0.96] transition-all duration-200 ease-out select-none disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:hover:bg-white/60 dark:disabled:hover:bg-white/[0.08] disabled:hover:border-black/[0.08] dark:disabled:hover:border-white/[0.12]"
                style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
                aria-label="Trang sau"
              >
                <span className="text-[14px] font-medium text-text-primary tracking-tight">Sau</span>
                <ChevronRight size={17} strokeWidth={2.25} className="text-text-primary group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // INSTITUTION VIEW
  // ==========================================
  const renderInstitution = () => {
    if (isLoadingData || !selectedInst) {
      return <InstitutionDetailsSkeleton />
    }
    const stats = calculateInstStats(selectedInst.id)
    let reviews = instReviews.filter(r => r.inst_id === selectedInst.id)

    if (instSort === 'highest-rating') {
      reviews.sort((a, b) => reviewAvg(b.metrics || {}) - reviewAvg(a.metrics || {}))
    } else if (instSort === 'lowest-rating') {
      reviews.sort((a, b) => reviewAvg(a.metrics || {}) - reviewAvg(b.metrics || {}))
    } else if (instSort === 'helpful') {
      reviews.sort((a, b) => {
        const scoreA = (a.helpful || 0) - (a.not_helpful || 0)
        const scoreB = (b.helpful || 0) - (b.not_helpful || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return (b.helpful || 0) - (a.helpful || 0)
      })
    } else if (instSort === 'oldest') {
      reviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
      reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const leftCriteria = CRITERIA_KEYS.slice(0, 5)
    const rightCriteria = CRITERIA_KEYS.slice(5)

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        {renderBreadcrumb()}

        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
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
              onClick={() => { setCompareInstSelected(null); setCompareInstSearch(''); setCompareInstModal(true) }}
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

        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl grid grid-cols-1 lg:grid-cols-3 gap-xl items-center">
          <div className="flex flex-col items-center justify-center p-xl">
            <span className="text-[56px] font-semibold text-text-primary leading-none">{stats.overall > 0 ? stats.overall.toFixed(1) : '0.0'}</span>
            <span className="text-label-sm text-text-secondary mt-xs">trên 5 ({stats.total} đánh giá)</span>
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

        <div className="flex flex-col gap-lg">
          <h2 className="text-heading text-text-primary">Khoa / Viện trực thuộc</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {selectedInst.departments?.map((dept, idx) => {
              const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === dept)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => navigate('department', selectedInst, dept)}
                  className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-black/5 dark:border-white/10 shadow-sm hover:border-brand-primary text-left flex flex-col h-full transition-all group animate-slideInLeft cursor-pointer active:scale-[0.99]"
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

        <div className="flex flex-col gap-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-heading text-text-primary">Đánh giá cơ sở</h2>
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
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl text-center border border-border-secondary" style={{ borderStyle: 'dashed' }}>
              <p className="text-label text-text-secondary">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            reviews.map(rev => {
              const revScore = reviewAvg(rev.metrics || {})
              return (
                <div key={rev.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 flex flex-col gap-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-text-primary">{rev.author_name || 'Người dùng ẩn danh'}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-white/[0.08] backdrop-blur-md rounded-xl px-3 py-1 border border-black/[0.06] dark:border-white/[0.1] shadow-xs">
                      <span className={`text-base font-bold leading-none ${revScore >= 4 ? 'text-emerald-500 dark:text-emerald-400' : revScore >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500'}`}>
                        {revScore.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-text-tertiary font-medium">/ 5</span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-text-primary">{rev.comment}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-3 sm:p-3.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
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

  // ==========================================
  // DEPARTMENT VIEW
  // ==========================================
  const renderDepartment = () => {
    if (isLoadingData || !selectedInst || !selectedDept) {
      return <DepartmentDetailsSkeleton />
    }
    const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === selectedDept)
    const filtered = deptProfs.filter(p => p.name.toLowerCase().includes(deptSearchTerm.toLowerCase()))

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        {renderBreadcrumb()}

        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
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

        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl">
          <div className="relative flex items-center gap-md bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 shadow-sm rounded-corner-lg focus-within:border-brand-primary transition-colors px-xl">
            <Search size={18} className="text-text-secondary shrink-0" />
            <input
              type="text"
              value={deptSearchTerm}
              placeholder="Tìm kiếm giảng viên..."
              onChange={e => setDeptSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {filtered.length === 0 ? (
            <div className="col-span-2 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl text-center">
              <p className="text-label text-text-secondary">Không tìm thấy giảng viên</p>
            </div>
          ) : (
            filtered.map((prof, idx) => {
              const stats = calculateProfStats(prof.id)
              const isBookmarked = bookmarkedProfIds.includes(prof.id)
              return (
                <div
                  key={prof.id}
                  className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl border border-black/5 dark:border-white/10 hover:border-brand-primary text-left flex flex-col h-full transition-all animate-fadeIn"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => navigate('professor', selectedInst, selectedDept, prof)}
                    className="flex flex-col h-full text-left w-full"
                  >
                    <div className="flex items-start justify-between gap-lg w-full mb-lg">
                      <div className="flex items-center gap-lg">
                        <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="medium" shape="circle" />
                        <div>
                          <h3 className="text-label text-text-primary">{prof.name}</h3>
                          <p className="text-video-title text-text-secondary">{stats.total_ratings} đánh giá</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-sm z-10">
                        <ScoreBadge value={stats.avg_rating} />
                        <div
                          role="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); toggleBookmark(prof.id) }}
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
                        <p className="text-label-sm text-text-primary">{stats.avg_difficulty > 0 ? stats.avg_difficulty.toFixed(1) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-video-title text-text-tertiary uppercase">Học lại</p>
                        <p className="text-label-sm text-text-primary">{stats.would_take_again_pct}%</p>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // PROFESSOR VIEW
  // ==========================================
  const renderProfessor = () => {
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

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        {renderBreadcrumb()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl flex flex-col gap-xl">
            <div className="flex flex-col gap-xs">
              <span className="text-[48px] font-semibold text-text-primary leading-none">
                {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '0.0'}
              </span>
              <p className="text-label-sm text-text-secondary">Dựa trên {stats.total_ratings} đánh giá</p>
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

            <ButtonGroup align="justify">
              <Button
                variant="neutral"
                iconStart={<GitCompare size={16} />}
                onClick={() => { setCompareProf(null); setCompareSearch(''); setCompareUniv(''); setCompareDept(''); setCompareModal(true) }}
              >
                So sánh
              </Button>
              <Button
                variant={bookmarkedProfIds.includes(selectedProf.id) ? 'primary' : 'neutral'}
                iconStart={bookmarkedProfIds.includes(selectedProf.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                onClick={() => toggleBookmark(selectedProf.id)}
              >
                {bookmarkedProfIds.includes(selectedProf.id) ? 'Đã lưu' : 'Lưu'}
              </Button>
              <Button
                variant="primary"
                iconEnd={<ChevronRight size={16} />}
                onClick={() => navigate('add-prof-review')}
              >
                Đánh giá
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex flex-col gap-xl">
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
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
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
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
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
                  <h3 className="text-label text-text-primary font-semibold">Giảng viên tương tự</h3>
                  {similarProfs.map(({ prof, s }) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => navigate('professor', selectedInst!, selectedDept!, prof)}
                      className="flex items-center justify-between gap-lg hover:bg-black/5 dark:bg-white/5 hover:backdrop-blur-xl p-sm rounded-corner-md transition-colors text-left"
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

        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
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
                      : 'bg-white/40 dark:bg-white/[0.06] backdrop-blur-md border-black/[0.06] dark:border-white/[0.1] text-text-primary hover:bg-white/70 dark:hover:bg-white/[0.12]'
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
                        : 'bg-white/40 dark:bg-white/[0.06] backdrop-blur-md border-black/[0.06] dark:border-white/[0.1] text-text-primary hover:bg-white/70 dark:hover:bg-white/[0.12]'
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
          <h2 className="text-heading text-text-primary">Đánh giá từ sinh viên</h2>
          {reviews.length === 0 ? (
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-2xl text-center border border-border-secondary" style={{ borderStyle: 'dashed' }}>
              <p className="text-label text-text-secondary">Không có đánh giá phù hợp với bộ lọc</p>
            </div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 flex flex-col gap-3.5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{rev.author_name || 'Người dùng ẩn danh'}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-white/50 dark:bg-white/[0.08] backdrop-blur-md border border-black/[0.06] dark:border-white/[0.1] rounded-xl px-2.5 py-1 text-center min-w-[56px] shadow-xs">
                        <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Chất lượng</p>
                        <p className={`text-sm font-bold leading-tight mt-0.5 ${rev.teaching_rating >= 4 ? 'text-emerald-500 dark:text-emerald-400' : rev.teaching_rating >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500'}`}>
                          {rev.teaching_rating.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-white/[0.08] backdrop-blur-md border border-black/[0.06] dark:border-white/[0.1] rounded-xl px-2.5 py-1 text-center min-w-[56px] shadow-xs">
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
                    <div key={k} className="bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-sm border border-black/[0.04] dark:border-white/[0.06] rounded-full px-2.5 py-0.5 flex items-center gap-1">
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

  // ==========================================
  // ADD PROF REVIEW
  // ==========================================
  const renderAddProfReview = () => {
    if (!selectedProf) return null

    const handleSub = async (e: FormEvent) => {
      e.preventDefault()
      if (!reviewCourse.trim() || !reviewComment.trim()) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return }

      const finalName = reviewAuthorName.trim() || 'Ẩn danh'

      const newRev = {
        prof_id: selectedProf.id, 
        author_name: finalName,
        course: reviewCourse.trim(), teaching_rating: reviewTeaching, difficulty_rating: reviewDifficulty,
        would_take_again: reviewWouldTakeAgain, for_credit: reviewForCredit, textbook: reviewTextbook,
        attendance: reviewAttendance, grade: reviewGrade, tags: reviewSelectedTags, comment: reviewComment.trim(),
        helpful: 0, not_helpful: 0,
      }

      const { data, error } = await supabase.from('professor_reviews').insert([newRev]).select() as any
      if (error) { showToast(error.message, 'error'); return }
      if (data) setProfReviews(prev => [{ ...data[0], userVote: null } as ProfessorReview, ...prev])
      showToast('Đánh giá đã được gửi thành công!', 'success')
      
      // RESET FORM STATES
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
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-2xl mx-auto">
        {renderBreadcrumb()}

        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Đánh giá {selectedProf.name}</h1>
          <p className="text-label-sm text-text-secondary">{selectedProf.department} • {selectedProf.university}</p>
        </div>

        <form onSubmit={handleSub} className="flex flex-col gap-xl">
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
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

          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-xl">
            <RatingSelector label="Đánh giá giảng viên *" value={reviewTeaching} onChange={setReviewTeaching} lowLabel="1 - Rất tệ" highLabel="5 - Tuyệt vời" />
            <RatingSelector label="Độ khó môn học *" value={reviewDifficulty} onChange={setReviewDifficulty} lowLabel="1 - Rất dễ" highLabel="5 - Rất khó" />
          </div>

          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
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

          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
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
                        : 'bg-white/40 dark:bg-white/[0.06] backdrop-blur-md border-black/[0.06] dark:border-white/[0.1] text-text-primary hover:bg-white/70 dark:hover:bg-white/[0.12]'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl">
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

  // ==========================================
  // ADD INST REVIEW
  // ==========================================
  const renderAddInstReview = () => {
    if (!selectedInst) return null

    const handleSub = async (e: FormEvent) => {
      e.preventDefault()
      if (!instReviewComment.trim()) { showToast('Vui lòng nhập nhận xét', 'error'); return }

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
      if (error) { showToast(error.message, 'error'); return }
      if (data) setInstReviews(prev => [{ ...data[0], userVote: null } as InstitutionReview, ...prev])
      showToast('Đánh giá trường đã được gửi!', 'success')
      
      // RESET FORM STATES
      setInstAuthorName('')
      setInstMetrics(Object.fromEntries(CRITERIA_KEYS.map(k => [k, 5])))
      setInstReviewComment('')

      setTimeout(() => navigate('institution'), 1200)
    }

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-2xl mx-auto">
        {renderBreadcrumb()}
        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Đánh giá {selectedInst.name}</h1>
          <p className="text-label-sm text-text-secondary">{selectedInst.location}</p>
        </div>

        <form onSubmit={handleSub} className="flex flex-col gap-xl">
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
            <InputField
              label="Tên hiển thị (Tùy chọn)"
              placeholder="VD: Cựu sinh viên..."
              value={instAuthorName}
              onChange={setInstAuthorName}
            />
          </div>
          {CRITERIA_KEYS.map(criteria => (
            <div key={criteria} className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl">
              <RatingSelector
                label={`${criteria} *`}
                value={instMetrics[criteria]}
                onChange={val => setInstMetrics(prev => ({ ...prev, [criteria]: val }))}
                lowLabel="1 - Rất tệ"
                highLabel="5 - Tuyệt vời"
              />
            </div>
          ))}

          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl">
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

  // ==========================================
  // SUGGEST VIEW
  // ==========================================
  const renderSuggest = () => {
    const univOptions = institutions
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(i => ({ value: i.name, label: `${i.short_name} - ${i.name}` }))
    
    const selectedUnivObj = institutions.find(i => i.name === suggSelectedUniv)
    
    const deptOptions = (selectedUnivObj?.departments || [])
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map(d => ({ value: d, label: d }))
    
    const provinceOptions = VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()

      const finalName = suggAuthorName.trim() || 'Ẩn danh'
      let newSugg: Partial<Suggestion> = { type: suggestionType, author_name: finalName, content: suggestionContent.trim(), status: 'Chờ xét duyệt' }

      if (suggestionType === 'professor') {
        if (!suggProfName.trim() || !suggSelectedUniv || !suggSelectedDept) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return }
        newSugg = { ...newSugg, targetName: suggProfName.trim(), university: suggSelectedUniv, department: suggSelectedDept }
      } else if (suggestionType === 'institution') {
        if (!suggInstName.trim() || !suggInstShortName.trim() || !suggInstLocation) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return }
        newSugg = { ...newSugg, targetName: suggInstName.trim(), short_name: suggInstShortName.trim(), location: suggInstLocation, departments: suggInstDepts ? suggInstDepts.split(',').map(d => d.trim()).filter(Boolean) : [] }
      } else {
        if (!suggSelectedUniv || !suggNewDeptName.trim()) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return }
        newSugg = { ...newSugg, targetName: suggNewDeptName.trim(), university: suggSelectedUniv, department: suggNewDeptName.trim() }
      }

      const { data, error } = await supabase.from('suggestions').insert([newSugg]).select() as any
      if (error) { showToast(error.message, 'error'); return }
      if (data) setSuggestions(prev => [data[0] as Suggestion, ...prev])
      showToast('Đề xuất đã được gửi thành công!', 'success')
      setSuggAuthorName(''); setSuggProfName(''); setSuggInstName(''); setSuggInstShortName(''); setSuggInstLocation(''); setSuggInstDepts(''); setSuggNewDeptName(''); setSuggestionContent('')
    }

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-2xl mx-auto">
        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Đề xuất thêm dữ liệu</h1>
          <p className="text-label-sm text-text-secondary">Gửi đề xuất thêm trường, khoa hoặc giảng viên mới vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
            <InputField
              label="Tên hiển thị (Tùy chọn)"
              placeholder="VD: Nguyễn Văn A..."
              value={suggAuthorName}
              onChange={setSuggAuthorName}
            />
            
            <SearchableDropdown
              label="Loại đề xuất *"
              options={[
                { value: 'professor', label: 'Giảng viên mới' },
                { value: 'institution', label: 'Trường đại học mới' },
                { value: 'department', label: 'Khoa / Viện mới' },
              ]}
              value={suggestionType}
              onChange={v => setSuggestionType(v as any)}
              placeholder="-- Chọn loại đề xuất --"
            />

            {suggestionType === 'professor' && (
              <div className="flex flex-col gap-lg">
                <InputField label="Tên giảng viên *" placeholder="VD: PGS. TS Nguyễn Văn B" value={suggProfName} onChange={setSuggProfName} />
                <SearchableDropdown label="Trường đại học *" placeholder="-- Chọn trường --" options={univOptions} value={suggSelectedUniv} onChange={v => { setSuggSelectedUniv(v); setSuggSelectedDept('') }} />
                <SearchableDropdown label="Khoa / Viện *" placeholder={suggSelectedUniv ? '-- Chọn khoa --' : 'Chọn trường trước'} options={deptOptions} value={suggSelectedDept} onChange={setSuggSelectedDept} disabled={!suggSelectedUniv} />
              </div>
            )}

            {suggestionType === 'institution' && (
              <div className="flex flex-col gap-lg">
                <InputField label="Tên đầy đủ *" placeholder="VD: Trường Đại học Ngoại thương" value={suggInstName} onChange={setSuggInstName} />
                <InputField label="Tên viết tắt *" placeholder="VD: FTU" value={suggInstShortName} onChange={setSuggInstShortName} />
                <SearchableDropdown label="Tỉnh / Thành phố *" placeholder="-- Chọn tỉnh thành --" options={provinceOptions} value={suggInstLocation} onChange={setSuggInstLocation} />
                <InputField label="Danh sách khoa (phân cách bằng dấu phẩy)" placeholder="Khoa A, Khoa B..." value={suggInstDepts} onChange={setSuggInstDepts} />
              </div>
            )}

            {suggestionType === 'department' && (
              <div className="flex flex-col gap-lg">
                <SearchableDropdown label="Trường đại học *" placeholder="-- Chọn trường --" options={univOptions} value={suggSelectedUniv} onChange={setSuggSelectedUniv} />
                <InputField label="Tên Khoa / Viện mới *" placeholder="VD: Khoa Khởi nghiệp..." value={suggNewDeptName} onChange={setSuggNewDeptName} />
              </div>
            )}
          </div>

          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl">
            <TextareaField
              label="Ghi chú thêm"
              placeholder="Cung cấp thêm thông tin xác thực..."
              rows={3}
              value={suggestionContent}
              onChange={setSuggestionContent}
            />
          </div>

          <ButtonGroup align="justify">
            <Button variant="neutral" onClick={() => navigate('home')}>Hủy</Button>
            <Button variant="primary" type="submit">Gửi đề xuất</Button>
          </ButtonGroup>
        </form>

        {suggestions.length > 0 && (
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-xl flex flex-col gap-lg relative z-30">
            <h2 className="text-heading text-text-primary">Đề xuất gần đây ({suggestions.length})</h2>
            {suggestions.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between py-lg border-b border-border-secondary last:border-0">
                <div className="flex flex-col gap-xs">
                  <Badge label={s.type} variant="brand" />
                  <p className="text-label text-text-primary">{s.targetName}</p>
                  <p className="text-video-title text-text-secondary">{s.university && `${s.university}`}{s.department && ` • ${s.department}`}</p>
                </div>
                <Badge label={s.status} variant="warning" />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // MAIN LAYOUT
  // ==========================================
  const regularNavItems = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'suggest', icon: Plus, label: 'Đề xuất' },
  ]

  const handleNavClick = (id: string) => {
    setActiveSideNav(id)
    if (id === 'home') {
      // RESET ALL SEARCH AND FILTER STATES ON HOME CLICK
      setSearchTerm('')
      setLocationFilter('')
      setSortBy('name')
      setDeptSearchTerm('')
      setCompareSearch('')
      setCompareUniv('')
      setCompareDept('')
      setProfSort('newest')
      setProfTagFilter('all')
      navigate('home')
    }
    else if (id === 'suggest') navigate('suggest')
    else if (id === 'bookmarks') setShowBookmarkPanel(v => !v)
  }

  return (
    <>
    <InteractiveBackground />
    <div className="flex h-[100dvh] overflow-hidden bg-transparent">
      {/* Desktop sidebar */}
      <div className="hidden md:flex relative z-30"> 
        <div className="h-full w-[72px] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 shadow-lg shadow-black/5 flex flex-col items-center py-sm gap-sm relative z-10">
          <div className="h-14 w-full mb-2" />
          {regularNavItems.map(item => (
            <Tooltip key={item.id} content={item.label} position="right">
              <SidebarButton
                icon={<item.icon className="size-full" strokeWidth={1.5} />}
                active={activeSideNav === item.id}
                onClick={() => handleNavClick(item.id)}
              />
            </Tooltip>
          ))}
          <Tooltip key="bookmarks" content="Giảng viên đã lưu" position="right">
            <SidebarButton
              icon={<Bookmark className="size-full" strokeWidth={1.5} />}
              active={showBookmarkPanel}
              onClick={() => setShowBookmarkPanel(v => !v)}
            />
          </Tooltip>
          
          <div className="mt-auto flex flex-col gap-sm">
            <Tooltip content={theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'} position="right">
              <SidebarButton
                icon={theme === 'dark' ? <Moon className="size-full" strokeWidth={1.5} /> : <Sun className="size-full" strokeWidth={1.5} />}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
            </Tooltip>
          </div>
        </div>

        {/* The Escape Hatch: Reduced height (h-14) to prevent clipping, added border-r to restore the line */}
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-center bg-transparent z-50 border-r border-black/5 dark:border-white/10">
          <button 
            type="button"
            onClick={handleLogoClick}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src={logoImg} 
              alt="Logo" 
              className="w-10 h-10 object-cover rounded-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ transform: `rotate(${sidebarRotation}deg)` }}
            />
          </button>
        </div>
      </div>

      {/* Bookmark panel - desktop only */}
      <div className={`hidden md:flex flex-col bg-white/40 dark:bg-black/40 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${showBookmarkPanel ? 'w-72' : 'w-0'}`}>
          <div className="p-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/30 dark:bg-black/30">
            <h2 className="text-label text-text-primary font-semibold flex items-center gap-sm">
              <BookmarkCheck size={14} className="text-brand-primary" />
              Đã lưu ({bookmarkedProfIds.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowBookmarkPanel(false)}
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
                  <div key={id} className="group flex items-start gap-sm p-md rounded-2xl hover:bg-white/50 dark:hover:bg-black/50 transition-all duration-300">
                    <button
                      type="button"
                      onClick={() => {
                        if (inst) { navigate('professor', inst, prof.department, prof); setShowBookmarkPanel(false) }
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
                      className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all shrink-0 p-xs"
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

      <main className="flex-1 overflow-y-auto bg-transparent flex flex-col relative z-10">
        <div className="max-w-7xl mx-auto p-xl pb-28 md:px-3xl md:pt-3xl md:pb-24 flex-1 w-full">
          {currentView === 'home' && renderHome()}
          {currentView === 'institution' && renderInstitution()}
          {currentView === 'department' && renderDepartment()}
          {currentView === 'professor' && renderProfessor()}
          {currentView === 'add-prof-review' && renderAddProfReview()}
          {currentView === 'add-inst-review' && renderAddInstReview()}
          {currentView === 'suggest' && renderSuggest()}
        </div>
      </main>

      {/* Info Menu Modal (Replaces persistent footer) */}
      <LiquidModal
        isOpen={showInfoMenu}
        onClose={() => setShowInfoMenu(false)}
        size="small"
      >
        <div className="flex flex-col text-center items-center py-2 relative overflow-hidden">
          <canvas ref={confettiCanvasRef} className="absolute inset-0 pointer-events-none z-0 w-full h-full" />
          <img 
            src={spinCount >= 10 ? easterEggImg : logoImg} 
            alt="RateVietProfessors Logo" 
            tabIndex={0}
            onClick={handleFlyoutLogoClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFlyoutLogoClick() }}
            className="w-20 h-20 object-cover rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] mb-3 z-10 relative cursor-pointer outline-none focus-visible:ring-2 ring-brand-primary transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: `rotate(${flyoutRotation}deg)` }}
          />
          <h2 className="text-lg font-bold text-text-primary z-10 relative mb-1">RateVietProfessors</h2>
          <p className="text-xs text-text-secondary z-10 relative mb-6 leading-relaxed">
            © {new Date().getFullYear()} RateVietProfessors<br />
            Phiên bản 1.0.0 (Build 42)
          </p>

          <div className="w-full flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden text-left shadow-sm z-10 relative mb-6">
            <a href="https://github.com/Merz26/ratevietprofessors" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
              <span>GitHub</span>
              <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
            </a>
            <a href="https://github.com/Merz26/ratevietprofessors/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
              <span>Về chúng tôi</span>
              <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
            </a>
            <a href="https://github.com/Merz26/ratevietprofessors/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
              <span>Quy tắc cộng đồng</span>
              <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
            </a>
            <a href="https://github.com/Merz26/ratevietprofessors/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
              <span>Bảo mật</span>
              <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
            </a>
          </div>
          
          <Button 
            variant="neutral"
            size="medium"
            onClick={() => setShowInfoMenu(false)} 
            className="min-w-[140px] z-10 relative"
          >
            Đóng
          </Button>
        </div>
      </LiquidModal>

      {/* Institution Comparison Modal */}
      {selectedInst && (
        <LiquidModal
          isOpen={compareInstModal}
          onClose={() => { setCompareInstModal(false); setCompareInstSelected(null) }}
          title="So sánh trường"
          size="medium"
          footer={
            <ButtonGroup align="end">
              <Button variant="neutral" onClick={() => { setCompareInstModal(false); setCompareInstSelected(null) }}>Đóng</Button>
            </ButtonGroup>
          }
        >
          {compareInstSelected ? (
            <div className="flex flex-col gap-xl">
              <div className="grid grid-cols-2 gap-xl">
                {[{ inst: selectedInst, label: 'Hiện tại' }, { inst: compareInstSelected, label: 'So sánh' }].map(({ inst, label }) => {
                  const stats = calculateInstStats(inst.id)
                  return (
                    <div key={inst.id} className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 p-xl flex flex-col gap-lg">
                      <div>
                        <Badge label={label} variant={label === 'Hiện tại' ? 'brand' : 'secondary'} />
                        <p className="text-label text-text-primary font-semibold mt-sm">{inst.name}</p>
                        <p className="text-video-title text-text-secondary">{inst.short_name}</p>
                        <p className="text-video-title text-text-tertiary">{inst.location}</p>
                      </div>
                      <div className="flex flex-col gap-sm">
                        {[
                          { key: 'Uy tín trường', val: stats.metricsAvg['Uy tín trường'] || '0.0' },
                          { key: 'Cơ hội việc làm', val: stats.metricsAvg['Cơ hội việc làm'] || '0.0' },
                          { key: 'Cơ sở vật chất', val: stats.metricsAvg['Cơ sở vật chất'] || '0.0' },
                          { key: 'Tổng quan', val: stats.overall.toFixed(1) },
                          { key: 'Đánh giá', val: stats.total },
                        ].map(({ key, val }) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-video-title text-text-secondary">{key}</span>
                            <span className="text-label-sm text-text-primary font-semibold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button variant="subtle" size="small" onClick={() => setCompareInstSelected(null)} iconStart={<X size={14} />}>
                Chọn lại
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              <p className="text-label-sm text-text-secondary">Tìm trường để so sánh với <strong>{selectedInst.name}</strong></p>
              
              <div className="relative flex items-center gap-md bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 shadow-sm rounded-corner-md focus-within:border-brand-primary transition-colors px-xl">
                <Search size={18} className="text-text-secondary shrink-0" />
                <input
                  type="text"
                  value={compareInstSearch}
                  placeholder="Tìm theo tên trường..."
                  onChange={e => setCompareInstSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-sm max-h-64 overflow-y-auto">
                {institutions
                  .filter(i =>
                    i.id !== selectedInst.id &&
                    (!compareInstSearch || i.name.toLowerCase().includes(compareInstSearch.toLowerCase()) || i.short_name.toLowerCase().includes(compareInstSearch.toLowerCase()))
                  )
                  .slice(0, 8)
                  .map(i => {
                    const stats = calculateInstStats(i.id)
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setCompareInstSelected(i)}
                        className="flex items-center justify-between gap-lg p-lg rounded-corner-md bg-black/5 dark:bg-white/5 backdrop-blur-sm hover:bg-black/10 dark:hover:bg-white/10 hover:backdrop-blur-xl transition-colors text-left"
                      >
                        <div className="flex items-center gap-md">
                          <Avatar type="initial" initials={i.short_name.charAt(0) || 'I'} size="small" shape="circle" />
                          <div>
                            <p className="text-label-sm text-text-primary">{i.short_name}</p>
                            <p className="text-video-title text-text-secondary">{i.name}</p>
                          </div>
                        </div>
                        <ScoreBadge value={stats.overall} />
                      </button>
                    )
                  })}
                {institutions.filter(i =>
                  i.id !== selectedInst.id &&
                  (!compareInstSearch || i.name.toLowerCase().includes(compareInstSearch.toLowerCase()) || i.short_name.toLowerCase().includes(compareInstSearch.toLowerCase()))
                ).length === 0 && (
                  <p className="text-center text-label-sm text-text-secondary py-lg">Không tìm thấy trường nào phù hợp.</p>
                )}
              </div>
            </div>
          )}
        </LiquidModal>
      )}

      {/* Professor Comparison Modal */}
      {selectedProf && (
        <LiquidModal
          isOpen={compareModal}
          onClose={() => { setCompareModal(false); setCompareProf(null) }}
          title="So sánh giảng viên"
          size="medium"
          footer={
            <ButtonGroup align="end">
              <Button variant="neutral" onClick={() => { setCompareModal(false); setCompareProf(null) }}>Đóng</Button>
            </ButtonGroup>
          }
        >
          {compareProf ? (
            <div className="flex flex-col gap-xl">
              <div className="grid grid-cols-2 gap-xl">
                {[{ prof: selectedProf, label: 'Hiện tại' }, { prof: compareProf, label: 'So sánh' }].map(({ prof, label }) => {
                  const s = calculateProfStats(prof.id)
                  return (
                    <div key={prof.id} className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 p-xl flex flex-col gap-lg">
                      <div>
                        <Badge label={label} variant={label === 'Hiện tại' ? 'brand' : 'secondary'} />
                        <p className="text-label text-text-primary font-semibold mt-sm">{prof.name}</p>
                        <p className="text-video-title text-text-secondary">{prof.department}</p>
                        <p className="text-video-title text-text-tertiary">{prof.university}</p>
                      </div>
                      <div className="flex flex-col gap-sm">
                        {[
                          { key: 'Chất lượng', val: s.avg_rating.toFixed(1) },
                          { key: 'Độ khó', val: s.avg_difficulty.toFixed(1) },
                          { key: 'Học lại', val: `${s.would_take_again_pct}%` },
                          { key: 'Đánh giá', val: s.total_ratings },
                        ].map(({ key, val }) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-video-title text-text-secondary">{key}</span>
                            <span className="text-label-sm text-text-primary font-semibold">{val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-xs">
                        {(prof.tags || []).map(t => <Badge key={t} label={t} variant="secondary" />)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button variant="subtle" size="small" onClick={() => setCompareProf(null)} iconStart={<X size={14} />}>
                Chọn lại
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              <p className="text-label-sm text-text-secondary">Tìm giảng viên để so sánh với <strong>{selectedProf.name}</strong></p>
              
              <div className="relative flex items-center gap-md bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 shadow-sm rounded-corner-md focus-within:border-brand-primary transition-colors px-xl">
                <Search size={18} className="text-text-secondary shrink-0" />
                <input
                  type="text"
                  value={compareSearch}
                  placeholder="Tìm theo tên giảng viên..."
                  onChange={e => setCompareSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full"
                />
              </div>

              <div className="flex gap-sm flex-wrap">
                <div className="flex-1 min-w-40">
                  <SearchableDropdown
                    placeholder="Lọc theo trường"
                    options={[
                      { value: '', label: 'Tất cả trường' },
                      ...institutions
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(i => ({ value: i.name, label: i.short_name + ' - ' + i.name })),
                    ]}
                    value={compareUniv}
                    onChange={v => { setCompareUniv(v); setCompareDept('') }}
                  />
                </div>
                <div className="flex-1 min-w-40">
                  <SearchableDropdown
                    placeholder="Lọc theo khoa"
                    options={[
                      { value: '', label: 'Tất cả khoa' },
                      ...(institutions.find(i => i.name === compareUniv)?.departments || [])
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map(d => ({ value: d, label: d })),
                    ]}
                    value={compareDept}
                    onChange={setCompareDept}
                    disabled={!compareUniv}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-sm max-h-64 overflow-y-auto">
                {professors
                  .filter(p =>
                    p.id !== selectedProf.id &&
                    (!compareSearch || p.name.toLowerCase().includes(compareSearch.toLowerCase())) &&
                    (!compareUniv || p.university === compareUniv) &&
                    (!compareDept || p.department === compareDept)
                  )
                  .slice(0, 8)
                  .map(p => {
                    const s = calculateProfStats(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCompareProf(p)}
                        className="flex items-center justify-between gap-lg p-lg rounded-corner-md bg-black/5 dark:bg-white/5 backdrop-blur-sm hover:bg-black/10 dark:hover:bg-white/10 hover:backdrop-blur-xl transition-colors text-left"
                      >
                        <div className="flex items-center gap-md">
                          <Avatar type="initial" initials={p.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                          <div>
                            <p className="text-label-sm text-text-primary">{p.name}</p>
                            <p className="text-video-title text-text-secondary">{p.department} • {p.university}</p>
                          </div>
                        </div>
                        <ScoreBadge value={s.avg_rating} />
                      </button>
                    )
                  })}
                {professors.filter(p =>
                  p.id !== selectedProf.id &&
                  (!compareSearch || p.name.toLowerCase().includes(compareSearch.toLowerCase())) &&
                  (!compareUniv || p.university === compareUniv) &&
                  (!compareDept || p.department === compareDept)
                ).length === 0 && (
                  <p className="text-label-sm text-text-tertiary text-center p-xl">Không tìm thấy giảng viên</p>
                )}
              </div>
            </div>
          )}
        </LiquidModal>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border-t border-black/5 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] flex items-stretch px-xs pb-safe">
        
        {/* Logo / Info Modal Trigger */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex-1 flex flex-col items-center justify-center gap-sm py-lg text-text-tertiary transition-colors"
        >
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-6 h-6 object-cover rounded-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: `rotate(${sidebarRotation}deg)` }}
          />
          <span className="text-video-title">Thông tin</span>
        </button>

        {/* Standard Nav Items */}
        {[
          { id: 'home', icon: Home, label: 'Trang chủ' },
          { id: 'suggest', icon: Plus, label: 'Đề xuất' },
          { id: 'bookmarks', icon: Bookmark, label: 'Đã lưu' }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-sm py-lg transition-colors ${
              activeSideNav === item.id || (item.id === 'bookmarks' && showBookmarkPanel)
                ? 'text-brand-primary'
                : 'text-text-tertiary hover:text-brand-primary'
            }`}
          >
            <item.icon size={24} strokeWidth={1.5} />
            <span className="text-video-title">{item.label}</span>
          </button>
        ))}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex-1 flex flex-col items-center justify-center gap-sm py-lg text-text-tertiary transition-colors hover:text-brand-primary"
        >
          {theme === 'dark' ? <Moon size={24} strokeWidth={1.5} /> : <Sun size={24} strokeWidth={1.5} />}
          <span className="text-video-title">{theme === 'dark' ? 'Tối' : 'Sáng'}</span>
        </button>
        
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-2xl right-2xl z-50 animate-scaleIn overflow-hidden">
          <Toast
            message={toast.message}
            variant={toast.variant}
            showCancel={false}
            progress={100}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
    </div>

    {/* Mobile bookmark sheet */}
    {showBookmarkPanel && (
      <div className="md:hidden fixed inset-0 z-50 flex flex-col">
        <div className="flex-1 bg-black/40" onClick={() => setShowBookmarkPanel(false)} />
        <div className="bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-t-2xl max-h-[70vh] flex flex-col animate-slideInLeft">
          <div className="p-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
            <h2 className="text-label text-text-primary font-semibold flex items-center gap-sm">
              <BookmarkCheck size={14} className="text-brand-primary" />
              Giảng viên đã lưu ({bookmarkedProfIds.length})
            </h2>
            <button 
              type="button" 
              onClick={() => setShowBookmarkPanel(false)} 
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
                  <div key={id} className="group flex items-start gap-sm p-sm rounded-corner-md hover:bg-black/5 dark:bg-white/5 hover:backdrop-blur-xl transition-colors">
                    <button
                      type="button"
                      onClick={() => { if (inst) { navigate('professor', inst, prof.department, prof); setShowBookmarkPanel(false) } }}
                      className="flex items-start gap-sm flex-1 min-w-0 text-left"
                    >
                      <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                      <div className="flex-1 min-w-0">
                        <p className="text-label-sm text-text-primary leading-tight">{prof.name}</p>
                        <p className="text-video-title text-text-secondary">{prof.department}</p>
                        {stats.avg_rating > 0 && <p className="text-video-title text-brand-primary">{stats.avg_rating.toFixed(1)} ★</p>}
                      </div>
                    </button>
                    <button type="button" onClick={() => toggleBookmark(id)} className="text-text-tertiary hover:text-danger transition-colors mt-xs shrink-0">
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
