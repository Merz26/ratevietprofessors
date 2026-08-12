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
  id: string;
  inst_id: number;
  user_email: string;
  comment: string;
  created_at: string;
  metrics: Record<string, number>;
  helpful: number;
  not_helpful: number;
}

export interface ProfessorReview {
  id: string;
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

  // -- Routing / Navigation State --
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professor | null>(null);

  // -- UI & List State --
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 20;
  
  // ==========================================
  // 3. EFFECTS (LIFECYCLES)
  // ==========================================

  // Dark Mode HTML Injector
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

  // Auth Session Handler
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

  // Database Fetcher
  useEffect(() => {
    async function fetchData() {
      const [instRes, profRes, instRevRes, profRevRes] = await Promise.all([
        supabase.from('institutions').select('*'),
        supabase.from('professors').select('*'),
        supabase.from('institution_reviews').select('*'),
        supabase.from('professor_reviews').select('*')
      ]);

      if (instRes.data) setInstitutions(instRes.data);
      if (profRes.data) setProfessors(profRes.data);
      if (instRevRes.data) setInstReviews(instRevRes.data);
      if (profRevRes.data) setProfReviews(profRevRes.data);
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

  // ==========================================
  // 5. HELPER FUNCTIONS
  // ==========================================
  
  const calculateInstStats = (inst_id: number) => {
    const list = instReviews.filter(r => r.inst_id === inst_id);
    if (list.length === 0) return { overall: '0.0', total: 0 };
    let sumTotal = 0;
    list.forEach(r => {
      const avgMetric = Object.values(r.metrics).reduce((a, b) => a + b, 0) / Object.values(r.metrics).length;
      sumTotal += avgMetric;
    });
    return { overall: (sumTotal / list.length).toFixed(1), total: list.length };
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
      sortedInstitutions.sort((a, b) => parseFloat(calculateInstStats(b.id).overall) - parseFloat(calculateInstStats(a.id).overall));
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
          <h1 className="text-4xl font-black text-gray-900 dark:text-white transition-colors duration-200">
            Tìm kiếm Trường Đại học của bạn
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

        {/* MOBILE-FRIENDLY PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-10">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-40 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              ← Trước
            </button>
            
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Trang {currentPage} / {totalPages}
            </span>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-40 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Sau →
            </button>
          </div>
        )}

      </div>
    );
  };

  // UI Loading Screen
  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-medium transition-colors">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* HEADER */}
      <header className="bg-brand dark:bg-gray-800 text-white shadow-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black cursor-pointer tracking-tight flex items-center gap-2" onClick={navigateToHome}>
            🎓 RateVietProfessors
          </div>
          <div className="flex items-center gap-4">
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="text-xl p-2 rounded-full hover:bg-white/20 transition"
              title="Chế độ tối"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold bg-blue-800 dark:bg-gray-700 px-3 py-1.5 rounded-xl hidden sm:inline-block">
                  👤 {currentUser.name}
                </span>
                <button 
                  onClick={async () => { await supabase.auth.signOut(); navigateToHome(); }} 
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold transition-all"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setCurrentView('auth'); setAuthView('login'); }} 
                className="px-4 py-2 bg-white text-brand hover:bg-gray-100 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'auth' && renderAuthModal()}
        
        {/* Placeholder for institution internal views if they exist in your local code */}
        {currentView === 'institution' && selectedInst && (
           <div className="text-center py-20">
             <button onClick={navigateToHome} className="text-brand mb-4 font-bold hover:underline">← Quay lại danh sách trường</button>
             <h2 className="text-3xl font-black">{selectedInst.name}</h2>
             <p className="text-gray-500 dark:text-gray-400 mt-2">Dữ liệu đánh giá khoa và giảng viên sẽ được hiển thị ở đây.</p>
           </div>
        )}
      </main>

      {/* PERSISTENT FOOTER */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} RateVietProfessors. Nền tảng đánh giá giảng viên.</p>
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
