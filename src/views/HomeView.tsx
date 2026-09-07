import React, { useState, useEffect, useRef, useMemo, memo } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  GraduationCap,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { Institution, Professor, InstStats, ProfStats } from '../types'
import { VIETNAM_PROVINCES } from '../constants'
import { Button, SearchableDropdown, Badge, ScoreBadge } from '../components/ui/UIComponents'
import DebouncedInput from '../components/DebouncedInput'
import { InstitutionListSkeleton } from '../components/Skeletons'

interface InstitutionCardProps {
  inst: Institution
  stats: InstStats
  onNavigate: (inst: Institution) => void
}

const InstitutionCard = memo<InstitutionCardProps>(({ inst, stats, onNavigate }) => {
  return (
    <button
      type="button"
      onClick={() => onNavigate(inst)}
      className="glass-panel glass-panel-interactive rounded-3xl p-6 flex flex-col h-full text-left group animate-scaleIn active:scale-[0.99] cursor-pointer transform-gpu"
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
          <span className="text-video-title text-text-secondary font-semibold">{stats.total} đánh giá</span>
        </div>
      </div>
    </button>
  )
})

interface HomeViewProps {
  isLoadingData: boolean
  institutions: Institution[]
  professors: Professor[]
  calculateInstStats: (inst_id: number) => InstStats
  calculateProfStats: (prof_id: number) => ProfStats
  navigate: (view: string, inst?: Institution, dept?: string, prof?: Professor) => void
  resetKey?: number
}

