import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from './supabaseClient';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export interface Institution {
  id: number;
  name: string;
  short_name: string;
  location: string;
  departments: string[];
}

export interface Professor {
  id: number;
  name: string;
  university: string;
  department: string;
  tags: string[];
}

export interface InstitutionReview {
  id: string; // UUID from Supabase
  inst_id: number;
  user_email: string;
  comment: string;
  created_at: string;
  metrics: Record<string, number>;
  helpful: number;
  not_helpful: number;
}

export interface ProfessorReview {
  id: string; // UUID from Supabase
  prof_id: number;
  user_email: string;
  course: string;
  teaching_rating: number;
  difficulty_rating: number;
  would_take_again: boolean;
  for_credit: string;
  textbook: string;
  attendance: string;
  grade: string;
  tags: string[];
  comment: string;
  created_at: string;
  helpful: number;
  not_helpful: number;
}

export interface Suggestion {
  id?: number;
  type: string; // 'professor' | 'institution' | 'department'
  targetName: string;
  university?: string;
  department?: string;
  short_name?: string;
  location?: string;
  departments?: string[];
  content: string;
  user_email: string;
  status: string;
  created_at?: string;
}

// 63 Provinces and Municipalities of Vietnam
const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", 
  "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", 
  "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", 
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", 
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", 
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", 
  "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", 
  "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", 
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", 
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", 
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

