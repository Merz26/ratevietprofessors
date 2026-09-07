import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti'
import easterEggImg from './easter-egg-logo.jpg'
import logoImg from './logo.jpg'
import {
  SidebarButton,
  Tooltip,
  Toast,
} from '@figma/astraui'
import {
  Home,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  Bookmark,
  Monitor,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import { 
  getStoredUserVotes, 
  saveUserVote, 
  computeVoteTransition, 
  pushReviewVoteToSupabase 
} from './services/voteService'
import { ThemeContext } from './main'
import InteractiveBackground from './components/InteractiveBackground'
import { Institution, Professor, InstitutionReview, ProfessorReview, Suggestion, InstStats, ProfStats } from './types'
import { CRITERIA_KEYS } from './constants'

// Extracted views
import { HomeView } from './views/HomeView'
import { InstitutionView } from './views/InstitutionView'
import { DepartmentView } from './views/DepartmentView'
import { ProfessorView } from './views/ProfessorView'
import { AddProfReviewView } from './views/AddProfReviewView'
import { AddInstReviewView } from './views/AddInstReviewView'
import { SuggestView } from './views/SuggestView'

// Extracted modals
import { InfoModal } from './components/modals/InfoModal'
import { CompareInstModal } from './components/modals/CompareInstModal'
import { CompareProfModal } from './components/modals/CompareProfModal'
import { BookmarkDrawer } from './components/modals/BookmarkDrawer'

export default function App() {
  const { theme, setTheme } = useContext(ThemeContext)
  
  const [toast, setToast] = useState<{ message: string; variant: 'default' | 'success' | 'error' } | null>(null)

  // Header Logo States
  const [showInfoMenu, setShowInfoMenu] = useState(false)
  const [sidebarRotation, setSidebarRotation] = useState(0)
  const [flyoutRotation, setFlyoutRotation] = useState(0)
  const [isFlyoutSpinning, setIsFlyoutSpinning] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleLogoClick = () => {
    setSidebarRotation(prev => prev + 360)
    setShowInfoMenu(true)
  }

  const handleFlyoutLogoClick = () => {
    if (isFlyoutSpinning) return
    setIsFlyoutSpinning(true)
    setFlyoutRotation(prev => prev + 360)
    
    const nextSpinCount = spinCount + 1
    setSpinCount(nextSpinCount)
    
    if (nextSpinCount === 10 && confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, { resize: true, useWorker: true })
      myConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
    
    setTimeout(() => setIsFlyoutSpinning(false), 500)
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

  // Comparison Modals
  const [compareModal, setCompareModal] = useState(false)
  const [compareInstModal, setCompareInstModal] = useState(false)

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
  const [homeResetKey, setHomeResetKey] = useState(0)

  const scrollPositions = useRef<Record<string, number>>({})
  const lastPathname = useRef(location.pathname)

  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current[location.pathname] = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  useEffect(() => {
    const prevParts = lastPathname.current.split('/').filter(Boolean)
    const currentParts = location.pathname.split('/').filter(Boolean)
    
    // Navigate to a lower level page if current parts is greater than prev parts
    if (currentParts.length >= prevParts.length) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      // returned to a higher level page, restore scroll
      const savedScroll = scrollPositions.current[location.pathname] || 0
      window.scrollTo({ top: savedScroll, behavior: 'auto' })
    }
    
    lastPathname.current = location.pathname
  }, [location.pathname, isLoadingData])

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
              setSelectedProf(null)
              setCurrentView('department')
            }
          } else {
            setSelectedProf(null)
            setCurrentView('department')
          }
        } else {
          setSelectedDept(null)
          setSelectedProf(null)
          setCurrentView('institution')
        }
      } else {
        if (!isLoadingData) {
          setCurrentView('home')
        }
      }
    }
  }, [location.pathname, institutions, professors, isLoadingData])

  const navigate = useCallback((view: string, inst?: Institution, dept?: string, prof?: Professor) => {
    const targetInst = inst !== undefined ? inst : (selectedInst || undefined)
    const targetDept = dept !== undefined ? dept : (selectedDept || undefined)
    const targetProf = prof !== undefined ? prof : (selectedProf || undefined)
    
    if (view === 'home') routerNavigate('/')
    else if (view === 'suggest') routerNavigate('/suggest')
    else if (view === 'add-inst-review' && targetInst) routerNavigate(`/add-inst-review/${encodeURIComponent(targetInst.short_name)}`)
    else if (view === 'add-prof-review' && targetProf) routerNavigate(`/add-prof-review/${targetProf.id}`)
    else if (view === 'institution' && targetInst) routerNavigate(`/${encodeURIComponent(targetInst.short_name)}`)
    else if (view === 'department' && targetInst && targetDept) routerNavigate(`/${encodeURIComponent(targetInst.short_name)}/${encodeURIComponent(targetDept)}`)
    else if (view === 'professor' && targetInst && targetDept && targetProf) routerNavigate(`/${encodeURIComponent(targetInst.short_name)}/${encodeURIComponent(targetDept)}/${targetProf.id}`)
  }, [routerNavigate, selectedInst, selectedDept, selectedProf])

  // Fetch info and review data
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoadingData(true)
      try {
        const [
          { data: instData, error: instErr },
          { data: profData, error: profErr },
          { data: instRevData },
          { data: profRevData }
        ] = await Promise.all([
          supabase.from('institutions').select('*'),
          supabase.from('professors').select('*'),
          supabase.from('institution_reviews').select('*'),
          supabase.from('professor_reviews').select('*')
        ])

        if (instErr) console.error("Error fetching institutions:", instErr)
        if (profErr) console.error("Error fetching professors:", profErr)

        const storedVotes = getStoredUserVotes()

        if (instData) setInstitutions(instData)
        if (profData) setProfessors(profData)
        if (instRevData) {
          setInstReviews(instRevData.map(r => ({
            ...r,
            userVote: storedVotes[r.id] || null
          })))
        }
        if (profRevData) {
          setProfReviews(profRevData.map(r => ({
            ...r,
            userVote: storedVotes[r.id] || null
          })))
        }
        
      } catch (error) {
        console.error("Failed to load database data:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchRealData()
  }, [])

  const showToast = useCallback((message: string, variant: 'success' | 'error' | 'default' = 'default') => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Inst stats map cache
  const instStatsMap = useMemo(() => {
    const map = new Map<number, InstStats>()
    const reviewsByInst: Record<number, typeof instReviews> = {}
    for (const r of instReviews) {
      if (!reviewsByInst[r.inst_id]) reviewsByInst[r.inst_id] = []
      reviewsByInst[r.inst_id].push(r)
    }
    for (const inst of institutions) {
      const list = reviewsByInst[inst.id] || []
      if (list.length === 0) {
        map.set(inst.id, { overall: 0, total: 0, metricsAvg: {} })
        continue
      }
      const metricsAvg: Record<string, string> = {}
      let sumTotal = 0
      CRITERIA_KEYS.forEach(key => {
        let mSum = 0
        for (const r of list) mSum += (r.metrics[key] || 0)
        metricsAvg[key] = (mSum / list.length).toFixed(1)
        sumTotal += mSum / list.length
      })
      map.set(inst.id, { overall: parseFloat((sumTotal / CRITERIA_KEYS.length).toFixed(1)), total: list.length, metricsAvg })
    }
    return map
  }, [institutions, instReviews])

  const calculateInstStats = useCallback((inst_id: number): InstStats => {
    return instStatsMap.get(inst_id) || { overall: 0, total: 0, metricsAvg: {} }
  }, [instStatsMap])

  // Prof stats map cache
  const profStatsMap = useMemo(() => {
    const map = new Map<number, ProfStats>()
    const reviewsByProf: Record<number, typeof profReviews> = {}
    for (const r of profReviews) {
      if (!reviewsByProf[r.prof_id]) reviewsByProf[r.prof_id] = []
      reviewsByProf[r.prof_id].push(r)
    }
    for (const prof of professors) {
      const list = reviewsByProf[prof.id] || []
      if (list.length === 0) {
        map.set(prof.id, { avg_rating: 0, avg_difficulty: 0, total_ratings: 0, would_take_again_pct: 0 })
        continue
      }
      let sumRating = 0, sumDiff = 0, wouldTakeCount = 0
      for (const r of list) {
        sumRating += r.teaching_rating
        sumDiff += r.difficulty_rating
        if (r.would_take_again) wouldTakeCount++
      }
      map.set(prof.id, {
        avg_rating: sumRating / list.length,
        avg_difficulty: sumDiff / list.length,
        total_ratings: list.length,
        would_take_again_pct: Math.round((wouldTakeCount / list.length) * 100),
      })
    }
    return map
  }, [professors, profReviews])

  const calculateProfStats = useCallback((prof_id: number): ProfStats => {
    return profStatsMap.get(prof_id) || { avg_rating: 0, avg_difficulty: 0, total_ratings: 0, would_take_again_pct: 0 }
  }, [profStatsMap])

  const handleInstVote = useCallback(async (id: string, vote: 'helpful' | 'not_helpful') => {
    const targetReview = instReviews.find(r => r.id === id)
    if (!targetReview) return

    const { helpful: h, not_helpful: nh, nextVote } = computeVoteTransition(
      targetReview.helpful || 0,
      targetReview.not_helpful || 0,
      targetReview.userVote || null,
      vote
    )

    saveUserVote(id, nextVote)

    setInstReviews(prev => prev.map(r => 
      r.id === id ? { ...r, helpful: h, not_helpful: nh, userVote: nextVote } : r
    ))

    const result = await pushReviewVoteToSupabase('institution_reviews', id, h, nh)
    
    if (!result.success) {
      console.error("Failed to push vote to Supabase:", result.error || (result.rlsBlocked ? 'RLS blocked' : 'Unknown error'))
      showToast('Lỗi khi lưu tương tác. Vui lòng thử lại.', 'error')
    }
  }, [instReviews, showToast])

  const toggleBookmark = useCallback((profId: number) => {
    setBookmarkedProfIds(prev => {
      const isBookmarked = prev.includes(profId)
      const updated = isBookmarked
        ? prev.filter(id => id !== profId)
        : [...prev, profId]
      
      localStorage.setItem('bookmarked_profs', JSON.stringify(updated))
      showToast(isBookmarked ? 'Đã xóa khỏi danh sách lưu' : 'Đã lưu giảng viên', isBookmarked ? 'default' : 'success')
      return updated
    })
  }, [showToast])

  const handleProfVote = useCallback(async (id: string, vote: 'helpful' | 'not_helpful') => {
    const targetReview = profReviews.find(r => r.id === id)
    if (!targetReview) return

    const { helpful: h, not_helpful: nh, nextVote } = computeVoteTransition(
      targetReview.helpful || 0,
      targetReview.not_helpful || 0,
      targetReview.userVote || null,
      vote
    )

    saveUserVote(id, nextVote)

    setProfReviews(prev => prev.map(r => 
      r.id === id ? { ...r, helpful: h, not_helpful: nh, userVote: nextVote } : r
    ))

    const result = await pushReviewVoteToSupabase('professor_reviews', id, h, nh)
    
    if (!result.success) {
      console.error("Failed to push vote to Supabase:", result.error || (result.rlsBlocked ? 'RLS blocked' : 'Unknown error'))
      showToast('Lỗi khi lưu tương tác. Vui lòng thử lại.', 'error')
    }
  }, [profReviews, showToast])

  // Breadcrumb renderer
  const renderBreadcrumb = useCallback(() => {
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
                className="h-8 px-3 rounded-full text-label-sm text-text-secondary hover:text-brand-primary bg-white/18 dark:bg-white/[0.03] hover:bg-white/35 dark:hover:bg-white/[0.06] backdrop-blur-xs border border-black/[0.06] dark:border-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer font-medium"
              >
                {c.label}
              </button>
            ) : (
              <span className="h-8 px-3 flex items-center rounded-full text-label-sm font-semibold text-text-primary bg-white/28 dark:bg-white/[0.05] backdrop-blur-xs border border-black/[0.08] dark:border-white/[0.12]">
                {c.label}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }, [selectedInst, selectedDept, selectedProf, navigate])

  // Navigation handlers
  const regularNavItems = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'suggest', icon: Plus, label: 'Đề xuất' },
  ]

  const handleNavClick = (id: string) => {
    setActiveSideNav(id)
    if (id === 'home') {
      setHomeResetKey(k => k + 1)
      navigate('home')
    }
    else if (id === 'suggest') navigate('suggest')
    else if (id === 'bookmarks') setShowBookmarkPanel(v => !v)
  }

  return (
    <div id="app-root" className="relative isolate w-full min-h-[100dvh] bg-transparent">
      <InteractiveBackground />
      <div className="flex min-h-[100dvh] w-full bg-transparent">
        {/* Desktop sidebar */}
        <div className="hidden md:flex sticky top-0 h-[100dvh] z-30"> 
          <div className="h-full w-[72px] glass-bar border-r border-black/[0.06] dark:border-white/[0.1] shadow-lg shadow-black/5 flex flex-col items-center py-sm gap-sm">
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
            
            <div className="mt-auto flex flex-col gap-sm pb-2">
              <Tooltip content={theme === 'system' ? 'Theo hệ thống' : theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'} position="right">
                <SidebarButton
                  icon={theme === 'system' ? <Monitor className="size-full" strokeWidth={1.5} /> : theme === 'dark' ? <Moon className="size-full" strokeWidth={1.5} /> : <Sun className="size-full" strokeWidth={1.5} />}
                  onClick={() => setTheme(theme === 'dark' ? 'system' : theme === 'system' ? 'light' : 'dark')}
                />
              </Tooltip>
            </div>
          </div>

          {/* Escape Hatch logo */}
          <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-center bg-transparent z-50 border-r border-black/[0.06] dark:border-white/[0.1]">
            <button 
              type="button"
              onClick={handleLogoClick}
              className="flex items-center justify-center bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src={spinCount >= 10 ? easterEggImg : logoImg} 
                alt="Logo" 
                className="w-10 h-10 object-cover rounded-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ transform: `rotate(${sidebarRotation}deg)` }}
              />
            </button>
          </div>
        </div>

        {/* Bookmark drawer (desktop panel + mobile sheet) */}
        <BookmarkDrawer
          isOpen={showBookmarkPanel}
          onClose={() => setShowBookmarkPanel(false)}
          bookmarkedProfIds={bookmarkedProfIds}
          professors={professors}
          institutions={institutions}
          isLoadingData={isLoadingData}
          calculateProfStats={calculateProfStats}
          toggleBookmark={toggleBookmark}
          navigate={navigate}
        />

        {/* Main page content area */}
        <main className="flex-1 bg-transparent flex flex-col pb-[72px] md:pb-0 relative z-10">
          <div className="max-w-7xl mx-auto p-xl pb-28 md:px-3xl md:pt-3xl md:pb-24 flex-1 w-full">
            {currentView === 'home' && (
              <HomeView
                isLoadingData={isLoadingData}
                institutions={institutions}
                professors={professors}
                calculateInstStats={calculateInstStats}
                calculateProfStats={calculateProfStats}
                navigate={navigate}
                resetKey={homeResetKey}
              />
            )}
            {currentView === 'institution' && (
              <InstitutionView
                isLoadingData={isLoadingData}
                selectedInst={selectedInst}
                professors={professors}
                instReviews={instReviews}
                calculateInstStats={calculateInstStats}
                handleInstVote={handleInstVote}
                navigate={navigate}
                renderBreadcrumb={renderBreadcrumb}
                onOpenCompare={() => setCompareInstModal(true)}
                showToast={showToast}
              />
            )}
            {currentView === 'department' && (
              <DepartmentView
                isLoadingData={isLoadingData}
                selectedInst={selectedInst}
                selectedDept={selectedDept}
                professors={professors}
                bookmarkedProfIds={bookmarkedProfIds}
                calculateProfStats={calculateProfStats}
                toggleBookmark={toggleBookmark}
                navigate={navigate}
                renderBreadcrumb={renderBreadcrumb}
              />
            )}
            {currentView === 'professor' && (
              <ProfessorView
                isLoadingData={isLoadingData}
                selectedInst={selectedInst}
                selectedDept={selectedDept}
                selectedProf={selectedProf}
                professors={professors}
                profReviews={profReviews}
                bookmarkedProfIds={bookmarkedProfIds}
                calculateProfStats={calculateProfStats}
                toggleBookmark={toggleBookmark}
                handleProfVote={handleProfVote}
                navigate={navigate}
                renderBreadcrumb={renderBreadcrumb}
                onOpenCompare={() => setCompareModal(true)}
                showToast={showToast}
              />
            )}
            {currentView === 'add-prof-review' && (
              <AddProfReviewView
                selectedProf={selectedProf}
                onReviewAdded={newRev => setProfReviews(prev => [newRev, ...prev])}
                navigate={navigate}
                renderBreadcrumb={renderBreadcrumb}
                showToast={showToast}
              />
            )}
            {currentView === 'add-inst-review' && (
              <AddInstReviewView
                selectedInst={selectedInst}
                onReviewAdded={newRev => setInstReviews(prev => [newRev, ...prev])}
                navigate={navigate}
                renderBreadcrumb={renderBreadcrumb}
                showToast={showToast}
              />
            )}
            {currentView === 'suggest' && (
              <SuggestView
                institutions={institutions}
                suggestions={suggestions}
                onSuggestionAdded={newSugg => setSuggestions(prev => [newSugg, ...prev])}
                navigate={navigate}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Info Menu Modal */}
      <InfoModal
        isOpen={showInfoMenu}
        onClose={() => setShowInfoMenu(false)}
        spinCount={spinCount}
        flyoutRotation={flyoutRotation}
        onFlyoutLogoClick={handleFlyoutLogoClick}
        confettiCanvasRef={confettiCanvasRef}
      />

      {/* Institution Comparison Modal */}
      <CompareInstModal
        isOpen={compareInstModal}
        onClose={() => setCompareInstModal(false)}
        selectedInst={selectedInst}
        institutions={institutions}
        calculateInstStats={calculateInstStats}
      />

      {/* Professor Comparison Modal */}
      <CompareProfModal
        isOpen={compareModal}
        onClose={() => setCompareModal(false)}
        selectedProf={selectedProf}
        professors={professors}
        institutions={institutions}
        calculateProfStats={calculateProfStats}
      />

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-bar border-t border-black/[0.06] dark:border-white/[0.1] shadow-[0_-4px_24px_rgba(0,0,0,0.05)] flex items-stretch px-xs pb-safe">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex-1 flex flex-col items-center justify-center gap-sm py-lg text-text-tertiary transition-colors"
        >
          <img 
            src={spinCount >= 10 ? easterEggImg : logoImg} 
            alt="Logo" 
            className="w-6 h-6 object-cover rounded-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: `rotate(${sidebarRotation}deg)` }}
          />
          <span className="text-video-title">Thông tin</span>
        </button>

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

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'system' : theme === 'system' ? 'light' : 'dark')}
          className="flex-1 flex flex-col items-center justify-center gap-sm py-lg text-text-tertiary transition-colors hover:text-brand-primary"
        >
          {theme === 'system' ? <Monitor size={24} strokeWidth={1.5} /> : theme === 'dark' ? <Moon size={24} strokeWidth={1.5} /> : <Sun size={24} strokeWidth={1.5} />}
          <span className="text-video-title">{theme === 'system' ? 'Hệ thống' : theme === 'dark' ? 'Tối' : 'Sáng'}</span>
        </button>
      </nav>

      {/* Toast Notification */}
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
  )
}