export const HomeView: React.FC<HomeViewProps> = ({
  isLoadingData,
  institutions,
  professors,
  calculateInstStats,
  calculateProfStats,
  navigate,
  resetKey,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews'>('name')
  const [locationFilter, setLocationFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 16

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsListRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation: Ctrl+K / Cmd+K or '/' to focus search, Esc to close suggestions/blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Esc: close suggestions or blur
      if (e.key === 'Escape') {
        if (showSearchSuggestions) {
          e.preventDefault()
          setShowSearchSuggestions(false)
          setSelectedSuggestionIndex(-1)
        } else if (document.activeElement === searchInputRef.current) {
          e.preventDefault()
          searchInputRef.current?.blur()
        }
        return
      }

      // 2. Ctrl+K or Cmd+K
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'

      // 3. '/' key when not inside an input/textarea/select/contenteditable
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
        searchContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        if (searchTerm.length >= 1) {
          setShowSearchSuggestions(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearchSuggestions, searchTerm])

  // Reset filters when resetKey changes (e.g., clicked "Trang chủ" in sidebar)
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setSearchTerm('')
      setLocationFilter('')
      setSortBy('name')
      setCurrentPage(1)
      setShowSearchSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }, [resetKey])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, locationFilter])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Predictive search suggestions - remove limit so all results are scrollable
  useEffect(() => {
    if (searchTerm.trim().length >= 1) {
      const term = searchTerm.trim().toLowerCase()
      const instMatches = institutions.filter(inst =>
        (inst.name || '').toLowerCase().includes(term) ||
        (inst.short_name || '').toLowerCase().includes(term)
      ).map(inst => ({ type: 'institution' as const, item: inst }))

      const profMatches = professors.filter(prof =>
        (prof.name || '').toLowerCase().includes(term) ||
        (prof.university || '').toLowerCase().includes(term) ||
        (prof.department || '').toLowerCase().includes(term)
      ).map(prof => ({ type: 'professor' as const, item: prof }))

      setSearchSuggestions([...instMatches, ...profMatches])
      setShowSearchSuggestions(true)
      setSelectedSuggestionIndex(-1)
    } else {
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }, [searchTerm, institutions, professors])

  // Scroll active suggestion into view when navigating via arrow keys
  useEffect(() => {
    if (selectedSuggestionIndex >= 0) {
      const el = document.getElementById(`search-suggestion-${selectedSuggestionIndex}`)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedSuggestionIndex])

  // Memoized Home filtering & sorting for high performance
  const filteredInstitutions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return institutions.filter(inst => {
      const safeName = (inst.name || '').toLowerCase()
      const safeShortName = (inst.short_name || '').toLowerCase()
      const matchSearch = !term || safeName.includes(term) || safeShortName.includes(term)
      const matchLocation = !locationFilter || inst.location === locationFilter
      return matchSearch && matchLocation
    })
  }, [institutions, searchTerm, locationFilter])

  const sortedInstitutions = useMemo(() => {
    const list = [...filteredInstitutions]
    if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' }))
    } else if (sortBy === 'rating') {
      const scoreMap = new Map<number, number>()
      for (let i = 0; i < list.length; i++) {
        scoreMap.set(list[i].id, calculateInstStats(list[i].id).overall || 0)
      }
      list.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0))
    } else {
      const countMap = new Map<number, number>()
      for (let i = 0; i < list.length; i++) {
        countMap.set(list[i].id, calculateInstStats(list[i].id).total || 0)
      }
      list.sort((a, b) => (countMap.get(b.id) || 0) - (countMap.get(a.id) || 0))
    }
    return list
  }, [filteredInstitutions, sortBy, calculateInstStats])

  const totalPages = Math.max(1, Math.ceil(sortedInstitutions.length / entriesPerPage))
  const paginatedInstitutions = useMemo(() => {
    return sortedInstitutions.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
  }, [sortedInstitutions, currentPage, entriesPerPage])

  if (isLoadingData && institutions.length === 0) {
    return <InstitutionListSkeleton />
  }

  const locationOptions = [
    { value: '', label: 'Tất cả tỉnh thành' },
    ...VIETNAM_PROVINCES.map(p => ({ value: p, label: p })),
  ]

  return (
    <div className="flex flex-col gap-2xl">
      <div className={`flex flex-col gap-xl p-2xl rounded-3xl glass-panel relative transition-[z-index] ${showSearchSuggestions && searchSuggestions.length > 0 ? 'z-50' : 'z-20'}`}>
        <div className="flex flex-col gap-xs">
          <h1 className="text-title text-text-primary">Tìm kiếm Trường Đại học</h1>
          <p className="text-label-sm text-text-secondary">Xem đánh giá thực tế từ sinh viên về trường và giảng viên</p>
        </div>

        <div ref={searchContainerRef} className={`relative ${showSearchSuggestions && searchSuggestions.length > 0 ? 'z-50' : 'z-30'}`}>
          <div className="relative flex items-center gap-md glass-search rounded-2xl focus-within:border-brand-primary transition-all duration-300 px-xl shadow-sm">
            <Search size={18} className="text-text-secondary shrink-0" />
            <DebouncedInput
              ref={searchInputRef}
              id="main-search-input"
              type="text"
              value={searchTerm}
              placeholder="Tìm kiếm theo tên trường, mã trường hoặc giảng viên..."
              onChange={val => setSearchTerm(val)}
              onImmediateChange={() => setShowSearchSuggestions(true)}
              onFocus={() => {
                if (searchTerm.length >= 1) {
                  setShowSearchSuggestions(true)
                }
              }}
              onKeyDown={(e) => {
                if (!showSearchSuggestions || searchSuggestions.length === 0) return
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedSuggestionIndex(prev => 
                    prev < searchSuggestions.length - 1 ? prev + 1 : 0
                  )
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : searchSuggestions.length - 1
                  )
                } else if (e.key === 'Enter') {
                  if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
                    e.preventDefault()
                    const suggestion = searchSuggestions[selectedSuggestionIndex]
                    if (suggestion.type === 'institution') {
                      navigate('institution', suggestion.item)
                      setShowSearchSuggestions(false)
                    } else {
                      const prof = suggestion.item
                      const inst = institutions.find(i => i.name === prof.university)
                      if (inst) {
                        navigate('professor', inst, prof.department, prof)
                        setShowSearchSuggestions(false)
                      }
                    }
                  }
                }
              }}
              className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full placeholder:text-text-tertiary"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setShowSearchSuggestions(false)
                    searchInputRef.current?.focus()
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

          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div 
              className="absolute top-full left-0 right-0 mt-md glass-dropdown rounded-2xl z-[100] animate-scaleIn overflow-hidden shadow-2xl flex flex-col border border-black/10 dark:border-white/15"
            >
              {/* Sticky header indicating result count & scroll hint */}
              <div className="flex items-center justify-between px-xl py-2 bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.05] dark:border-white/[0.08] text-video-title text-text-tertiary select-none shrink-0">
                <span className="font-medium text-text-secondary">{searchSuggestions.length} kết quả tìm kiếm</span>
                <span className="hidden sm:inline">Cuộn để xem thêm • Dùng ↑↓ để chọn</span>
              </div>

              {/* Scrollable results container */}
              <div 
                ref={suggestionsListRef}
                className="max-h-[380px] sm:max-h-[460px] overflow-y-auto overscroll-contain dropdown-scrollbar scroll-smooth divide-y divide-black/[0.05] dark:divide-white/[0.08] py-xs"
              >
                {searchSuggestions.map((suggestion, idx) => {
                  const isSelected = idx === selectedSuggestionIndex
                  if (suggestion.type === 'institution') {
                    const inst = suggestion.item
                    const stats = calculateInstStats(inst.id)
                    return (
                      <button
                        key={`inst-${inst.id}-${idx}`}
                        id={`search-suggestion-${idx}`}
                        type="button"
                        onClick={() => { navigate('institution', inst); setShowSearchSuggestions(false) }}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                        className={`w-full flex items-center justify-between px-xl py-lg transition-colors text-left cursor-pointer ${
                          isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20' : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-lg min-w-0 pr-md">
                          <div className="w-8 h-8 bg-brand-tertiary rounded-corner-md flex items-center justify-center shrink-0">
                            <GraduationCap size={14} className="text-brand-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-label-sm truncate ${isSelected ? 'text-brand-primary font-medium' : 'text-text-primary'}`}>{inst.name}</p>
                            <p className="text-video-title text-text-secondary flex items-center gap-xs truncate">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate">{inst.location}</span>
                            </p>
                          </div>
                        </div>
                        <ScoreBadge value={stats.overall} />
                      </button>
                    )
                  } else {
                    const prof = suggestion.item
                    const stats = calculateProfStats(prof.id)
                    return (
                      <button
                        key={`prof-${prof.id}-${idx}`}
                        id={`search-suggestion-${idx}`}
                        type="button"
                        onClick={() => { 
                          const inst = institutions.find(i => i.name === prof.university)
                          if (inst) {
                            navigate('professor', inst, prof.department, prof)
                            setShowSearchSuggestions(false)
                          }
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                        className={`w-full flex items-center justify-between px-xl py-lg transition-colors text-left cursor-pointer ${
                          isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20' : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-lg min-w-0 pr-md">
                          <div className="w-8 h-8 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0">
                            <Star size={14} className="text-brand-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-label-sm truncate ${isSelected ? 'text-brand-primary font-medium' : 'text-text-primary'}`}>{prof.name}</p>
                            <p className="text-video-title text-text-secondary flex items-center gap-xs truncate">
                              <span className="truncate">{prof.university} • {prof.department}</span>
                            </p>
                          </div>
                        </div>
                        <ScoreBadge value={stats.avg_rating} />
                      </button>
                    )
                  }
                })}
              </div>
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

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-lg px-1">
          <p className="text-label-sm text-text-secondary font-medium">
            <span className="text-text-primary font-semibold">{filteredInstitutions.length}</span> trường {locationFilter ? `tại ${locationFilter}` : ''}
          </p>
          {totalPages > 1 && (
            <p className="text-label-sm text-text-secondary font-medium">
              Trang <span className="text-text-primary font-semibold">{currentPage}</span> / {totalPages}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {paginatedInstitutions.map(inst => (
            <InstitutionCard
              key={inst.id}
              inst={inst}
              stats={calculateInstStats(inst.id)}
              onNavigate={i => navigate('institution', i)}
            />
          ))}
        </div>

        {paginatedInstitutions.length === 0 && (
          <div className="glass-panel rounded-3xl p-2xl text-center">
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
                window.scrollTo({ top: 0, behavior: 'smooth' })
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
                const mainContainer = document.querySelector('main')
                if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="group inline-flex items-center gap-2.5 h-11 px-5 rounded-full glass-panel glass-panel-interactive active:scale-[0.96] transition-all duration-200 ease-out select-none disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft size={17} strokeWidth={2.25} className="text-text-primary group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="text-[14px] font-medium text-text-primary tracking-tight">Trước</span>
            </button>

            <div 
              className="h-11 px-4 flex items-center justify-center rounded-full glass-panel text-[13px] font-semibold tracking-tight select-none border border-black/10 dark:border-white/10 shadow-xs"
            >
              <span className="text-text-primary">{currentPage}</span>
              <span className="mx-2 text-text-tertiary">/</span>
              <span className="text-text-secondary">{totalPages}</span>
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1))
                window.scrollTo({ top: 0, behavior: 'smooth' })
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
                const mainContainer = document.querySelector('main')
                if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="group inline-flex items-center gap-2.5 h-11 px-5 rounded-full glass-panel glass-panel-interactive active:scale-[0.96] transition-all duration-200 ease-out select-none disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 cursor-pointer"
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
