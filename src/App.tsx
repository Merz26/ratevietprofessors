import { useState, useEffect, useRef, useContext, type FormEvent } from 'react'
import {
  SidebarNavigation,
  SidebarButton,
  Button,
  ButtonGroup,
  Avatar,
  Badge,
  Tooltip,
  Modal,
  InputField,
  TextareaField,
  SelectField,
  SearchComponent,
  Toast,
  useTheme,
} from '@figma/astraui'
import {
  Home,
  Star,
  LogOut,
  LogIn,
  MapPin,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Plus,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ShieldCheck,
  GraduationCap,
  Moon,
  Sun,
  GitCompare,
  X,
  Bookmark,
  BookmarkCheck,
  Settings,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import { ThemeContext } from './main'

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
  user_email: string
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
  user_email: string
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
  user_email: string
  status: string
  created_at?: string
}

interface CurrentUser {
  email: string
  name: string
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
  'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh','Trà Vinh',
  'Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
]

const PROF_TAGS = ['Nghiêm khắc','Bài giảng tuyệt vời','Tiêu chí chấm rõ ràng','Phản hồi tốt','Truyền cảm hứng','Nhiều bài tập','Tận tâm','Được tôn trọng']
const CRITERIA_KEYS = ['Uy tín trường','Địa điểm','Cơ hội việc làm','Cơ sở vật chất','Mạng Internet','Đồ ăn','Câu lạc bộ','Đời sống xã hội','Độ hài lòng','An toàn']
const GRADE_OPTIONS = ['A+','A','A-','B+','B','B-','C+','C','C-','D','F','Đạt','Chưa hoàn thành']

// ─── Rating color helpers ────────────────────────────────────────────────────
// Maps a 1–5 integer to Tailwind bg+text classes for the selected state
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

// Maps a numeric value (1–5) to a bar color class
const barColorClass = (v: number): string => {
  if (v >= 4.5) return 'bg-green-500'
  if (v >= 3.5) return 'bg-lime-500'
  if (v >= 2.5) return 'bg-yellow-400'
  if (v >= 1.5) return 'bg-orange-400'
  return 'bg-red-500'
}

// Compute a single review's own average from its metrics map
const reviewAvg = (metrics: Record<string, number>): number => {
  const vals = Object.values(metrics)
  if (!vals.length) return 0
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
}