// ==========================================
// SEARCHABLE SELECT COMPONENT
// ==========================================
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  label?: string;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative">
      {label && <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white cursor-pointer flex justify-between items-center text-sm font-medium focus:ring-2 focus:ring-blue-500"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2">
          <input
            type="text"
            placeholder="Gõ để tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-2 mb-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-500"
            autoFocus
          />
          {filtered.length === 0 ? (
            <div className="p-2 text-xs text-gray-400 text-center">Không tìm thấy kết quả</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`p-2.5 text-xs rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${opt.value === value ? 'bg-blue-100 font-bold text-blue-800' : 'text-gray-700'}`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  
  // -- Auth State --
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // -- Database State --
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [instReviews, setInstReviews] = useState<InstitutionReview[]>([]);
  const [profReviews, setProfReviews] = useState<ProfessorReview[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    
  // -- Routing / Navigation State --
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professor | null>(null);

  // -- UI State --
  const [isDarkMode, setIsDarkMode] = useState(false);

  // -- Search, Sort & Filter State --
  const [searchTerm, setSearchTerm] = useState('');
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [profSort, setProfSort] = useState('newest');
  const [profTagFilter, setProfTagFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews'>('name');
  const entriesPerPage = 20;
  
  // -- Form State: Dynamic Suggestions --
  const [suggestionType, setSuggestionType] = useState<'professor' | 'institution' | 'department'>('professor');
  const [suggProfName, setSuggProfName] = useState('');
  const [suggSelectedUniv, setSuggSelectedUniv] = useState('');
  const [suggSelectedDept, setSuggSelectedDept] = useState('');
  const [suggInstName, setSuggInstName] = useState('');
  const [suggInstShortName, setSuggInstShortName] = useState('');
  const [suggInstLocation, setSuggInstLocation] = useState('');
  const [suggInstDepartmentsText, setSuggInstDepartmentsText] = useState('');
  const [suggNewDeptName, setSuggNewDeptName] = useState('');
  const [suggestionContent, setSuggestionContent] = useState('');

  // -- Form State: Review Forms --
  const [reviewCourse, setReviewCourse] = useState('');
  const [isOnlineCourse, setIsOnlineCourse] = useState(false);
  const [reviewTeaching, setReviewTeaching] = useState(5);
  const [reviewDifficulty, setReviewDifficulty] = useState(3);
  const [reviewWouldTakeAgain, setReviewWouldTakeAgain] = useState(true);
  const [reviewfor_credit, setReviewfor_credit] = useState('Có');
  const [reviewTextbook, setReviewTextbook] = useState('Không');
  const [reviewAttendance, setReviewAttendance] = useState('Có');
  const [reviewGrade, setReviewGrade] = useState('A');
  const [reviewSelectedTags, setReviewSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');

  const [instMetrics, setInstMetrics] = useState<Record<string, number>>({
    'Uy tín trường': 5, 'Địa điểm': 5, 'Cơ hội việc làm': 5, 'Cơ sở vật chất': 5,
    'Mạng Internet': 5, 'Đồ ăn': 5, 'Câu lạc bộ': 5, 'Đời sống xã hội': 5,
    'Độ hài lòng': 5, 'An toàn': 5
  });
  const [instReviewComment, setInstReviewComment] = useState('');

  // ==========================================
  // 3. EFFECTS (LIFECYCLES)
  // ==========================================

  // Effect: Toggle Dark Mode on the HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Reset pagination if search term or sort filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);
  
  //Auth Session Handler
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email ?? '',
          name: (session.user.user_metadata?.full_name || session.user.email?.split('@')[0]) ?? 'User',
        });
      }
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email ?? '',
          name: (session.user.user_metadata?.full_name || session.user.email?.split('@')[0]) ?? 'User',
        });
      } else {
        setCurrentUser(null);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [instRes, profRes, instRevRes, profRevRes, suggRes] = await Promise.all([
        supabase.from('institutions').select('*'),
        supabase.from('professors').select('*'),
        supabase.from('institution_reviews').select('*'),
        supabase.from('professor_reviews').select('*'),
        supabase.from('suggestions').select('*')
      ]);

      if (instRes.data) setInstitutions(instRes.data);
      if (profRes.data) setProfessors(profRes.data);
      if (instRevRes.data) setInstReviews(instRevRes.data);
      if (profRevRes.data) setProfReviews(profRevRes.data);
      if (suggRes.data) setSuggestions(suggRes.data);
    }
    fetchData();
  }, []);

  // Browser History API Link Handler
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView('home'); 
      setSelectedInst(null);
      setSelectedDept(null);
      setSelectedProf(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ==========================================
  // 4. NAVIGATION HANDLERS (DYNAMIC URLs)
  // ==========================================
  
  const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  const navigateToHome = () => {
    setCurrentView('home');
    setSelectedInst(null);
    setSelectedDept(null);
    setSelectedProf(null);
    window.history.pushState({}, '', '/');
  };

  const navigateToInstitution = (inst: Institution) => {
    setSelectedInst(inst);
    setCurrentView('institution');
    window.history.pushState({}, '', `/${toSlug(inst.short_name)}`);
  };

  const navigateToDepartment = (inst: Institution, dept: string) => {
    setSelectedInst(inst);
    setSelectedDept(dept);
    setCurrentView('department');
    window.history.pushState({}, '', `/${toSlug(inst.short_name)}/${toSlug(dept)}`);
  };

  const navigateToProfessor = (inst: Institution, dept: string, prof: Professor) => {
    setSelectedInst(inst);
    setSelectedDept(dept);
    setSelectedProf(prof);
    setCurrentView('professor');
    window.history.pushState({}, '', `/${toSlug(inst.short_name)}/${toSlug(dept)}/${prof.id}`);
  };

  // ==========================================
  // 5. HELPER FUNCTIONS
  // ==========================================
  
  const calculateInstStats = (inst_id: number) => {
    const list = instReviews.filter(r => r.inst_id === inst_id);
    if (list.length === 0) return { overall: 0, total: 0, metricsAvg: {} as Record<string, string> };
    
    const criteriaKeys = ['Uy tín trường', 'Địa điểm', 'Cơ hội việc làm', 'Cơ sở vật chất', 'Mạng Internet', 'Đồ ăn', 'Câu lạc bộ', 'Đời sống xã hội', 'Độ hài lòng', 'An toàn'];
    let sumTotal = 0;
    const metricsAvg: Record<string, string> = {};

    criteriaKeys.forEach(key => {
      const mSum = list.reduce((acc, r) => acc + (r.metrics[key] || 0), 0);
      metricsAvg[key] = (mSum / list.length).toFixed(1);
      sumTotal += (mSum / list.length);
    });

    const overall = (sumTotal / criteriaKeys.length).toFixed(1);
    return { overall: parseFloat(overall), total: list.length, metricsAvg };
  };

  const calculateProfStats = (prof_id: number) => {
    const list = profReviews.filter(r => r.prof_id === prof_id);
    if (list.length === 0) return { avg_rating: 0, avg_difficulty: 0, total_ratings: 0, would_take_again_pct: 0 };

    const sumRating = list.reduce((acc, r) => acc + r.teaching_rating, 0);
    const sumDiff = list.reduce((acc, r) => acc + r.difficulty_rating, 0);
    const wouldTakeCount = list.filter(r => r.would_take_again).length;

    return {
      avg_rating: sumRating / list.length,
      avg_difficulty: sumDiff / list.length,
      total_ratings: list.length,
      would_take_again_pct: Math.round((wouldTakeCount / list.length) * 100)
    };
  };

  // ==========================================
  // 6. AUTHENTICATION HANDLERS
  // ==========================================
  
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      setFeedbackMsg({ type: 'error', text: error.message });
      return;
    }
    if (data.user) {
      setCurrentUser({
        email: data.user.email ?? '',
        name: (data.user.user_metadata?.full_name || data.user.email?.split('@')[0]) ?? 'User',
      });
    }
    setFeedbackMsg({ type: 'success', text: 'Đăng nhập thành công!' });
    setTimeout(() => navigateToHome(), 600);
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { data: { full_name: authName } }
    });
    if (error) {
      setFeedbackMsg({ type: 'error', text: error.message });
      return;
    }
    setFeedbackMsg({ type: 'success', text: 'Tạo tài khoản thành công!' });
    setTimeout(() => navigateToHome(), 600);
  };

  // ==========================================
  // 7. RENDER BLOCKS
  // ==========================================

  const renderAuthModal = () => (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-sm transition-colors duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {authView === 'login' ? 'Đăng nhập' : 'Đăng ký'}
      </h2>
      {feedbackMsg.text && (
        <div className={`p-3 mb-4 rounded-xl text-sm font-bold ${feedbackMsg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'}`}>
          {feedbackMsg.text}
        </div>
      )}
      <form onSubmit={authView === 'login' ? handleLogin : handleSignup} className="space-y-4">
        {authView === 'signup' && (
          <input 
            type="text" placeholder="Họ và tên" value={authName} onChange={e => setAuthName(e.target.value)} 
            className="w-full p-3 rounded-xl outline-none focus:border-brand transition-colors bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" required 
          />
        )}
        <input 
          type="email" placeholder="Email (đuôi .edu.vn)" value={authEmail} onChange={e => setAuthEmail(e.target.value)} 
          className="w-full p-3 rounded-xl outline-none focus:border-brand transition-colors bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" required 
        />
        <input 
          type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} 
          className="w-full p-3 rounded-xl outline-none focus:border-brand transition-colors bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" required 
        />
        <button type="submit" className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all">
          {authView === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <button onClick={() => { setAuthView(authView === 'login' ? 'signup' : 'login'); setFeedbackMsg({ type: '', text: '' }); }} className="text-brand font-bold hover:underline">
          {authView === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );

  const renderHome = () => {
    // 1. Filter
    const filteredInstitutions = institutions.filter(inst => 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inst.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort
    let sortedInstitutions = [...filteredInstitutions];
    if (sortBy === 'name') {
      sortedInstitutions.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
      sortedInstitutions.sort((a, b) => calculateInstStats(b.id).overall - calculateInstStats(a.id).overall);
    } else if (sortBy === 'reviews') {
      sortedInstitutions.sort((a, b) => calculateInstStats(b.id).total - calculateInstStats(a.id).total);
    }

    // 3. Paginate
    const totalPages = Math.ceil(sortedInstitutions.length / entriesPerPage);
    const paginatedInstitutions = sortedInstitutions.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

    return (
      <div className="space-y-8">
        
        {/* HERO / SEARCH SECTION */}
        <div className="text-center space-y-4 pt-10 pb-4">
          {/* Fixed the title so it turns white in Dark Mode! */}
          <h1 className="text-4xl font-black text-gray-900 dark:text-white transition-colors duration-200">
            Tìm kiếm Trường Đại học hoặc Cao đẳng của bạn
          </h1>
          <input 
            type="text" 
            placeholder="Nhập tên trường (VD: HCMUT, Ngoại thương)..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full max-w-2xl px-6 py-4 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand text-lg mx-auto transition-colors duration-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" 
          />
        </div>

        
        {/* COMPACT SORT BUTTONS */}
        <div className="flex justify-center items-center gap-2 max-w-lg mx-auto">
          <button 
            onClick={() => setSortBy('name')} 
            className={`flex-1 py-2 px-1 text-xs sm:text-sm font-semibold rounded-xl transition-all border ${sortBy === 'name' ? 'bg-brand border-brand text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            A-Z
          </button>
          <button 
            onClick={() => setSortBy('rating')} 
            className={`flex-1 py-2 px-1 text-xs sm:text-sm font-semibold rounded-xl transition-all border ${sortBy === 'rating' ? 'bg-brand border-brand text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Đánh giá ⭐
          </button>
          <button 
            onClick={() => setSortBy('reviews')} 
            className={`flex-1 py-2 px-1 text-xs sm:text-sm font-semibold rounded-xl transition-all border ${sortBy === 'reviews' ? 'bg-brand border-brand text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Phổ biến 💬
          </button>
        </div>
        
        {/* INSTITUTION CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedInstitutions.map(inst => {
            const stats = calculateInstStats(inst.id);
            return (
              <div 
                key={inst.id} 
                onClick={() => navigateToInstitution(inst)} 
                className="p-6 rounded-2xl shadow-sm transition-all cursor-pointer flex flex-col justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-blue-400 hover:shadow-md group"
              >
                <div className="space-y-2">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-black px-2 py-0.5 rounded-lg text-xs transition-colors">
                    {inst.short_name}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-brand dark:group-hover:text-blue-400 transition-colors">
                    {inst.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    📍 {inst.location}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                  <span>⭐ {stats.overall}</span>
                  <span>{stats.total} đánh giá</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  const renderInstitution = () => {
    if (!selectedInst) return null;
    const stats = calculateInstStats(selectedInst.id);
    const reviews = instReviews.filter(r => r.inst_id === selectedInst.id);

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <button onClick={navigateToHome} className="hover:text-blue-600 flex items-center gap-1">
            Trang chủ
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-900">{selectedInst.name}</span>
        </div>

        <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-block bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-xl text-xs mb-2">{selectedInst.short_name}</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-gray-900">{selectedInst.name}</h2>
            <p className="text-gray-500 text-sm">{stats.total} Đánh giá tổng quan cơ sở đào tạo • {selectedInst.departments?.length || 0} Khoa / Viện</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => {
                if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                setCurrentView('add-inst-review');
              }}
              className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-2xl shadow transition-all text-sm whitespace-nowrap"
            >
              + Viết đánh giá trường
            </button>
            <button 
              onClick={() => {
                if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                setSuggestionType('department');
                setSuggSelectedUniv(selectedInst.name);
                setCurrentView('suggest');
              }}
              className="px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-2xl transition-all text-sm whitespace-nowrap border border-blue-500"
            >
              Đề xuất Khoa
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900">Các Khoa / Viện trực thuộc</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedInst.departments?.map((dept, idx) => {
              const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === dept);
              return (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div onClick={() => navigateToDepartment(selectedInst, dept)} className="cursor-pointer">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{dept}</h4>
                    <p className="text-xs text-gray-500">{deptProfs.length} Giảng viên có sẵn</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-blue-600">
                    <button onClick={() => navigateToDepartment(selectedInst, dept)} className="hover:underline">Xem danh sách giảng viên →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-gray-900">Đánh giá cơ sở vật chất & môi trường</h3>
            <span className="text-sm font-medium text-gray-500">{stats.total} đánh giá</span>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
              Chưa có đánh giá nào cho trường này. Hãy là người đầu tiên đánh giá!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 text-green-800 font-black text-2xl px-4 py-2 rounded-xl text-center min-w-[70px]">
                        {stats.overall}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng quan</p>
                        <p className="text-xs text-gray-500">Bởi: {rev.user_email || 'Sinh viên ẩn danh'}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>

                  <p className="text-gray-800 text-base font-medium">{rev.comment}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pt-2">
                    {Object.entries(rev.metrics || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-sm text-gray-700 font-medium">{key}</span>
                        <div className="flex gap-1 w-32">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-2 flex-1 rounded-full ${s <= Number(val) ? 'bg-green-300' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                          setInstReviews(instReviews.map(r => r.id === rev.id ? { ...r, helpful: r.helpful + 1 } : r));
                        }}
                        className="hover:text-blue-600 font-medium flex items-center gap-1"
                      >
                        Hữu ích 👍 {rev.helpful || 0}
                      </button>
                      <span>👎 {rev.not_helpful || 0}</span>
                    </div>
                    <button className="hover:text-red-600">🚩 Báo cáo</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDepartment = () => {
    if (!selectedInst || !selectedDept) return null;
    const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === selectedDept);
    const filteredDeptProfs = deptProfs.filter(p => p.name.toLowerCase().includes(deptSearchTerm.toLowerCase()));

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <button onClick={navigateToHome} className="hover:text-blue-600 flex items-center gap-1">
            Trang chủ
          </button>
          <span>/</span>
          <button onClick={() => navigateToInstitution(selectedInst)} className="hover:text-blue-600">
            {selectedInst.name}
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-900">{selectedDept}</span>
        </div>

        <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1">{selectedInst.name}</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-gray-900">{selectedDept}</h2>
            <p className="text-gray-500 text-sm">{deptProfs.length} Giảng viên có sẵn để đánh giá.</p>
          </div>
          <button 
            onClick={() => {
              if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
              setSuggestionType('professor');
              setSuggSelectedUniv(selectedInst.name);
              setSuggSelectedDept(selectedDept);
              setCurrentView('suggest');
            }}
            className="px-5 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-2xl shadow transition-all text-sm whitespace-nowrap"
          >
            + Thêm giảng viên
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative">
            <input 
              type="text"
              value={deptSearchTerm}
              onChange={(e) => setDeptSearchTerm(e.target.value)}
              placeholder="Tìm kiếm giảng viên trong khoa..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDeptProfs.length === 0 ? (
            <div className="col-span-2 bg-white p-8 rounded-2xl text-center text-gray-500 border border-gray-200">
              Không tìm thấy giảng viên phù hợp.
            </div>
          ) : (
            filteredDeptProfs.map(prof => {
              const stats = calculateProfStats(prof.id);
              return (
                <div 
                  key={prof.id}
                  onClick={() => navigateToProfessor(selectedInst, selectedDept, prof)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{prof.name}</h3>
                      <div className="px-3 py-1.5 rounded-xl font-black text-base bg-green-100 text-green-800 border border-green-200">
                        {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : 'N/A'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{stats.total_ratings} Đánh giá</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">ĐỘ KHÓ</span>
                      <span className="font-bold text-gray-800">{stats.avg_difficulty > 0 ? stats.avg_difficulty.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">HỌC LẠI</span>
                      <span className="font-bold text-gray-800">{stats.would_take_again_pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderProfessor = () => {
    if (!selectedProf || !selectedInst) return null;
    const stats = calculateProfStats(selectedProf.id);
    let reviews = profReviews.filter(r => r.prof_id === selectedProf.id);

    if (profSort === 'highest-quality') reviews.sort((a, b) => b.teaching_rating - a.teaching_rating);
    else if (profSort === 'lowest-quality') reviews.sort((a, b) => a.teaching_rating - b.teaching_rating);
    else if (profSort === 'highest-difficulty') reviews.sort((a, b) => b.difficulty_rating - a.difficulty_rating);
    else reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (profTagFilter !== 'all') {
      reviews = reviews.filter(r => r.tags && r.tags.includes(profTagFilter));
    }

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <button onClick={navigateToHome} className="hover:text-blue-600 flex items-center gap-1">
            Trang chủ
          </button>
          <span>/</span>
          <button onClick={() => navigateToDepartment(selectedInst, selectedProf.department)} className="hover:text-blue-600">
            {selectedProf.department}
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-900">{selectedProf.name}</span>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-green-100 text-green-800 font-black text-4xl p-6 rounded-2xl min-w-[100px] text-center border border-green-200">
              {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : 'N/A'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Giảng viên khoa {selectedProf.department} • {selectedProf.university}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{selectedProf.name}</h2>
              <p className="text-xs text-gray-400 mt-1">Dựa trên {stats.total_ratings} đánh giá</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
              setCurrentView('add-prof-review');
            }}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition-all text-sm whitespace-nowrap"
          >
            Viết đánh giá giảng viên
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Lọc theo thẻ:</span>
            <select 
              value={profTagFilter} 
              onChange={(e) => setProfTagFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium outline-none bg-gray-50 focus:bg-white"
            >
              <option value="all">Tất cả thẻ</option>
              {selectedProf.tags?.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Sắp xếp:</span>
            <select 
              value={profSort} 
              onChange={(e) => setProfSort(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium outline-none bg-gray-50 focus:bg-white"
            >
              <option value="newest">Mới nhất</option>
              <option value="highest-quality">Chất lượng cao nhất</option>
              <option value="lowest-quality">Chất lượng thấp nhất</option>
              <option value="highest-difficulty">Độ khó cao nhất</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900">Đánh giá từ sinh viên</h3>
          {reviews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
              Không tìm thấy đánh giá phù hợp với bộ lọc.
            </div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="bg-green-100 border border-green-200 rounded-xl p-3 text-center min-w-[70px]">
                      <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Chất lượng</span>
                      <span className="text-xl font-black text-green-800">{rev.teaching_rating}.0</span>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-center min-w-[70px]">
                      <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Độ khó</span>
                      <span className="text-xl font-black text-gray-700">{rev.difficulty_rating}.0</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <h4 className="text-lg font-bold text-gray-900">{rev.course}</h4>
                    <p className="text-xs text-gray-500">Bởi: {rev.user_email || 'Sinh viên'}</p>
                    <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">Tính điểm: <strong className="text-gray-900">{rev.for_credit}</strong></span>
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">Học lại: <strong className="text-gray-900">{rev.would_take_again ? 'Có' : 'Không'}</strong></span>
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">Điểm số: <strong className="text-gray-900">{rev.grade}</strong></span>
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">Giáo trình: <strong className="text-gray-900">{rev.textbook}</strong></span>
                </div>

                <p className="text-gray-800 text-base font-medium leading-relaxed">{rev.comment}</p>

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {rev.tags.map((t, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                        setProfReviews(profReviews.map(r => r.id === rev.id ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
                      }}
                      className="hover:text-blue-600 font-medium flex items-center gap-1"
                    >
                      Hữu ích 👍 {rev.helpful || 0}
                    </button>
                    <span>👎 {rev.not_helpful || 0}</span>
                  </div>
                  <button className="hover:text-red-600">🚩 Báo cáo</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAddProfReview = () => {
    if (!selectedProf) return null;

    const handleSub = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
      if (!reviewCourse.trim() || !reviewComment.trim()) {
        setFeedbackMsg({ type: 'error', text: 'Vui lòng nhập mã môn học và nhận xét.' });
        return;
      }

      const newRev = {
        prof_id: selectedProf.id,
        user_email: currentUser.email,
        course: reviewCourse.trim(),
        teaching_rating: reviewTeaching,
        difficulty_rating: reviewDifficulty,
        would_take_again: reviewWouldTakeAgain,
        for_credit: reviewfor_credit,
        textbook: reviewTextbook,
        attendance: reviewAttendance,
        grade: reviewGrade,
        tags: reviewSelectedTags,
        comment: reviewComment.trim()
      };

      const { data, error } = await supabase.from('professor_reviews').insert([newRev]).select();
      
      if (error) {
        setFeedbackMsg({ type: 'error', text: error.message });
        return;
      }

      if (data) setProfReviews([data[0] as ProfessorReview, ...profReviews]);
      setFeedbackMsg({ type: 'success', text: 'Đánh giá đã được gửi thành công!' });
      setTimeout(() => setCurrentView('professor'), 1000);
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">{selectedProf.name}</h2>
          <p className="text-lg font-bold text-gray-700 mt-1">Viết Đánh Giá</p>
          <p className="text-sm text-gray-500 mt-1">{selectedProf.department} • <span className="underline">{selectedProf.university}</span></p>
          <p className="text-xs text-blue-600 font-bold mt-1">Đang đăng nhập với tư cách: {currentUser?.email}</p>
        </div>

        {feedbackMsg.text && (
          <div className={`p-4 rounded-xl text-sm font-medium ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {feedbackMsg.text}
          </div>
        )}

        <form onSubmit={handleSub} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <label className="block text-base font-bold text-gray-900">Mã môn học *</label>
            <input 
              type="text"
              value={reviewCourse}
              onChange={(e) => setReviewCourse(e.target.value)}
              placeholder="VD: CS101, MTH101..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer pt-2">
              <input type="checkbox" checked={isOnlineCourse} onChange={(e) => setIsOnlineCourse(e.target.checked)} className="w-4 h-4 rounded" />
              💻 Đây là khóa học trực tuyến
            </label>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4 text-center">
            <label className="block text-base font-bold text-gray-900 text-left">Đánh giá giảng viên *</label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setReviewTeaching(num)}
                  className={`w-16 h-14 rounded-xl font-black text-lg transition-all border ${reviewTeaching === num ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 px-2 font-medium">
              <span>1 - Rất tệ</span>
              <span>5 - Tuyệt vời</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4 text-center">
            <label className="block text-base font-bold text-gray-900 text-left">Độ khó của môn học *</label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setReviewDifficulty(num)}
                  className={`w-16 h-14 rounded-xl font-black text-lg transition-all border ${reviewDifficulty === num ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 px-2 font-medium">
              <span>1 - Rất dễ</span>
              <span>5 - Rất khó</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <label className="block text-base font-bold text-gray-900">Bạn có muốn học lại với giảng viên này không? *</label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setReviewWouldTakeAgain(true)}
                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${reviewWouldTakeAgain ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                Có
              </button>
              <button 
                type="button"
                onClick={() => setReviewWouldTakeAgain(false)}
                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${!reviewWouldTakeAgain ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                Không
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-sm">Môn học này có tính tín chỉ?</span>
              <div className="flex gap-2">
                {['Có', 'Không'].map(opt => (
                  <button key={opt} type="button" onClick={() => setReviewfor_credit(opt)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${reviewfor_credit === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-sm">Giảng viên có dùng giáo trình?</span>
              <div className="flex gap-2">
                {['Có', 'Không'].map(opt => (
                  <button key={opt} type="button" onClick={() => setReviewTextbook(opt)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${reviewTextbook === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-sm">Điểm danh có bắt buộc?</span>
              <div className="flex gap-2">
                {['Có', 'Không'].map(opt => (
                  <button key={opt} type="button" onClick={() => setReviewAttendance(opt)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${reviewAttendance === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{opt}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Điểm số đạt được</label>
              <select value={reviewGrade} onChange={(e) => setReviewGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-gray-50 font-medium">
                {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Đạt', 'Chưa hoàn thành'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <label className="block text-base font-bold text-gray-900">Chọn tối đa 3 thẻ đặc điểm</label>
            <div className="flex flex-wrap gap-2">
              {['Nghiêm khắc', 'Bài giảng tuyệt vời', 'Tiêu chí chấm rõ ràng', 'Phản hồi tốt', 'Truyền cảm hứng', 'Nhiều bài tập', 'Tận tâm', 'Được tôn trọng'].map(t => {
                const selected = reviewSelectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (selected) setReviewSelectedTags(reviewSelectedTags.filter(x => x !== t));
                      else if (reviewSelectedTags.length < 3) setReviewSelectedTags([...reviewSelectedTags, t]);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <label className="block text-base font-bold text-gray-900">Viết nhận xét chi tiết *</label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Bạn muốn sinh viên khác biết điều gì về giảng viên này?"
              className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg text-lg transition-all">
            Gửi Đánh Giá
          </button>
        </form>
      </div>
    );
  };

  const renderAddInstReview = () => {
    if (!selectedInst) return null;

    const handleInstSub = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
      if (!instReviewComment.trim()) {
        setFeedbackMsg({ type: 'error', text: 'Vui lòng nhập nhận xét.' });
        return;
      }

      const newRev = {
        inst_id: selectedInst.id,
        user_email: currentUser.email,
        metrics: { ...instMetrics },
        comment: instReviewComment.trim()
      };

      const { data, error } = await supabase.from('institution_reviews').insert([newRev]).select();

      if (error) {
        setFeedbackMsg({ type: 'error', text: error.message });
        return;
      }

      if (data) setInstReviews([data[0] as InstitutionReview, ...instReviews]);
      setFeedbackMsg({ type: 'success', text: 'Đánh giá trường đã được gửi!' });
      setTimeout(() => setCurrentView('institution'), 1000);
    };

    const criteriaList = ['Uy tín trường', 'Địa điểm', 'Cơ hội việc làm', 'Cơ sở vật chất', 'Mạng Internet', 'Đồ ăn', 'Câu lạc bộ', 'Đời sống xã hội', 'Độ hài lòng', 'An toàn'];

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-6">
        <div>
          <p className="text-sm font-semibold text-gray-500">{selectedInst.location}</p>
          <h2 className="text-3xl font-black text-gray-900">{selectedInst.name}</h2>
          <p className="text-lg font-bold text-gray-700 mt-1">Viết Đánh Giá Cơ Sở Đào Tạo</p>
          <p className="text-xs text-blue-600 font-bold mt-1">Đang đăng nhập với tư cách: {currentUser?.email}</p>
        </div>

        {feedbackMsg.text && (
          <div className={`p-4 rounded-xl text-sm font-medium ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {feedbackMsg.text}
          </div>
        )}

        <form onSubmit={handleInstSub} className="space-y-6">
          {criteriaList.map(criteria => (
            <div key={criteria} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <label className="block text-base font-bold text-gray-900">{criteria} *</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setInstMetrics({ ...instMetrics, [criteria]: num })}
                    className={`flex-1 h-12 rounded-xl font-bold transition-all border ${instMetrics[criteria] === num ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>1 - Rất tệ</span>
                <span>5 - Tuyệt vời</span>
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <label className="block text-base font-bold text-gray-900">Nhận xét chi tiết *</label>
            <textarea
              rows={4}
              value={instReviewComment}
              onChange={(e) => setInstReviewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm thực tế của bạn tại trường này..."
              className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg text-lg transition-all">
            Gửi Đánh Giá Trường
          </button>
        </form>
      </div>
    );
  };

  // ==========================================
  // DYNAMIC SUGGESTION RENDERER
  // ==========================================
  const renderSuggest = () => {
    // 1. Prepare options for University searchable select: "SHORT_NAME - Name"
    const univOptions = institutions.map(i => ({
      value: i.name,
      label: `${i.short_name} - ${i.name}`
    }));

    // 2. Prepare options for Departments based on selected University
    const selectedUnivObj = institutions.find(i => i.name === suggSelectedUniv);
    const deptOptions = selectedUnivObj?.departments?.map(d => ({
      value: d,
      label: d
    })) || [];

    // 3. Prepare options for Vietnam Provinces
    const provinceOptions = VIETNAM_PROVINCES.map(p => ({
      value: p,
      label: p
    }));

    const handleSubmitSuggest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }

      let newSugg: Partial<Suggestion> = {
        type: suggestionType,
        user_email: currentUser.email,
        content: suggestionContent.trim(),
        status: 'Chờ xét duyệt'
      };

      if (suggestionType === 'professor') {
        if (!suggProfName.trim() || !suggSelectedUniv || !suggSelectedDept) {
          setFeedbackMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ tên giảng viên, trường đại học và khoa.' });
          return;
        }
        newSugg.targetName = suggProfName.trim();
        newSugg.university = suggSelectedUniv;
        newSugg.department = suggSelectedDept;
      } else if (suggestionType === 'institution') {
        if (!suggInstName.trim() || !suggInstShortName.trim() || !suggInstLocation) {
          setFeedbackMsg({ type: 'error', text: 'Vui lòng nhập tên trường, tên viết tắt và chọn tỉnh/thành phố.' });
          return;
        }
        newSugg.targetName = suggInstName.trim();
        newSugg.short_name = suggInstShortName.trim();
        newSugg.location = suggInstLocation;
        // Parse comma-separated text into array
        newSugg.departments = suggInstDepartmentsText
          ? suggInstDepartmentsText.split(',').map(d => d.trim()).filter(Boolean)
          : [];
      } else if (suggestionType === 'department') {
        if (!suggSelectedUniv || !suggNewDeptName.trim()) {
          setFeedbackMsg({ type: 'error', text: 'Vui lòng chọn trường và nhập tên khoa mới.' });
          return;
        }
        newSugg.targetName = suggNewDeptName.trim();
        newSugg.university = suggSelectedUniv;
        newSugg.department = suggNewDeptName.trim();
      }

      const { data, error } = await supabase.from('suggestions').insert([newSugg]).select();

      if (error) {
        setFeedbackMsg({ type: 'error', text: error.message });
        return;
      }

      if (data) setSuggestions([data[0] as Suggestion, ...suggestions]);
      setFeedbackMsg({ type: 'success', text: 'Đề xuất đã được gửi thành công và đang chờ xét duyệt!' });

      // Reset form fields
      setSuggProfName('');
      setSuggInstName('');
      setSuggInstShortName('');
      setSuggInstLocation('');
      setSuggInstDepartmentsText('');
      setSuggNewDeptName('');
      setSuggestionContent('');
    };

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn py-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Đề xuất Thêm mới / Chỉnh sửa Dữ liệu</h2>
            <p className="text-sm text-gray-500 mt-1">Gửi đề xuất thêm trường, khoa hoặc giảng viên mới vào hệ thống.</p>
            <p className="text-xs text-blue-600 font-bold mt-1">Đang đăng nhập với tư cách: {currentUser?.email}</p>
          </div>

          {feedbackMsg.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
              {feedbackMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmitSuggest} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Loại đề xuất *</label>
              <select 
                value={suggestionType} 
                onChange={(e) => {
                  setSuggestionType(e.target.value as any);
                  setFeedbackMsg({ type: '', text: '' });
                }} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-gray-50 font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="professor">Giảng viên mới</option>
                <option value="institution">Trường đại học mới</option>
                <option value="department">Khoa / Viện mới</option>
              </select>
            </div>

            {/* DYNAMIC FORM FIELDS BASED ON TYPE */}
            {suggestionType === 'professor' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên giảng viên *</label>
                  <input 
                    type="text"
                    value={suggProfName}
                    onChange={(e) => setSuggProfName(e.target.value)}
                    placeholder="VD: PGS. TS Nguyễn Văn B"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <SearchableSelect 
                  label="Trường đại học *"
                  placeholder="-- Chọn trường đại học --"
                  options={univOptions}
                  value={suggSelectedUniv}
                  onChange={(val) => {
                    setSuggSelectedUniv(val);
                    setSuggSelectedDept(''); // reset dept selection when univ changes
                  }}
                />

                <SearchableSelect 
                  label="Khoa / Trực thuộc *"
                  placeholder={suggSelectedUniv ? "-- Chọn khoa --" : "Vui lòng chọn trường trước"}
                  options={deptOptions}
                  value={suggSelectedDept}
                  onChange={(val) => setSuggSelectedDept(val)}
                />
              </div>
            )}

            {suggestionType === 'institution' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên đầy đủ trường Đại học *</label>
                  <input 
                    type="text"
                    value={suggInstName}
                    onChange={(e) => setSuggInstName(e.target.value)}
                    placeholder="VD: Trường Đại học Ngoại thương"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên viết tắt / Mã trường *</label>
                  <input 
                    type="text"
                    value={suggInstShortName}
                    onChange={(e) => setSuggInstShortName(e.target.value)}
                    placeholder="VD: FTU"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <SearchableSelect 
                  label="Tỉnh / Thành phố *"
                  placeholder="-- Chọn tỉnh / thành phố --"
                  options={provinceOptions}
                  value={suggInstLocation}
                  onChange={(val) => setSuggInstLocation(val)}
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Danh sách Khoa / Viện (không bắt buộc, phân cách bằng dấu phẩy)</label>
                  <input 
                    type="text"
                    value={suggInstDepartmentsText}
                    onChange={(e) => setSuggInstDepartmentsText(e.target.value)}
                    placeholder="VD: Kinh tế Quốc tế, Quản trị Kinh doanh, Tài chính - Ngân hàng"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            )}

            {suggestionType === 'department' && (
              <div className="space-y-4 pt-2">
                <SearchableSelect 
                  label="Trường đại học *"
                  placeholder="-- Chọn trường đại học --"
                  options={univOptions}
                  value={suggSelectedUniv}
                  onChange={(val) => setSuggSelectedUniv(val)}
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên Khoa / Viện mới *</label>
                  <input 
                    type="text"
                    value={suggNewDeptName}
                    onChange={(e) => setSuggNewDeptName(e.target.value)}
                    placeholder="VD: Khoa Khởi nghiệp và Đổi mới Sáng tạo"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú thêm / Lý do đề xuất</label>
              <textarea 
                rows={3}
                value={suggestionContent}
                onChange={(e) => setSuggestionContent(e.target.value)}
                placeholder="Cung cấp thêm thông tin xác thực hoặc link bài báo/website..."
                className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              ></textarea>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all">
                Gửi đề xuất xét duyệt
              </button>
              <button type="button" onClick={navigateToHome} className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all">
                Trang chủ
              </button>
            </div>
          </form>
        </div>

        {suggestions.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Danh sách đề xuất của bạn ({suggestions.length})</h3>
            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-lg mb-1 uppercase tracking-wider">{s.type}</span>
                    <h4 className="font-bold text-gray-900">{s.targetName}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.university ? `${s.university} ` : ''} 
                      {s.department ? `• ${s.department}` : ''}
                      {s.location ? ` • ${s.location}` : ''}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Gửi bởi: {s.user_email}</p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-600 font-medium">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  return (
    // 1. App Wrapper: Flexbox, Min-Height 100vh, Dark Mode styling
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* 2. HEADER */}
      <header className="bg-brand dark:bg-gray-800 text-white shadow-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black cursor-pointer tracking-tight flex items-center gap-2" onClick={() => setCurrentView('home')}>
            🎓 RateVietProfessors
          </div>
          <div className="flex items-center gap-4">
            {/* DARK MODE TOGGLE */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="text-xl p-2 rounded-full hover:bg-white/20 transition"
              title="Chế độ tối"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold bg-blue-800 px-3 py-1.5 rounded-xl hidden sm:inline-block">👤 {currentUser.name}</span>
                <button onClick={async () => { await supabase.auth.signOut(); setCurrentView('home'); }} className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold transition-all">Đăng xuất</button>
              </div>
            ) : (
              <button onClick={() => { setCurrentView('auth'); setAuthView('login'); }} className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap">Đăng nhập</button>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'institution' && renderInstitution()}
        {currentView === 'department' && renderDepartment()}
        {currentView === 'professor' && renderProfessor()}
        {currentView === 'add-prof-review' && renderAddProfReview()}
        {currentView === 'add-inst-review' && renderAddInstReview()}
        {currentView === 'suggest' && renderSuggest()}
        {currentView === 'auth' && renderAuthModal()}
      </main>

      {/* 4. PERSISTENT FOOTER */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} RateVietProfessors. made with 💖 from HCMC.</p>
          <div className="mt-4 md:mt-0 flex gap-6 font-medium">
            <a href="#" className="hover:text-brand dark:hover:text-white transition">Về chúng tôi</a>
            <a href="#" className="hover:text-brand dark:hover:text-white transition">Quy tắc cộng đồng</a>
            <a href="#" className="hover:text-brand dark:hover:text-white transition">Bảo mật</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
