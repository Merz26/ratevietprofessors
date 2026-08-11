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

  // -- Search & Filter State --
  const [searchTerm, setSearchTerm] = useState('');
  
  // ==========================================
  // 3. EFFECTS (LIFECYCLES)
  // ==========================================

  // Effect: Handle Persistent Login & Auth State Changes
  useEffect(() => {
    // Check initial session from LocalStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] ?? 'User',
        });
      }
      setLoadingSession(false);
    });

    // Listen for ongoing auth changes (login/logout elsewhere)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] ?? 'User',
        });
      } else {
        setCurrentUser(null);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect: Fetch Master Data on App Mount
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

  // Effect: Handle Browser Back/Forward buttons (History API)
  useEffect(() => {
    const handlePopState = () => {
      // Basic reset to home on pop. For a robust app, parse window.location.pathname here
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
    if (list.length === 0) return { overall: 0, total: 0 };
    // Simplified logic for brevity: Calculate average across all metrics
    let sumTotal = 0;
    list.forEach(r => {
      const avgMetric = Object.values(r.metrics).reduce((a, b) => a + b, 0) / Object.values(r.metrics).length;
      sumTotal += avgMetric;
    });
    return { overall: (sumTotal / list.length).toFixed(1), total: list.length };
  };

  const calculateProfStats = (prof_id: number) => {
    const list = profReviews.filter(r => r.prof_id === prof_id);
    if (list.length === 0) return { avg_rating: 0, total_ratings: 0 };
    const sumRating = list.reduce((acc, r) => acc + r.teaching_rating, 0);
    return {
      avg_rating: (sumRating / list.length).toFixed(1),
      total_ratings: list.length,
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
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] ?? 'User',
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">{authView === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
      {feedbackMsg.text && (
        <div className={`p-3 mb-4 rounded-xl text-sm font-bold ${feedbackMsg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {feedbackMsg.text}
        </div>
      )}
      <form onSubmit={authView === 'login' ? handleLogin : handleSignup} className="space-y-4">
        {authView === 'signup' && (
          <input type="text" placeholder="Họ và tên" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" required />
        )}
        <input type="email" placeholder="Email (đuôi .edu.vn)" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" required />
        <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" required />
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all">
          {authView === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <button onClick={() => { setAuthView(authView === 'login' ? 'signup' : 'login'); setFeedbackMsg({ type: '', text: '' }); }} className="text-blue-600 font-bold hover:underline">
          {authView === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );

  const renderHome = () => {
    const filteredInstitutions = institutions.filter(inst => 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inst.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-8">
        <div className="text-center space-y-4 py-10">
          <h1 className="text-4xl font-black text-gray-900">Tìm kiếm Trường Đại học của bạn</h1>
          <input type="text" placeholder="Nhập tên trường hoặc từ khóa (VD: HCMUT, Ngoại thương)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-2xl px-6 py-4 rounded-2xl border border-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-lg mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredInstitutions.map(inst => {
            const stats = calculateInstStats(inst.id);
            return (
              <div key={inst.id} onClick={() => navigateToInstitution(inst)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-block bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded-lg text-xs">{inst.short_name}</span>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{inst.name}</h3>
                  <p className="text-sm text-gray-500">📍 {inst.location}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-medium text-gray-700">
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

  // Prevent UI flashing while checking session
  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-600 font-medium">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black cursor-pointer tracking-tight flex items-center gap-2" onClick={navigateToHome}>
            🎓 RateVietProfessors
          </div>
          <div>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold bg-blue-800 px-3 py-1.5 rounded-xl hidden sm:inline-block">👤 {currentUser.name}</span>
                <button onClick={async () => { await supabase.auth.signOut(); navigateToHome(); }} className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold transition-all">Đăng xuất</button>
              </div>
            ) : (
              <button onClick={() => { setCurrentView('auth'); setAuthView('login'); }} className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap">Đăng nhập</button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT ROUTER */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'auth' && renderAuthModal()}
        
        {/* Simplified Placeholders for other views (expand logic as needed based on your components) */}
        {currentView === 'institution' && selectedInst && (
           <div>
             <button onClick={navigateToHome} className="text-blue-600 mb-4 font-bold">← Quay lại danh sách trường</button>
             <h2 className="text-3xl font-black">{selectedInst.name}</h2>
             {/* Iterate through selectedInst.departments... */}
           </div>
        )}
      </main>
    </div>
  );
}