// ==========================================
// SEARCHABLE DROPDOWN (for complex selects)
// ==========================================
function SearchableDropdown({
  options, value, onChange, placeholder, label,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  label?: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
    <div className="flex flex-col gap-xs" ref={ref}>
      {label && (
        <span className="text-label-sm text-text-secondary">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between px-xl py-lg bg-input-bg border border-border-primary rounded-corner-md text-label text-text-primary hover:border-border-selected transition-colors"
      >
        <span className={selected ? 'text-text-primary' : 'text-text-tertiary'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronRight
          size={16}
          className={`text-text-secondary transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface-overlay border border-border-primary rounded-corner-lg shadow-xl overflow-hidden animate-scaleIn">
          <div className="p-sm border-b border-border-primary bg-surface-overlay">
            <InputField
              value={search}
              placeholder="Tìm kiếm..."
              onChange={setSearch}
            />
          </div>
          <div className="max-h-56 overflow-y-auto bg-surface-overlay">
            {filtered.length === 0 ? (
              <p className="text-label-sm text-text-tertiary text-center p-xl">Không tìm thấy kết quả</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-xl py-lg text-label-sm transition-colors ${opt.value === value ? 'bg-brand-primary text-on-brand font-medium' : 'text-text-primary hover:bg-bg-hover'}`}
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
// SCORE BADGE
// ==========================================
function ScoreBadge({ value }: { value: number }) {
  if (value === 0) return <Badge label="N/A" variant="default" />
  const label = value.toFixed(1)
  if (value >= 4.5) return <Badge label={label} variant="success" />
  if (value >= 3.5) return (
    <span className="inline-flex items-center px-sm py-xs rounded-corner-sm text-label-sm font-medium bg-lime-500/15 text-lime-600 border border-lime-500/30">
      {label}
    </span>
  )
  if (value >= 2.5) return <Badge label={label} variant="warning" />
  return <Badge label={label} variant="danger" />
}

// ==========================================
// RATING SELECTOR (1-5 buttons)
// ==========================================
function RatingSelector({
  label, value, onChange, lowLabel, highLabel,
}: {
  label: string; value: number; onChange: (n: number) => void; lowLabel?: string; highLabel?: string
}) {
  return (
    <div className="flex flex-col gap-sm">
      <span className="text-label text-text-primary">{label}</span>
      <div className="flex gap-md">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-12 rounded-corner-md text-label transition-all border font-medium ${
              value === n
                ? ratingSelectedClass(n)
                : 'bg-bg-faint border-border-primary text-text-primary hover:bg-bg-hover'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-video-title text-text-tertiary">
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
    <div className="flex items-center justify-end gap-xl pt-lg border-t border-border-secondary">
      <button
        type="button"
        onClick={() => onVote(review.id, 'helpful')}
        className={`flex items-center gap-xs text-label-sm transition-colors ${review.userVote === 'helpful' ? 'text-brand-primary' : 'text-text-secondary hover:text-brand-primary'}`}
      >
        <ThumbsUp size={14} />
        <span>{review.helpful || 0}</span>
      </button>
      <button
        type="button"
        onClick={() => onVote(review.id, 'not_helpful')}
        className={`flex items-center gap-xs text-label-sm transition-colors ${review.userVote === 'not_helpful' ? 'text-danger' : 'text-text-secondary hover:text-danger'}`}
      >
        <ThumbsDown size={14} />
        <span>{review.not_helpful || 0}</span>
      </button>
      <button type="button" className="flex items-center gap-xs text-label-sm text-text-secondary hover:text-danger transition-colors">
        <Flag size={14} />
      </button>
    </div>
  )
}

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  useTheme()
  const { theme, setTheme } = useContext(ThemeContext)

  // Auth — localStorage is synchronous so session is available on first render
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const raw = localStorage.getItem('mock_session')
      if (!raw) return null
      const u = JSON.parse(raw)
      return { email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0] }
    } catch {
      return null
    }
  })
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authModal, setAuthModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'default' | 'success' | 'error' } | null>(null)
  // Password recovery modal (triggered by ?type=recovery in URL hash)
  const [recoveryModal, setRecoveryModal] = useState(false)
  const [recoveryPassword, setRecoveryPassword] = useState('')

  // Account page state
  const [accountTab, setAccountTab] = useState<'profile' | 'security' | 'settings'>('profile')
  const [editName, setEditName] = useState('')
  const [editInstitution, setEditInstitution] = useState('')
  const [editLanguage, setEditLanguage] = useState('vi')
  const [productUpdates, setProductUpdates] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  // Bookmarks
  const [bookmarkedProfIds, setBookmarkedProfIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('bookmarked_professors')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)

  // Comparison state
  const [compareModal, setCompareModal] = useState(false)
  const [compareSearch, setCompareSearch] = useState('')
  const [compareUniv, setCompareUniv] = useState('')
  const [compareDept, setCompareDept] = useState('')
  const [compareProf, setCompareProf] = useState<Professor | null>(null)

  // Data
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [instReviews, setInstReviews] = useState<InstitutionReview[]>([])
  const [profReviews, setProfReviews] = useState<ProfessorReview[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Navigation
  const [currentView, setCurrentView] = useState('home')
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedProf, setSelectedProf] = useState<Professor | null>(null)
  const [activeSideNav, setActiveSideNav] = useState('home') // home|ratings|suggest|profile

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<Institution[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews'>('name')
  const [locationFilter, setLocationFilter] = useState('')
  const [deptSearchTerm, setDeptSearchTerm] = useState('')
  const [profSort, setProfSort] = useState('newest')
  const [profTagFilter, setProfTagFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 16

  // Prof review form
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
  const [instMetrics, setInstMetrics] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA_KEYS.map(k => [k, 5]))
  )
  const [instReviewComment, setInstReviewComment] = useState('')

  // Suggest form
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

  // Detect Supabase password recovery redirect (type=recovery in URL hash)
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setRecoveryModal(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // Fetch info and review data
  useEffect(() => {
    const fetchRealData = async () => {
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
      }
    };

    fetchRealData();
  }, []);

  // Predictive search suggestions
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const matches = institutions.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.short_name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleInstVote = (id: string, vote: 'helpful' | 'not_helpful') => {
    if (!currentUser) { setAuthModal(true); return }
    setInstReviews(prev => prev.map(r => {
      if (r.id !== id) return r
      let h = r.helpful, nh = r.not_helpful
      let newVote: typeof r.userVote = vote
      if (r.userVote === vote) { vote === 'helpful' ? h-- : nh--; newVote = null }
      else if (r.userVote === 'helpful') { h--; nh++ }
      else if (r.userVote === 'not_helpful') { nh--; h++ }
      else { vote === 'helpful' ? h++ : nh++ }
      return { ...r, helpful: h, not_helpful: nh, userVote: newVote }
    }))
  }

  const toggleBookmark = async (profId: number) => {
    if (!currentUser) { setAuthModal(true); return }
    const isBookmarked = bookmarkedProfIds.includes(profId)
    const updated = isBookmarked
      ? bookmarkedProfIds.filter(id => id !== profId)
      : [...bookmarkedProfIds, profId]
    setBookmarkedProfIds(updated)
    try { localStorage.setItem('bookmarked_professors', JSON.stringify(updated)) } catch { /* ignore */ }
    try { await (supabase.auth as any).updateUser({ data: { bookmarked_professors: updated } }) } catch { /* ignore */ }
    showToast(isBookmarked ? 'Đã xóa khỏi danh sách lưu' : 'Đã lưu giảng viên', isBookmarked ? 'default' : 'success')
  }

  const handleProfVote = (id: string, vote: 'helpful' | 'not_helpful') => {
    if (!currentUser) { setAuthModal(true); return }
    setProfReviews(prev => prev.map(r => {
      if (r.id !== id) return r
      let h = r.helpful || 0, nh = r.not_helpful || 0
      let newVote: typeof r.userVote = vote
      if (r.userVote === vote) { vote === 'helpful' ? h-- : nh--; newVote = null }
      else if (r.userVote === 'helpful') { h--; nh++ }
      else if (r.userVote === 'not_helpful') { nh--; h++ }
      else { vote === 'helpful' ? h++ : nh++ }
      return { ...r, helpful: h, not_helpful: nh, userVote: newVote }
    }))
  }

  // ==========================================
  // AUTH HANDLERS
  // ==========================================
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) { showToast(error.message, 'error'); return }
    if (data?.user) {
      setCurrentUser({ email: data.user.email ?? '', name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] })
    }
    setAuthModal(false)
    showToast('Đăng nhập thành công!', 'success')
    setAuthEmail(''); setAuthPassword('')
  }

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { full_name: authName } } })
    if (error) { showToast(error.message, 'error'); return }
    if (data?.user) {
      setCurrentUser({ email: data.user.email ?? '', name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] })
    }
    setAuthModal(false)
    showToast('Tài khoản đã được tạo thành công!', 'success')
    setAuthEmail(''); setAuthPassword(''); setAuthName('')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setCurrentView('home')
    showToast('Đã đăng xuất', 'default')
  }

  // ==========================================
  // NAVIGATION
  // ==========================================
  const navigate = (view: string, inst?: Institution, dept?: string, prof?: Professor) => {
    setCurrentView(view)
    if (inst !== undefined) setSelectedInst(inst)
    if (dept !== undefined) setSelectedDept(dept)
    if (prof !== undefined) setSelectedProf(prof)
    if (view === 'home') { setSelectedInst(null); setSelectedDept(null); setSelectedProf(null) }
  }

  // ==========================================
  // SECONDARY NAV ITEMS
  // ==========================================
  const secondaryNavTitle = () => {
    if (activeSideNav === 'ratings') return 'Đánh giá'
    if (activeSideNav === 'suggest') return 'Đề xuất'
    if (activeSideNav === 'profile') return 'Tài khoản'
    return 'Trường Đại học'
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
      <div className="flex items-center gap-xs flex-wrap mb-2xl">
        {crumbs.map((c, i) => (
          <div key={i} className="flex items-center gap-xs">
            {i > 0 && <ChevronRight size={12} className="text-text-tertiary" />}
            {c.onClick ? (
              <button onClick={c.onClick} className="text-label-sm text-brand-primary hover:underline">
                {c.label}
              </button>
            ) : (
              <span className="text-label-sm text-text-secondary">{c.label}</span>
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
    const locationOptions = [
      { value: '', label: 'Tất cả tỉnh thành' },
      ...VIETNAM_PROVINCES.map(p => ({ value: p, label: p })),
    ]

    const filtered = institutions.filter(inst => {
      const matchSearch = !searchTerm ||
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.short_name.toLowerCase().includes(searchTerm.toLowerCase())
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
        {/* Hero search */}
        <div className="bg-surface-bg rounded-corner-lg p-2xl flex flex-col gap-xl">
          <div className="flex flex-col gap-xs">
            <h1 className="text-title text-text-primary">Tìm kiếm Trường Đại học</h1>
            <p className="text-label-sm text-text-secondary">Xem đánh giá thực tế từ sinh viên về trường và giảng viên</p>
          </div>

          {/* Search with predictive suggestions */}
          <div className="relative">
            <SearchComponent
              value={searchTerm}
              placeholder="Tìm kiếm theo tên trường hoặc mã trường..."
              onChange={val => setSearchTerm(val)}
              onSearch={() => setShowSearchSuggestions(false)}
            />

            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-xs bg-surface-bg border border-border-primary rounded-corner-lg shadow-lg z-40 animate-scaleIn overflow-hidden">
                {searchSuggestions.map(inst => {
                  const stats = calculateInstStats(inst.id)
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => { navigate('institution', inst); setSearchTerm(''); setShowSearchSuggestions(false) }}
                      className="w-full flex items-center justify-between px-xl py-lg hover:bg-bg-hover transition-colors text-left"
                    >
                      <div className="flex items-center gap-lg">
                        <div className="w-8 h-8 bg-brand-tertiary rounded-corner-md flex items-center justify-center">
                          <GraduationCap size={14} className="text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-label text-text-primary">{inst.name}</p>
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

          {/* Filters */}
          <div className="flex items-center gap-lg flex-wrap">
            <div className="flex items-center gap-sm text-label-sm text-text-secondary">
              <Filter size={14} />
              <span>Lọc:</span>
            </div>
            <div className="w-48">
              <SelectField
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

        {/* Institution grid */}
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
                  className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg text-left border border-border-primary hover:border-brand-primary hover:shadow-sm transition-all group animate-scaleIn"
                >
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex flex-col gap-xs flex-1 min-w-0">
                      <Badge label={inst.short_name} variant="brand" />
                      <h3 className="text-label text-text-primary leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
                        {inst.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-video-title text-text-secondary flex items-center gap-xs">
                    <MapPin size={11} />
                    {inst.location}
                  </p>
                  <div className="flex items-center justify-between pt-lg border-t border-border-secondary">
                    <ScoreBadge value={stats.overall} />
                    <span className="text-video-title text-text-secondary">{stats.total} đánh giá</span>
                  </div>
                </button>
              )
            })}
          </div>

          {paginated.length === 0 && (
            <div className="bg-surface-bg rounded-corner-lg p-2xl text-center">
              <p className="text-label text-text-secondary">Không tìm thấy trường phù hợp</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-lg mt-2xl">
              <Button
                variant="neutral"
                size="small"
                iconStart={<ChevronLeft size={16} />}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-label-sm text-text-secondary">{currentPage} / {totalPages}</span>
              <Button
                variant="neutral"
                size="small"
                iconEnd={<ChevronRight size={16} />}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
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
    if (!selectedInst) return null
    const stats = calculateInstStats(selectedInst.id)
    const reviews = instReviews.filter(r => r.inst_id === selectedInst.id)

    const leftCriteria = CRITERIA_KEYS.slice(0, 5)
    const rightCriteria = CRITERIA_KEYS.slice(5)

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        {renderBreadcrumb()}

        {/* Header */}
        <div className="bg-surface-bg rounded-corner-lg p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
          <div className="flex flex-col gap-xs">
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
              onClick={() => alert('So sánh - sắp ra mắt!')}
            >
              So sánh
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => {
                if (!currentUser) { setAuthModal(true); return }
                navigate('add-inst-review')
              }}
            >
              Đánh giá
            </Button>
          </ButtonGroup>
        </div>

        {/* Stats card */}
        <div className="bg-surface-bg rounded-corner-lg p-2xl grid grid-cols-1 lg:grid-cols-3 gap-xl items-center">
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

        {/* Departments */}
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
                  className="bg-surface-bg rounded-corner-lg p-xl border border-border-primary hover:border-brand-primary text-left flex flex-col gap-lg transition-all group animate-slideInLeft"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex flex-col gap-xs">
                    <h3 className="text-label text-text-primary group-hover:text-brand-primary transition-colors">{dept}</h3>
                    <p className="text-video-title text-text-secondary">{deptProfs.length} giảng viên</p>
                  </div>
                  <div className="flex items-center justify-end text-brand-primary">
                    <ChevronRight size={16} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Reviews */}
        <div className="flex flex-col gap-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-heading text-text-primary">Đánh giá cơ sở</h2>
            <Badge label={`${stats.total} đánh giá`} variant="default" />
          </div>

          {reviews.length === 0 ? (
            <div className="bg-surface-bg rounded-corner-lg p-2xl text-center border border-border-secondary" style={{ borderStyle: 'dashed' }}>
              <p className="text-label text-text-secondary">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            reviews.map(rev => {
              const revScore = reviewAvg(rev.metrics || {})
              return (
                <div key={rev.id} className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg animate-fadeIn">
                  <div className="flex items-start justify-between gap-lg">
                    <div className="flex items-center gap-lg">
                      <div className="flex flex-col items-center bg-bg-faint rounded-corner-md p-md min-w-[56px]">
                        <span className={`text-label font-semibold ${revScore >= 4 ? 'text-green-500' : revScore >= 3 ? 'text-yellow-400' : 'text-red-500'}`}>
                          {revScore.toFixed(1)}
                        </span>
                        <span className="text-video-title text-text-tertiary">/ 5</span>
                      </div>
                      <div>
                        <p className="text-label-sm text-text-secondary">{rev.user_email}</p>
                        <p className="text-video-title text-text-tertiary">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-label text-text-primary">{rev.comment}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                    {Object.entries(rev.metrics || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-xs">
                        <span className="text-label-sm text-text-secondary">{key}</span>
                        <div className="flex gap-xs">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-1.5 w-5 rounded-full ${s <= Number(val) ? barColorClass(Number(val)) : 'bg-bg-subtle'}`} />
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
    if (!selectedInst || !selectedDept) return null
    const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === selectedDept)
    const filtered = deptProfs.filter(p => p.name.toLowerCase().includes(deptSearchTerm.toLowerCase()))

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        {renderBreadcrumb()}

        <div className="bg-surface-bg rounded-corner-lg p-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
          <div className="flex flex-col gap-xs">
            <p className="text-label-sm text-text-secondary">{selectedInst.name}</p>
            <h1 className="text-title text-text-primary">{selectedDept}</h1>
            <p className="text-label-sm text-text-secondary">{deptProfs.length} giảng viên</p>
          </div>
          <Button
            variant="neutral"
            size="small"
            iconStart={<Plus size={16} />}
            onClick={() => { if (!currentUser) { setAuthModal(true); return } navigate('suggest') }}
          >
            Thêm giảng viên
          </Button>
        </div>

        <div className="bg-surface-bg rounded-corner-lg p-xl">
          <SearchComponent
            value={deptSearchTerm}
            placeholder="Tìm kiếm giảng viên..."
            onChange={setDeptSearchTerm}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {filtered.length === 0 ? (
            <div className="col-span-2 bg-surface-bg rounded-corner-lg p-2xl text-center">
              <p className="text-label text-text-secondary">Không tìm thấy giảng viên</p>
            </div>
          ) : (
            filtered.map((prof, idx) => {
              const stats = calculateProfStats(prof.id)
              const isBookmarked = bookmarkedProfIds.includes(prof.id)
              return (
                <div
                  key={prof.id}
                  className="bg-surface-bg rounded-corner-lg p-xl border border-border-primary hover:border-brand-primary text-left flex flex-col gap-lg transition-all animate-fadeIn relative"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggleBookmark(prof.id) }}
                    className={`absolute top-xl right-xl transition-colors ${isBookmarked ? 'text-brand-primary' : 'text-text-tertiary hover:text-brand-primary'}`}
                    title={isBookmarked ? 'Xóa bookmark' : 'Lưu giảng viên'}
                  >
                    {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('professor', selectedInst, selectedDept, prof)}
                    className="flex flex-col gap-lg text-left"
                  >
                  <div className="flex items-start justify-between gap-lg pr-6">
                    <div className="flex items-center gap-lg">
                      <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="medium" shape="circle" />
                      <div>
                        <h3 className="text-label text-text-primary">{prof.name}</h3>
                        <p className="text-video-title text-text-secondary">{stats.total_ratings} đánh giá</p>
                      </div>
                    </div>
                    <ScoreBadge value={stats.avg_rating} />
                  </div>

                  <div className="flex gap-xl pt-lg border-t border-border-secondary">
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
    if (!selectedProf || !selectedInst) return null
    const stats = calculateProfStats(selectedProf.id)
    let reviews = profReviews.filter(r => r.prof_id === selectedProf.id)

    if (profSort === 'highest-quality') reviews.sort((a, b) => b.teaching_rating - a.teaching_rating)
    else if (profSort === 'lowest-quality') reviews.sort((a, b) => a.teaching_rating - b.teaching_rating)
    else if (profSort === 'highest-difficulty') reviews.sort((a, b) => b.difficulty_rating - a.difficulty_rating)
    else reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (profTagFilter !== 'all') reviews = reviews.filter(r => r.tags?.includes(profTagFilter))

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => { const rating = Math.round(r.teaching_rating); if (rating >= 1 && rating <= 5) distribution[rating]++ })
    const maxDist = Math.max(...Object.values(distribution), 1)

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn">
        {renderBreadcrumb()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* Left: Overall stats */}
          <div className="bg-surface-bg rounded-corner-lg p-2xl flex flex-col gap-xl">
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
                onClick={() => {
                  if (!currentUser) { setAuthModal(true); return }
                  navigate('add-prof-review')
                }}
              >
                Đánh giá
              </Button>
            </ButtonGroup>
          </div>

          {/* Right: Distribution + tags + similar */}
          <div className="flex flex-col gap-xl">
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <h3 className="text-label text-text-primary font-semibold">Tổng hợp đánh giá</h3>
              {([5, 4, 3, 2, 1] as const).map(star => (
                <div key={star} className="flex items-center gap-lg">
                  <span className="text-label-sm text-text-secondary w-20 shrink-0">{star} sao</span>
                  <div className="flex-1 bg-bg-faint rounded-full h-2 overflow-hidden">
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
              <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
                <h3 className="text-label text-text-primary font-semibold">Đặc điểm nổi bật</h3>
                <div className="flex flex-wrap gap-sm">
                  {selectedProf.tags.map(t => (
                    <Badge key={t} label={t} variant="secondary" />
                  ))}
                </div>
              </div>
            )}

            {/* Similarity suggestions */}
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
                <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
                  <h3 className="text-label text-text-primary font-semibold">Giảng viên tương tự</h3>
                  {similarProfs.map(({ prof, s }) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => navigate('professor', selectedInst!, selectedDept!, prof)}
                      className="flex items-center justify-between gap-lg hover:bg-bg-hover p-sm rounded-corner-md transition-colors text-left"
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

        {/* Tag chip search + sort toolbar */}
        <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
          <div className="flex flex-col sm:flex-row gap-lg items-start sm:items-center justify-between">
            <div className="flex flex-col gap-sm flex-1">
              <span className="text-label-sm text-text-secondary">Lọc theo thẻ:</span>
              <div className="flex flex-wrap gap-sm">
                <button
                  type="button"
                  onClick={() => setProfTagFilter('all')}
                  className={`px-lg py-xs rounded-full text-label-sm border transition-all ${profTagFilter === 'all' ? 'bg-brand-primary text-on-brand border-brand-primary' : 'bg-bg-faint border-border-primary text-text-primary hover:border-border-selected'}`}
                >
                  Tất cả
                </button>
                {(selectedProf.tags || []).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProfTagFilter(t === profTagFilter ? 'all' : t)}
                    className={`px-lg py-xs rounded-full text-label-sm border transition-all ${profTagFilter === t ? 'bg-brand-primary text-on-brand border-brand-primary' : 'bg-bg-faint border-border-primary text-text-primary hover:border-border-selected'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-lg shrink-0">
              <span className="text-label-sm text-text-secondary whitespace-nowrap">Sắp xếp:</span>
              <div className="w-52">
                <SelectField
                  options={[
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'highest-quality', label: 'Chất lượng cao nhất' },
                    { value: 'lowest-quality', label: 'Chất lượng thấp nhất' },
                    { value: 'highest-difficulty', label: 'Độ khó cao nhất' },
                  ]}
                  value={profSort}
                  onChange={setProfSort}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="flex flex-col gap-lg">
          <h2 className="text-heading text-text-primary">Đánh giá từ sinh viên</h2>
          {reviews.length === 0 ? (
            <div className="bg-surface-bg rounded-corner-lg p-2xl text-center border border-border-secondary" style={{ borderStyle: 'dashed' }}>
              <p className="text-label text-text-secondary">Không có đánh giá phù hợp với bộ lọc</p>
            </div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between gap-lg">
                  <div className="flex gap-lg">
                    <div className="bg-bg-faint rounded-corner-md p-md text-center min-w-[64px]">
                      <p className="text-video-title text-text-tertiary uppercase">Chất lượng</p>
                      <p className={`text-heading font-semibold ${rev.teaching_rating >= 4 ? 'text-green-500' : rev.teaching_rating >= 3 ? 'text-yellow-400' : 'text-red-500'}`}>
                        {rev.teaching_rating.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-bg-faint rounded-corner-md p-md text-center min-w-[64px]">
                      <p className="text-video-title text-text-tertiary uppercase">Độ khó</p>
                      <p className={`text-heading font-semibold ${rev.difficulty_rating >= 4 ? 'text-red-500' : rev.difficulty_rating >= 3 ? 'text-yellow-400' : 'text-green-500'}`}>
                        {rev.difficulty_rating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-label text-text-primary">{rev.course}</p>
                    <p className="text-video-title text-text-secondary">{rev.user_email}</p>
                    <p className="text-video-title text-text-tertiary">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-sm">
                  {[
                    ['Tính điểm', rev.for_credit],
                    ['Học lại', rev.would_take_again ? 'Có' : 'Không'],
                    ['Điểm', rev.grade],
                    ['Giáo trình', rev.textbook],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-bg-faint rounded-corner-md px-lg py-xs">
                      <span className="text-video-title text-text-secondary">{k}: </span>
                      <span className="text-video-title text-text-primary font-medium">{v}</span>
                    </div>
                  ))}
                </div>

                <p className="text-label text-text-primary">{rev.comment}</p>

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-sm">
                    {rev.tags.map(t => <Badge key={t} label={t} variant="secondary" />)}
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
      if (!currentUser) { setAuthModal(true); return }
      if (!reviewCourse.trim() || !reviewComment.trim()) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return }

      const newRev = {
        prof_id: selectedProf.id, user_email: currentUser.email,
        course: reviewCourse.trim(), teaching_rating: reviewTeaching, difficulty_rating: reviewDifficulty,
        would_take_again: reviewWouldTakeAgain, for_credit: reviewForCredit, textbook: reviewTextbook,
        attendance: reviewAttendance, grade: reviewGrade, tags: reviewSelectedTags, comment: reviewComment.trim(),
        helpful: 0, not_helpful: 0,
      }

      const { data, error } = await supabase.from('professor_reviews').insert([newRev]).select() as any
      if (error) { showToast(error.message, 'error'); return }
      if (data) setProfReviews(prev => [{ ...data[0], userVote: null } as ProfessorReview, ...prev])
      showToast('Đánh giá đã được gửi thành công!', 'success')
      setTimeout(() => navigate('professor'), 1200)
    }

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-2xl mx-auto">
        {renderBreadcrumb()}

        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Đánh giá {selectedProf.name}</h1>
          <p className="text-label-sm text-text-secondary">{selectedProf.department} • {selectedProf.university}</p>
          {currentUser && <p className="text-video-title text-brand-primary">Đăng với tư cách: {currentUser.email}</p>}
        </div>

        <form onSubmit={handleSub} className="flex flex-col gap-xl">
          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
            <InputField
              label="Mã môn học *"
              placeholder="VD: CS101, MTH201..."
              value={reviewCourse}
              onChange={setReviewCourse}
            />
          </div>

          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-xl">
            <RatingSelector label="Đánh giá giảng viên *" value={reviewTeaching} onChange={setReviewTeaching} lowLabel="1 - Rất tệ" highLabel="5 - Tuyệt vời" />
            <RatingSelector label="Độ khó môn học *" value={reviewDifficulty} onChange={setReviewDifficulty} lowLabel="1 - Rất dễ" highLabel="5 - Rất khó" />
          </div>

          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
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

            <SelectField
              label="Điểm số đạt được"
              options={GRADE_OPTIONS.map(g => ({ value: g, label: g }))}
              value={reviewGrade}
              onChange={setReviewGrade}
            />
          </div>

          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
            <p className="text-label text-text-primary">Chọn tối đa 3 thẻ đặc điểm</p>
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
                    className={`px-lg py-sm rounded-corner-md text-label-sm border transition-all ${sel ? 'bg-brand-primary text-on-brand border-brand-primary' : 'bg-bg-faint border-border-primary text-text-primary hover:border-border-selected'}`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-surface-bg rounded-corner-lg p-xl">
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
      if (!currentUser) { setAuthModal(true); return }
      if (!instReviewComment.trim()) { showToast('Vui lòng nhập nhận xét', 'error'); return }

      const newRev = { inst_id: selectedInst.id, user_email: currentUser.email, metrics: { ...instMetrics }, comment: instReviewComment.trim(), helpful: 0, not_helpful: 0 }
      const { data, error } = await supabase.from('institution_reviews').insert([newRev]).select() as any
      if (error) { showToast(error.message, 'error'); return }
      if (data) setInstReviews(prev => [{ ...data[0], userVote: null } as InstitutionReview, ...prev])
      showToast('Đánh giá trường đã được gửi!', 'success')
      setTimeout(() => navigate('institution'), 1200)
    }

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-2xl mx-auto">
        {renderBreadcrumb()}
        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Đánh giá {selectedInst.name}</h1>
          <p className="text-label-sm text-text-secondary">{selectedInst.location}</p>
          {currentUser && <p className="text-video-title text-brand-primary">Đăng với tư cách: {currentUser.email}</p>}
        </div>

        <form onSubmit={handleSub} className="flex flex-col gap-xl">
          {CRITERIA_KEYS.map(criteria => (
            <div key={criteria} className="bg-surface-bg rounded-corner-lg p-xl">
              <RatingSelector
                label={`${criteria} *`}
                value={instMetrics[criteria]}
                onChange={val => setInstMetrics(prev => ({ ...prev, [criteria]: val }))}
                lowLabel="1 - Rất tệ"
                highLabel="5 - Tuyệt vời"
              />
            </div>
          ))}

          <div className="bg-surface-bg rounded-corner-lg p-xl">
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
    const univOptions = institutions.map(i => ({ value: i.name, label: `${i.short_name} - ${i.name}` }))
    const selectedUnivObj = institutions.find(i => i.name === suggSelectedUniv)
    const deptOptions = selectedUnivObj?.departments?.map(d => ({ value: d, label: d })) || []
    const provinceOptions = VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      if (!currentUser) { setAuthModal(true); return }

      let newSugg: Partial<Suggestion> = { type: suggestionType, user_email: currentUser.email, content: suggestionContent.trim(), status: 'Chờ xét duyệt' }

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
      setSuggProfName(''); setSuggInstName(''); setSuggInstShortName(''); setSuggInstLocation(''); setSuggInstDepts(''); setSuggNewDeptName(''); setSuggestionContent('')
    }

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-2xl mx-auto">
        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Đề xuất thêm dữ liệu</h1>
          <p className="text-label-sm text-text-secondary">Gửi đề xuất thêm trường, khoa hoặc giảng viên mới vào hệ thống</p>
          {currentUser && <p className="text-video-title text-brand-primary">Đăng với tư cách: {currentUser.email}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
            <SelectField
              label="Loại đề xuất *"
              options={[
                { value: 'professor', label: 'Giảng viên mới' },
                { value: 'institution', label: 'Trường đại học mới' },
                { value: 'department', label: 'Khoa / Viện mới' },
              ]}
              value={suggestionType}
              onChange={v => setSuggestionType(v as any)}
            />

            {suggestionType === 'professor' && (
              <div className="flex flex-col gap-lg">
                <InputField label="Tên giảng viên *" placeholder="VD: PGS. TS Nguyễn Văn B" value={suggProfName} onChange={setSuggProfName} />
                <SelectField label="Trường đại học *" placeholder="-- Chọn trường --" options={univOptions} value={suggSelectedUniv} onChange={v => { setSuggSelectedUniv(v); setSuggSelectedDept('') }} />
                <SelectField label="Khoa / Viện *" placeholder={suggSelectedUniv ? '-- Chọn khoa --' : 'Chọn trường trước'} options={deptOptions} value={suggSelectedDept} onChange={setSuggSelectedDept} disabled={!suggSelectedUniv} />
              </div>
            )}

            {suggestionType === 'institution' && (
              <div className="flex flex-col gap-lg">
                <InputField label="Tên đầy đủ *" placeholder="VD: Trường Đại học Ngoại thương" value={suggInstName} onChange={setSuggInstName} />
                <InputField label="Tên viết tắt *" placeholder="VD: FTU" value={suggInstShortName} onChange={setSuggInstShortName} />
                <SelectField label="Tỉnh / Thành phố *" placeholder="-- Chọn tỉnh thành --" options={provinceOptions} value={suggInstLocation} onChange={setSuggInstLocation} />
                <InputField label="Danh sách khoa (phân cách bằng dấu phẩy)" placeholder="Khoa A, Khoa B..." value={suggInstDepts} onChange={setSuggInstDepts} />
              </div>
            )}

            {suggestionType === 'department' && (
              <div className="flex flex-col gap-lg">
                <SelectField label="Trường đại học *" placeholder="-- Chọn trường --" options={univOptions} value={suggSelectedUniv} onChange={setSuggSelectedUniv} />
                <InputField label="Tên Khoa / Viện mới *" placeholder="VD: Khoa Khởi nghiệp..." value={suggNewDeptName} onChange={setSuggNewDeptName} />
              </div>
            )}
          </div>

          <div className="bg-surface-bg rounded-corner-lg p-xl">
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
          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
            <h2 className="text-heading text-text-primary">Đề xuất của bạn ({suggestions.length})</h2>
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
  // AUTH MODAL
  // ==========================================
  const renderAuthModal = () => (
    <Modal
      isOpen={authModal}
      onClose={() => { setAuthModal(false); setAuthEmail(''); setAuthPassword(''); setAuthName('') }}
      title={authView === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
      size="small"
      footer={
        <ButtonGroup align="stack">
          <Button
            variant="primary"
            onClick={() => {
              const form = document.getElementById('auth-form') as HTMLFormElement
              form?.requestSubmit()
            }}
          >
            {authView === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </Button>
          <Button
            variant="subtle"
            onClick={() => setAuthView(v => v === 'login' ? 'signup' : 'login')}
          >
            {authView === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </Button>
        </ButtonGroup>
      }
    >
      <form id="auth-form" onSubmit={authView === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-lg">
        {authView === 'signup' && (
          <InputField label="Họ và tên" placeholder="Nguyễn Văn A" value={authName} onChange={setAuthName} />
        )}
        <InputField label="Email" placeholder="email@edu.vn" value={authEmail} onChange={setAuthEmail} type="email" />
        <InputField label="Mật khẩu" placeholder="••••••••" value={authPassword} onChange={setAuthPassword} type="password" />
      </form>
    </Modal>
  )

  // ==========================================
  // ACCOUNT PAGE
  // ==========================================
  const renderAccountPage = () => {
    const initials = currentUser?.name?.charAt(0)?.toUpperCase() || 'U'
    const myProfReviews = profReviews.filter(r => r.user_email === currentUser?.email)
    const myInstReviews = instReviews.filter(r => r.user_email === currentUser?.email)

    const handleSaveProfile = () => {
      if (!editName.trim()) { showToast('Tên hiển thị không được để trống', 'error'); return }
      if (currentUser) {
        const updated = { ...currentUser, name: editName.trim() }
        setCurrentUser(updated)
        try {
          const raw = localStorage.getItem('mock_session')
          if (raw) {
            const u = JSON.parse(raw)
            u.user_metadata = { ...u.user_metadata, full_name: editName.trim() }
            localStorage.setItem('mock_session', JSON.stringify(u))
          }
        } catch { /* ignore */ }
      }
      showToast('Đã lưu thông tin hồ sơ', 'success')
    }

    const handleChangePassword = () => {
      if (!currentPassword || !newPassword) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return }
      if (newPassword.length < 6) { showToast('Mật khẩu mới phải ít nhất 6 ký tự', 'error'); return }
      try {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        const idx = users.findIndex((u: any) => u.email === currentUser?.email)
        if (idx === -1 || users[idx].password !== currentPassword) {
          showToast('Mật khẩu hiện tại không đúng', 'error'); return
        }
        users[idx].password = newPassword
        localStorage.setItem('mock_users', JSON.stringify(users))
      } catch { /* ignore */ }
      setCurrentPassword(''); setNewPassword('')
      showToast('Đã đổi mật khẩu thành công', 'success')
    }

    const handleDeleteAccount = () => {
      if (!confirm('Bạn có chắc muốn xóa tài khoản? Thao tác này không thể hoàn tác.')) return
      try {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        localStorage.setItem('mock_users', JSON.stringify(users.filter((u: any) => u.email !== currentUser?.email)))
      } catch { /* ignore */ }
      supabase.auth.signOut()
      setCurrentUser(null)
      navigate('home')
      showToast('Tài khoản đã bị xóa', 'default')
    }

    return (
      <div className="flex flex-col gap-2xl animate-fadeIn max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-xl">
          <Avatar type="initial" initials={initials} size="large" shape="circle" />
          <div>
            <h1 className="text-title text-text-primary">{currentUser?.name}</h1>
            <div className="flex items-center gap-sm mt-xs flex-wrap">
              <p className="text-label-sm text-text-secondary">{currentUser?.email}</p>
              <Badge label="Email chưa xác minh" variant="warning" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-sm border-b border-border-primary">
          {(['profile', 'security', 'settings'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setAccountTab(tab)}
              className={`flex items-center gap-sm px-lg pb-lg text-label-sm font-medium transition-colors border-b-2 -mb-px ${
                accountTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'profile' ? 'Hồ sơ' : tab === 'security' ? 'Bảo mật' : 'Cài đặt'}
            </button>
          ))}
        </div>

        {accountTab === 'profile' && (
          <div className="flex flex-col gap-xl">
            {/* Profile picture */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <div>
                <h2 className="text-label text-text-primary font-semibold">Ảnh đại diện</h2>
                <p className="text-label-sm text-text-secondary mt-xs">Hiển thị cùng tên bạn. PNG hoặc JPEG, tối đa 5 MB.</p>
              </div>
              <div className="flex items-center gap-xl">
                <Avatar type="initial" initials={initials} size="large" shape="circle" />
                <Button variant="neutral" size="small" onClick={() => showToast('Tính năng đang phát triển', 'default')}>
                  Tải ảnh lên
                </Button>
              </div>
            </div>

            {/* Basic info */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <h2 className="text-label text-text-primary font-semibold">Thông tin cơ bản</h2>
              <InputField
                label="Tên hiển thị"
                value={editName}
                onChange={setEditName}
                placeholder="Nhập tên hiển thị..."
              />
              <InputField
                label="Trường / Cơ sở (tùy chọn)"
                value={editInstitution}
                onChange={setEditInstitution}
                placeholder="VD: Trường Đại học Ngoại thương"
              />
              <div className="flex flex-col gap-xs">
                <InputField
                  label="Email"
                  value={currentUser?.email || ''}
                  onChange={() => {}}
                  type="email"
                />
                <p className="text-video-title text-text-tertiary">Email không thể thay đổi lúc này.</p>
              </div>
              <SelectField
                label="Ngôn ngữ giao diện"
                options={[
                  { value: 'vi', label: 'Tiếng Việt' },
                  { value: 'en', label: 'English' },
                ]}
                value={editLanguage}
                onChange={setEditLanguage}
              />
              <div className="flex justify-end">
                <Button variant="primary" size="small" onClick={handleSaveProfile}>Lưu</Button>
              </div>
            </div>

            {/* Product updates toggle */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex items-center justify-between gap-xl">
              <div>
                <h2 className="text-label text-text-primary font-semibold">Cập nhật sản phẩm</h2>
                <p className="text-label-sm text-text-secondary mt-xs">Email thỉnh thoảng về tính năng mới và khảo sát phản hồi. Có thể hủy bất cứ lúc nào.</p>
              </div>
              <button
                type="button"
                onClick={() => setProductUpdates(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${productUpdates ? 'bg-brand-primary' : 'bg-bg-subtle border border-border-primary'}`}
                aria-label="Toggle product updates"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${productUpdates ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* My reviews */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <h2 className="text-label text-text-primary font-semibold">Đánh giá của tôi</h2>
              <div className="flex gap-2xl">
                <div>
                  <p className="text-heading text-text-primary font-semibold">{myProfReviews.length}</p>
                  <p className="text-label-sm text-text-secondary">Giảng viên</p>
                </div>
                <div>
                  <p className="text-heading text-text-primary font-semibold">{myInstReviews.length}</p>
                  <p className="text-label-sm text-text-secondary">Trường đại học</p>
                </div>
              </div>
              {myProfReviews.length === 0 && myInstReviews.length === 0 && (
                <p className="text-label-sm text-text-tertiary">Bạn chưa gửi đánh giá nào.</p>
              )}
            </div>

            {/* Logout */}
            <div className="flex justify-end">
              <Button
                variant="subtle"
                iconStart={<LogOut size={16} />}
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        )}

        {accountTab === 'security' && (
          <div className="flex flex-col gap-xl">
            {/* Email verification */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <div>
                <h2 className="text-label text-text-primary font-semibold">Xác minh email</h2>
                <p className="text-label-sm text-text-secondary mt-xs">Xác minh email để mở khóa toàn bộ tính năng.</p>
              </div>
              <div>
                <Button variant="neutral" size="small" onClick={async () => {
                  await supabase.auth.resetPasswordForEmail(currentUser?.email || '', {
                    redirectTo: window.location.origin + '/?type=recovery',
                  })
                  showToast('Đã gửi link xác minh tới email của bạn', 'success')
                }}>
                  Gửi lại link xác minh
                </Button>
              </div>
            </div>

            {/* Reset password via email */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <div>
                <h2 className="text-label text-text-primary font-semibold">Đặt lại mật khẩu</h2>
                <p className="text-label-sm text-text-secondary mt-xs">
                  Gửi email với link đặt lại mật khẩu tới địa chỉ email của bạn.
                </p>
              </div>
              <div className="flex flex-col gap-sm">
                <InputField
                  label="Email"
                  type="email"
                  value={resetEmail || currentUser?.email || ''}
                  onChange={setResetEmail}
                  placeholder="email@edu.vn"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="neutral" size="small" onClick={async () => {
                  const email = resetEmail || currentUser?.email || ''
                  if (!email) { showToast('Vui lòng nhập email', 'error'); return }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/?type=recovery',
                  })
                  if (error) { showToast((error as any).message || 'Lỗi gửi email', 'error'); return }
                  showToast('Đã gửi email đặt lại mật khẩu!', 'success')
                  setResetEmail('')
                }}>
                  Gửi email đặt lại
                </Button>
              </div>
            </div>

            {/* Change password (for mock mode / logged-in session) */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <h2 className="text-label text-text-primary font-semibold">Đổi mật khẩu trực tiếp</h2>
              <InputField
                label="Mật khẩu hiện tại"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="••••••••"
              />
              <div className="flex flex-col gap-xs">
                <InputField
                  label="Mật khẩu mới"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="••••••••"
                />
                <p className="text-video-title text-text-tertiary">Ít nhất 6 ký tự.</p>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" size="small" onClick={handleChangePassword}>Đổi mật khẩu</Button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-corner-lg p-xl flex flex-col gap-lg" style={{ border: '1.5px solid var(--color-danger, #ef4444)' }}>
              <div>
                <h2 className="text-label font-semibold" style={{ color: 'var(--color-danger, #ef4444)' }}>Vùng nguy hiểm</h2>
                <p className="text-label-sm mt-xs" style={{ color: 'var(--color-danger, #ef4444)' }}>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu.</p>
              </div>
              <p className="text-label-sm text-text-secondary">Thao tác này sẽ xóa tất cả đánh giá và đề xuất bạn đã gửi. Không thể hoàn tác.</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-sm px-lg py-sm rounded-corner-md text-label-sm font-medium transition-colors border"
                  style={{ color: 'var(--color-danger, #ef4444)', borderColor: 'var(--color-danger, #ef4444)', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>
        )}

        {accountTab === 'settings' && (
          <div className="flex flex-col gap-xl">
            {/* Appearance */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-xl">
              <h2 className="text-label text-text-primary font-semibold">Giao diện</h2>

              <div className="flex items-center justify-between gap-xl">
                <div>
                  <p className="text-label-sm text-text-primary font-medium">Chế độ màu</p>
                  <p className="text-video-title text-text-secondary mt-xs">Lưu trữ trên thiết bị này.</p>
                </div>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-sm px-lg py-sm rounded-corner-md text-label-sm border transition-all ${
                      theme === 'light'
                        ? 'bg-brand-primary text-on-brand border-brand-primary'
                        : 'bg-bg-faint border-border-primary text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <Sun size={14} />
                    Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-sm px-lg py-sm rounded-corner-md text-label-sm border transition-all ${
                      theme === 'dark'
                        ? 'bg-brand-primary text-on-brand border-brand-primary'
                        : 'bg-bg-faint border-border-primary text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <Moon size={14} />
                    Tối
                  </button>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
              <h2 className="text-label text-text-primary font-semibold">Ngôn ngữ</h2>
              <SelectField
                label="Ngôn ngữ giao diện"
                options={[
                  { value: 'vi', label: 'Tiếng Việt' },
                  { value: 'en', label: 'English' },
                ]}
                value={editLanguage}
                onChange={setEditLanguage}
              />
              <p className="text-video-title text-text-tertiary">Dùng cho giao diện ứng dụng và email thông báo.</p>
            </div>

            {/* Notification preferences */}
            <div className="bg-surface-bg rounded-corner-lg p-xl flex items-center justify-between gap-xl">
              <div>
                <p className="text-label-sm text-text-primary font-medium">Cập nhật sản phẩm</p>
                <p className="text-video-title text-text-secondary mt-xs">Email về tính năng mới và khảo sát. Hủy bất kỳ lúc nào.</p>
              </div>
              <button
                type="button"
                onClick={() => setProductUpdates(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${productUpdates ? 'bg-brand-primary' : 'bg-bg-subtle border border-border-primary'}`}
                aria-label="Toggle product updates"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${productUpdates ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // ADMIN CHECK
  // Admin is determined solely by email credentials.
  // Add admin emails to the list below.
  // ==========================================
  const ADMIN_EMAILS = ['admin@rateviet.vn', 'admin@edu.vn']
  const isAdmin = currentUser != null && (
    ADMIN_EMAILS.includes(currentUser.email) ||
    currentUser.email.split('@')[0].toLowerCase() === 'admin'
  )

  // ==========================================
  // ADMIN PANEL VIEW
  // ==========================================
  const renderAdminPanel = () => (
    <div className="flex flex-col gap-2xl animate-fadeIn">
      <div className="flex items-center gap-lg">
        <ShieldCheck size={20} className="text-brand-primary" />
        <h1 className="text-title text-text-primary">Bảng điều khiển Admin</h1>
      </div>

      <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
        <h2 className="text-heading text-text-primary">Đề xuất chờ duyệt</h2>
        {suggestions.length === 0 ? (
          <div className="p-2xl text-center border border-border-secondary rounded-corner-md" style={{ borderStyle: 'dashed' }}>
            <p className="text-label-sm text-text-secondary">Không có đề xuất nào đang chờ duyệt</p>
          </div>
        ) : (
          suggestions.map((s, idx) => (
            <div key={idx} className="flex items-start justify-between gap-xl py-lg border-b border-border-secondary last:border-0 animate-fadeIn">
              <div className="flex flex-col gap-xs flex-1">
                <div className="flex items-center gap-sm">
                  <Badge label={s.type} variant="brand" />
                  <Badge label={s.status} variant="warning" />
                </div>
                <p className="text-label text-text-primary">{s.targetName}</p>
                {s.university && <p className="text-label-sm text-text-secondary">{s.university}{s.department ? ` • ${s.department}` : ''}</p>}
                {s.location && <p className="text-label-sm text-text-secondary">{s.location}</p>}
                {s.content && <p className="text-video-title text-text-tertiary">{s.content}</p>}
                <p className="text-video-title text-text-tertiary">Gửi bởi: {s.user_email}</p>
              </div>
              <div className="flex gap-sm shrink-0">
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    setSuggestions(prev => prev.map((item, i) => i === idx ? { ...item, status: 'Đã duyệt' } : item))
                    showToast('Đã duyệt đề xuất', 'success')
                  }}
                >
                  Duyệt
                </Button>
                <Button
                  variant="neutral"
                  size="small"
                  onClick={() => {
                    setSuggestions(prev => prev.map((item, i) => i === idx ? { ...item, status: 'Từ chối' } : item))
                    showToast('Đã từ chối đề xuất', 'default')
                  }}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
        <h2 className="text-heading text-text-primary">Thống kê hệ thống</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          {[
            { label: 'Trường', value: institutions.length },
            { label: 'Giảng viên', value: professors.length },
            { label: 'Đánh giá GV', value: profReviews.length },
            { label: 'Đề xuất chờ', value: suggestions.filter(s => s.status === 'Chờ xét duyệt').length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-bg-faint rounded-corner-md p-xl text-center">
              <p className="text-title text-brand-primary font-semibold">{value}</p>
              <p className="text-video-title text-text-secondary mt-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ==========================================
  // MAIN LAYOUT
  // ==========================================
  const regularNavItems = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'ratings', icon: Star, label: 'Đánh giá' },
  ]

  const allNavItems = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'ratings', icon: Star, label: 'Đánh giá' },
    ...(currentUser ? [{ id: 'bookmarks', icon: Bookmark, label: 'Đã lưu' }] : []),
    ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Duyệt' }] : []),
    { id: 'account', icon: currentUser ? Settings : LogIn, label: currentUser ? 'Tài khoản' : 'Đăng nhập' },
  ]

  const handleNavClick = (id: string) => {
    setActiveSideNav(id)
    if (id === 'home') navigate('home')
    else if (id === 'ratings') {
      if (!currentUser) { setAuthView('login'); setAuthModal(true) }
      else navigate('suggest')
    }
    else if (id === 'bookmarks') {
      if (!currentUser) { setAuthView('login'); setAuthModal(true) }
      else setShowBookmarkPanel(v => !v)
    }
    else if (id === 'admin') navigate('admin')
    else if (id === 'account') {
      if (!currentUser) { setAuthView('login'); setAuthModal(true) }
      else {
        setEditName(currentUser.name)
        setAccountTab('settings')
        navigate('account')
      }
    }
  }

  return (
    <>
    <div className="flex h-screen overflow-hidden bg-brand-tertiary">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <SidebarNavigation
          footer={
            <>
              <Tooltip content={theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'} position="right">
                <SidebarButton
                  icon={theme === 'dark' ? <Sun className="size-full" strokeWidth={1.5} /> : <Moon className="size-full" strokeWidth={1.5} />}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />
              </Tooltip>
              <Tooltip content="Cài đặt" position="right">
                <SidebarButton
                  icon={<Settings className="size-full" strokeWidth={1.5} />}
                  onClick={() => {
                    if (!currentUser) { setAuthView('login'); setAuthModal(true); return }
                    setEditName(currentUser.name); setAccountTab('settings'); navigate('account'); setActiveSideNav('account')
                  }}
                />
              </Tooltip>
              <Tooltip content={currentUser ? currentUser.name : 'Đăng nhập'} position="right">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => { setEditName(currentUser.name); setAccountTab('profile'); navigate('account'); setActiveSideNav('account') }}
                    className="flex items-center justify-center w-10 h-10"
                  >
                    <Avatar
                      type="initial"
                      initials={currentUser.name.charAt(0).toUpperCase()}
                      size="medium"
                      shape="circle"
                    />
                  </button>
                ) : (
                  <SidebarButton
                    icon={<LogIn className="size-full" strokeWidth={1.5} />}
                    onClick={() => { setAuthView('login'); setAuthModal(true) }}
                  />
                )}
              </Tooltip>
            </>
          }
        >
          {regularNavItems.map(item => (
            <Tooltip key={item.id} content={item.label} position="right">
              <SidebarButton
                icon={<item.icon className="size-full" strokeWidth={1.5} />}
                active={activeSideNav === item.id}
                onClick={() => handleNavClick(item.id)}
              />
            </Tooltip>
          ))}
          {currentUser ? (
            <Tooltip key="bookmarks" content="Giảng viên đã lưu" position="right">
              <SidebarButton
                icon={<Bookmark className="size-full" strokeWidth={1.5} />}
                active={showBookmarkPanel}
                onClick={() => setShowBookmarkPanel(v => !v)}
              />
            </Tooltip>
          ) : <span key="bookmarks-placeholder" />}
          {isAdmin ? (
            <Tooltip key="admin" content="Duyệt (Admin)" position="right">
              <SidebarButton
                icon={<ShieldCheck className="size-full" strokeWidth={1.5} />}
                active={activeSideNav === 'admin'}
                onClick={() => handleNavClick('admin')}
              />
            </Tooltip>
          ) : <span key="admin-placeholder" />}
        </SidebarNavigation>
      </div>

      {/* Bookmark panel — desktop only, always mounted, CSS width transitions */}
      <div className={`hidden md:flex flex-col bg-surface-bg border-r border-border-primary overflow-hidden transition-all duration-200 ${showBookmarkPanel && currentUser ? 'w-64' : 'w-0'}`}>
          <div className="p-xl border-b border-border-primary flex items-center justify-between shrink-0">
            <h2 className="text-label text-text-primary font-semibold flex items-center gap-sm">
              <BookmarkCheck size={14} className="text-brand-primary" />
              Đã lưu ({bookmarkedProfIds.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowBookmarkPanel(false)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-xs">
            {bookmarkedProfIds.length === 0 ? (
              <div className="p-xl text-center">
                <Bookmark size={24} className="text-text-tertiary mx-auto mb-sm" />
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
                  <div key={id} className="group flex items-start gap-sm p-sm rounded-corner-md hover:bg-bg-hover transition-colors">
                    <button
                      type="button"
                      onClick={() => {
                        if (inst) { navigate('professor', inst, prof.department, prof); setShowBookmarkPanel(false) }
                      }}
                      className="flex items-start gap-sm flex-1 min-w-0 text-left"
                    >
                      <Avatar type="initial" initials={prof.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                      <div className="flex-1 min-w-0">
                        <p className="text-label-sm text-text-primary leading-tight line-clamp-2">{prof.name}</p>
                        <p className="text-video-title text-text-secondary line-clamp-1">{prof.department}</p>
                        {stats.avg_rating > 0 && (
                          <p className="text-video-title text-brand-primary mt-xs">{stats.avg_rating.toFixed(1)} ★</p>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(id)}
                      className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all shrink-0 mt-xs"
                      title="Xóa bookmark"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-brand-tertiary p-lg md:p-2xl pb-24 md:pb-2xl">
        <div className="max-w-5xl mx-auto">
          {currentView === 'home' && renderHome()}
          {currentView === 'institution' && renderInstitution()}
          {currentView === 'department' && renderDepartment()}
          {currentView === 'professor' && renderProfessor()}
          {currentView === 'add-prof-review' && renderAddProfReview()}
          {currentView === 'add-inst-review' && renderAddInstReview()}
          {currentView === 'suggest' && renderSuggest()}
          {currentView === 'account' && currentUser && renderAccountPage()}
          {currentView === 'admin' && isAdmin && renderAdminPanel()}
          {currentView === 'admin' && !isAdmin && (
            <div className="flex items-center justify-center h-64">
              <p className="text-label text-text-secondary">Không có quyền truy cập</p>
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {renderAuthModal()}

      {/* Professor Comparison Modal */}
      {selectedProf && (
        <Modal
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
            /* Side-by-side comparison */
            <div className="flex flex-col gap-xl">
              <div className="grid grid-cols-2 gap-xl">
                {[{ prof: selectedProf, label: 'Hiện tại' }, { prof: compareProf, label: 'So sánh' }].map(({ prof, label }) => {
                  const s = calculateProfStats(prof.id)
                  return (
                    <div key={prof.id} className="bg-bg-faint rounded-corner-lg p-xl flex flex-col gap-lg">
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
                        {prof.tags.map(t => <Badge key={t} label={t} variant="secondary" />)}
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
            /* Professor search */
            <div className="flex flex-col gap-lg">
              <p className="text-label-sm text-text-secondary">Tìm giảng viên để so sánh với <strong>{selectedProf.name}</strong></p>
              <SearchComponent
                value={compareSearch}
                placeholder="Tìm theo tên giảng viên..."
                onChange={setCompareSearch}
              />
              <div className="flex gap-sm flex-wrap">
                <div className="flex-1 min-w-40">
                  <SelectField
                    placeholder="Lọc theo trường"
                    options={[
                      { value: '', label: 'Tất cả trường' },
                      ...institutions.map(i => ({ value: i.name, label: i.short_name + ' — ' + i.name })),
                    ]}
                    value={compareUniv}
                    onChange={v => { setCompareUniv(v); setCompareDept('') }}
                  />
                </div>
                <div className="flex-1 min-w-40">
                  <SelectField
                    placeholder="Lọc theo khoa"
                    options={[
                      { value: '', label: 'Tất cả khoa' },
                      ...(institutions.find(i => i.name === compareUniv)?.departments || []).map(d => ({ value: d, label: d })),
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
                        className="flex items-center justify-between gap-lg p-lg rounded-corner-md bg-bg-faint hover:bg-bg-hover transition-colors text-left"
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
        </Modal>
      )}

      {/* Password Recovery Modal (triggered by Supabase redirect) */}
      <Modal
        isOpen={recoveryModal}
        onClose={() => setRecoveryModal(false)}
        title="Đặt mật khẩu mới"
        size="small"
        footer={
          <ButtonGroup align="stack">
            <Button variant="primary" onClick={async () => {
              if (recoveryPassword.length < 6) { showToast('Mật khẩu phải ít nhất 6 ký tự', 'error'); return }
              const { error } = await supabase.auth.updateUser({ password: recoveryPassword })
              if (error) { showToast((error as any).message || 'Lỗi đặt mật khẩu', 'error'); return }
              setRecoveryModal(false)
              setRecoveryPassword('')
              showToast('Mật khẩu đã được cập nhật!', 'success')
            }}>Xác nhận</Button>
            <Button variant="subtle" onClick={() => { setRecoveryModal(false); setRecoveryPassword('') }}>Hủy</Button>
          </ButtonGroup>
        }
      >
        <div className="flex flex-col gap-lg">
          <p className="text-label-sm text-text-secondary">Nhập mật khẩu mới cho tài khoản của bạn.</p>
          <InputField
            label="Mật khẩu mới"
            type="password"
            value={recoveryPassword}
            onChange={setRecoveryPassword}
            placeholder="••••••••"
          />
          <p className="text-video-title text-text-tertiary">Ít nhất 6 ký tự.</p>
        </div>
      </Modal>

      {/* Mobile bottom nav — visible only on small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-bg border-t border-border-primary flex items-stretch">
        {allNavItems.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-xs py-md transition-colors ${
              activeSideNav === item.id || (item.id === 'bookmarks' && showBookmarkPanel)
                ? 'text-brand-primary'
                : 'text-text-tertiary'
            }`}
          >
            <item.icon size={20} strokeWidth={1.5} />
            <span className="text-video-title">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toast — sits above bottom nav on mobile */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-2xl right-2xl z-50 animate-scaleIn">
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

    {/* Mobile bookmark sheet — outside the overflow-hidden flex container */}
    {showBookmarkPanel && currentUser && (
      <div className="md:hidden fixed inset-0 z-50 flex flex-col">
        <div className="flex-1 bg-black/40" onClick={() => setShowBookmarkPanel(false)} />
        <div className="bg-surface-bg rounded-t-2xl max-h-[70vh] flex flex-col animate-slideInLeft">
          <div className="p-xl border-b border-border-primary flex items-center justify-between shrink-0">
            <h2 className="text-label text-text-primary font-semibold flex items-center gap-sm">
              <BookmarkCheck size={14} className="text-brand-primary" />
              Giảng viên đã lưu ({bookmarkedProfIds.length})
            </h2>
            <button type="button" onClick={() => setShowBookmarkPanel(false)} className="text-text-tertiary hover:text-text-primary">
              <X size={16} />
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
                  <div key={id} className="group flex items-start gap-sm p-sm rounded-corner-md hover:bg-bg-hover transition-colors">
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
