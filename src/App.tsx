import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ==========================================
// INTERFACES & TYPES
// ==========================================
interface Institution {
  id: number;
  name: string;
  short_name: string;
  location: string;
  departments: string[];
}

interface Professor {
  id: number;
  name: string;
  university: string;
  department: string;
  tags: string[];
}

interface User {
  email: string;
  name: string;
}

export default function App() {
  // ==========================================
  // APPLICATION STATE
  // ==========================================
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('home');
  const [authView, setAuthView] = useState<string>('login'); // 'login' or 'signup'
  
  // Form states for Authentication
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Home filter, sorting & pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<'default' | 'rating' | 'reviews'>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 28;

  // Active selections for nested views
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professor | null>(null);

  // Suggestion & Review specific states
  const [suggestionType, setSuggestionType] = useState<'institution' | 'professor'>('institution');
  const [suggestionTargetName, setSuggestionTargetName] = useState<string>('');
  const [suggestionContent, setSuggestionContent] = useState<string>('');

  // ==========================================
  // PERSISTENT AUTHENTICATION INITIALIZATION
  // ==========================================
  useEffect(() => {
    // 1. Fetch any existing Supabase session from browser storage on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email ?? '',
          name: (session.user.user_metadata?.full_name || session.user.email?.split('@')[0]) ?? 'User',
        });
      }
      setLoadingSession(false);
    });

    // 2. Setup real-time listener for authentication status changes
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

    // Clean up memory subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // DATA COLLECTIONS (Placeholder data cleared)
  // ==========================================
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  
  // Fetch institutions from Supabase on application load
  useEffect(() => {
    async function fetchInstitutions() {
      const { data, error } = await supabase.from('institutions').select('*');
      if (data && !error) {
        setInstitutions(data);
      } else if (error) {
        console.error('Error fetching institutions:', error.message);
      }
    }

    fetchInstitutions();
  }, []);

  // ==========================================
  // HELPER FUNCTIONS & CALCULATIONS
  // ==========================================
  const calculateInstStats = (instId: number) => {
    // Computes overall review score and volume metrics per institution
    return { overall: 0, total: 0 };
  };

  // Handle Login submission with Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

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
      setFeedbackMsg({ type: 'success', text: 'Đăng nhập thành công!' });
      setTimeout(() => setCurrentView('home'), 600);
    }
  };

  // Handle Signup submission with Supabase Auth
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { data: { full_name: authName } },
    });

    if (error) {
      setFeedbackMsg({ type: 'error', text: error.message });
      return;
    }

    setCurrentUser({ email: authEmail, name: authName });
    setFeedbackMsg({ type: 'success', text: 'Tạo tài khoản thành công!' });
    setTimeout(() => setCurrentView('home'), 600);
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================
  const renderHome = () => {
    // Filter institutions based on search text input
    const filteredInstitutions = institutions.filter(inst => 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort institutions based on selected sort criteria ('rating' or 'reviews')
    const sortedInstitutions = [...filteredInstitutions].sort((a, b) => {
      const statsA = calculateInstStats(a.id);
      const statsB = calculateInstStats(b.id);
      
      if (sortOption === 'rating') {
        return statsB.overall - statsA.overall;
      }
      if (sortOption === 'reviews') {
        return statsB.total - statsA.total;
      }
      return 0;
    });

    // Paginate institutions (28 items per page)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInstitutions = sortedInstitutions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedInstitutions.length / itemsPerPage);

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Hero Search Section */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 md:p-12 rounded-3xl shadow-xl text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Tìm kiếm trường Đại học hoặc Cao đẳng</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base">
            Mạng lưới minh bạch đánh giá giáo dục dành cho sinh viên Việt Nam.
          </p>
          <div className="max-w-xl mx-auto relative pt-2">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Nhập tên trường, viết tắt (VD: HCMUT, NEU)..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 shadow-lg outline-none font-medium text-lg placeholder-gray-400 focus:ring-4 focus:ring-blue-300 transition-all"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Sorting Controls & Section Header */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black text-gray-900">Các trường Đại học ({sortedInstitutions.length})</h2>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-between">
              <select 
                value={sortOption} 
                onChange={(e) => { setSortOption(e.target.value as any); setCurrentPage(1); }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Mặc định</option>
                <option value="rating">Xếp hạng cao → thấp</option>
                <option value="reviews">Nổi bật</option>
              </select>

              <button 
                onClick={() => {
                  if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                  setSuggestionType('institution');
                  setSuggestionTargetName('');
                  setSuggestionContent('');
                  setCurrentView('suggest');
                }}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-all whitespace-nowrap"
              >
                + Đề xuất thêm trường
              </button>
            </div>
          </div>

          {/* Institution Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentInstitutions.map(inst => {
              const stats = calculateInstStats(inst.id);
              return (
                <div 
                  key={inst.id}
                  onClick={() => {
                    setSelectedInst(inst);
                    setCurrentView('institution');
                  }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="inline-block bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded-lg text-xs tracking-wide">
                        {inst.short_name}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{stats.total} đánh giá</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{inst.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {inst.location}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500 text-xs font-semibold uppercase">Điểm trung bình:</span>
                    <span className={`font-black text-base px-2.5 py-1 rounded-lg ${stats.overall > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {stats.overall > 0 ? `${stats.overall}/5` : 'Chưa có'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInstitution = () => <div>{/* Institution Detail View */}</div>;
  const renderDepartment = () => <div>{/* Department View */}</div>;
  const renderProfessor = () => <div>{/* Professor Profile View */}</div>;
  const renderAddProfReview = () => <div>{/* Add Professor Review View */}</div>;
  const renderAddInstReview = () => <div>{/* Add Institution Review View */}</div>;
  const renderSuggest = () => <div>{/* Suggestion View */}</div>;

  const renderAuthModal = () => (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mt-12">
      <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
        {authView === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký tài khoản mới'}
      </h2>

      {feedbackMsg && (
        <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {feedbackMsg.text}
        </div>
      )}

      <form onSubmit={authView === 'login' ? handleLogin : handleSignup} className="space-y-4">
        {authView === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Họ và tên</label>
            <input 
              type="text"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Nguyễn Văn A"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email</label>
          <input 
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="email@domain.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mật khẩu</label>
          <input 
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md"
        >
          {authView === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        {authView === 'login' ? (
          <p className="text-gray-600">
            Chưa có tài khoản?{' '}
            <button onClick={() => setAuthView('signup')} className="text-blue-600 font-bold hover:underline">
              Đăng ký ngay
            </button>
          </p>
        ) : (
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <button onClick={() => setAuthView('login')} className="text-blue-600 font-bold hover:underline">
              Đăng nhập
            </button>
          </p>
        )}
      </div>
    </div>
  );

  // ==========================================
  // SESSION LOADING GUARD
  // ==========================================
  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-600 font-medium">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  // ==========================================
  // MAIN APP LAYOUT
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => { setCurrentView('home'); setSelectedInst(null); }}
            className="text-xl font-black tracking-wider hover:opacity-90 transition-opacity"
          >
            RateVietProfessors
          </button>
          
          <div>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-blue-800 px-3 py-1.5 rounded-xl hidden sm:inline-block">
                  👤 {currentUser.name}
                </span>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                    setCurrentView('home');
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold transition-all"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setCurrentView('auth'); setAuthView('login'); }}
                  className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'institution' && renderInstitution()}
        {currentView === 'department' && renderDepartment()}
        {currentView === 'professor' && renderProfessor()}
        {currentView === 'add-prof-review' && renderAddProfReview()}
        {currentView === 'add-inst-review' && renderAddInstReview()}
        {currentView === 'suggest' && renderSuggest()}
        {currentView === 'auth' && renderAuthModal()}
      </main>
    </div>
  );
}
