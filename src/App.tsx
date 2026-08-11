import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

const initialInstitutions = [
  {
    id: 1,
    name: 'Đại học Bách Khoa TP.HCM',
    shortName: 'HCMUT',
    location: 'Hồ Chí Minh',
    departments: ['Khoa học Máy tính', 'Điện - Điện tử', 'Kỹ thuật Xây dựng']
  },
  {
    id: 2,
    name: 'Đại học Khoa học Tự nhiên',
    shortName: 'HCMUS',
    location: 'Hồ Chí Minh',
    departments: ['Công nghệ Thông tin', 'Toán - Tin học', 'Hóa học']
  },
  {
    id: 3,
    name: 'Đại học Kinh tế Quốc dân',
    shortName: 'NEU',
    location: 'Hà Nội',
    departments: ['Kế toán', 'Tài chính - Ngân hàng', 'Quản trị Kinh doanh']
  },
  {
    id: 4,
    name: 'Đại học Ngoại thương',
    shortName: 'FTU',
    location: 'Hà Nội',
    departments: ['Kinh tế Quốc tế', 'Quản trị Kinh doanh Quốc tế', 'Tài chính Quốc tế']
  }
];

const initialProfessors = [
  { id: 1, name: 'Nguyễn Văn A', university: 'Đại học Bách Khoa TP.HCM', department: 'Khoa học Máy tính', tags: ['Nhiệt tình', 'Chấm điểm dễ', 'Nhiều bài tập'] },
  { id: 2, name: 'Vũ Đức E', university: 'Đại học Bách Khoa TP.HCM', department: 'Khoa học Máy tính', tags: ['Giảng hay', 'Nghiêm khắc'] },
  { id: 3, name: 'Trần Thị B', university: 'Đại học Kinh tế Quốc dân', department: 'Kế toán', tags: ['Điểm danh khắt khe', 'Giảng hay'] },
  { id: 4, name: 'Lê Văn C', university: 'Đại học Ngoại thương', department: 'Kinh tế Quốc tế', tags: ['Vui tính', 'Truyền cảm hứng'] },
  { id: 5, name: 'Phạm Thị D', university: 'Đại học Khoa học Tự nhiên', department: 'Công nghệ Thông tin', tags: ['Rất khó', 'Nhiều bài tập'] }
];

const initialInstitutionReviews = [
  {
    id: 101,
    instId: 1,
    user_email: 'sinhvien@hcmut.edu.vn',
    comment: 'Trường học tuyệt vời và khuôn viên rất đẹp!',
    created_at: '2026-08-06',
    metrics: {
      'Uy tín trường': 5,
      'Địa điểm': 5,
      'Cơ hội việc làm': 5,
      'Cơ sở vật chất': 5,
      'Mạng Internet': 5,
      'Đồ ăn': 5,
      'Câu lạc bộ': 5,
      'Đời sống xã hội': 5,
      'Độ hài lòng': 5,
      'An toàn': 5
    },
    helpful: 4,
    notHelpful: 0
  }
];

const initialProfReviews = [
  {
    id: 201,
    prof_id: 1,
    user_email: 'bchieu@hcmut.edu.vn',
    course: 'CS101',
    teaching_rating: 5,
    difficulty_rating: 2,
    would_take_again: true,
    forCredit: 'Có',
    textbook: 'Không',
    attendance: 'Có',
    grade: 'A+',
    tags: ['Bài giảng tuyệt vời', 'Truyền cảm hứng'],
    comment: 'Thầy rất tâm huyết với môn học và nhiệt tình hỗ trợ sinh viên!!',
    created_at: '2026-08-11',
    helpful: 12,
    notHelpful: 1
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [authView, setAuthView] = useState('login'); // 'login', 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  const [institutions, setInstitutions] = useState(initialInstitutions);
  const [professors, setProfessors] = useState(initialProfessors);
  const [instReviews, setInstReviews] = useState(initialInstitutionReviews);
  const [profReviews, setProfReviews] = useState(initialProfReviews);
  const [suggestions, setSuggestions] = useState([]);

  const [currentView, setCurrentView] = useState('home'); // 'home', 'institution', 'department', 'professor', 'add-prof-review', 'add-inst-review', 'suggest', 'auth'
  const [selectedInst, setSelectedInst] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProf, setSelectedProf] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [profSort, setProfSort] = useState('newest');
  const [profTagFilter, setProfTagFilter] = useState('all');

  // Suggestion State
  const [suggestionType, setSuggestionType] = useState('professor');
  const [suggestionTargetName, setSuggestionTargetName] = useState('');
  const [suggestionContent, setSuggestionContent] = useState('');

  // Professor Review State
  const [reviewCourse, setReviewCourse] = useState('');
  const [isOnlineCourse, setIsOnlineCourse] = useState(false);
  const [reviewTeaching, setReviewTeaching] = useState(5);
  const [reviewDifficulty, setReviewDifficulty] = useState(3);
  const [reviewWouldTakeAgain, setReviewWouldTakeAgain] = useState(true);
  const [reviewForCredit, setReviewForCredit] = useState('Có');
  const [reviewTextbook, setReviewTextbook] = useState('Không');
  const [reviewAttendance, setReviewAttendance] = useState('Có');
  const [reviewGrade, setReviewGrade] = useState('A');
  const [reviewSelectedTags, setReviewSelectedTags] = useState([]);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    async function fetchData() {
      let { data: instData } = await supabase.from('institutions').select('*');
      if (instData) setInstitutions(instData);

      let { data: profData } = await supabase.from('professors').select('*');
      if (profData) setProfessors(profData);

      let { data: instRevData } = await supabase.from('institution_reviews').select('*');
      if (instRevData) setInstReviews(instRevData);

      let { data: profRevData } = await supabase.from('professor_reviews').select('*');
      if (profRevData) setProfReviews(profRevData);
    }
    fetchData();
  }, []);
  
  // Institution Review State
  const [instMetrics, setInstMetrics] = useState({
    'Uy tín trường': 5,
    'Địa điểm': 5,
    'Cơ hội việc làm': 5,
    'Cơ sở vật chất': 5,
    'Mạng Internet': 5,
    'Đồ ăn': 5,
    'Câu lạc bộ': 5,
    'Đời sống xã hội': 5,
    'Độ hài lòng': 5,
    'An toàn': 5
  });
  const [instReviewComment, setInstReviewComment] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const calculateInstStats = (instId) => {
    const list = instReviews.filter(r => r.instId === instId);
    if (list.length === 0) return { overall: 0, total: 0, metricsAvg: {} };
    
    const criteriaKeys = ['Uy tín trường', 'Địa điểm', 'Cơ hội việc làm', 'Cơ sở vật chất', 'Mạng Internet', 'Đồ ăn', 'Câu lạc bộ', 'Đời sống xã hội', 'Độ hài lòng', 'An toàn'];
    let sumTotal = 0;
    const metricsAvg = {};

    criteriaKeys.forEach(key => {
      const mSum = list.reduce((acc, r) => acc + (r.metrics[key] || 0), 0);
      metricsAvg[key] = (mSum / list.length).toFixed(1);
      sumTotal += (mSum / list.length);
    });

    const overall = (sumTotal / criteriaKeys.length).toFixed(1);
    return { overall: parseFloat(overall), total: list.length, metricsAvg };
  };

  const calculateProfStats = (profId) => {
    const list = profReviews.filter(r => r.prof_id === profId);
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

  const handleLogin = async (e) => {
  e.preventDefault();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: authPassword,
  });
  if (error) {
    setFeedbackMsg({ type: 'error', text: error.message });
    return;
  }
  setCurrentUser({ email: data.user.email, name: data.user.email.split('@')[0] });
  setFeedbackMsg({ type: 'success', text: 'Đăng nhập thành công!' });
  setTimeout(() => setCurrentView('home'), 600);
};

  const handleSignup = async (e) => {
  e.preventDefault();
  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: authPassword,
    options: { data: { full_name: authName } }
  });
  if (error) {
    setFeedbackMsg({ type: 'error', text: error.message });
    return;
  }
  setCurrentUser({ email: authEmail, name: authName });
  setFeedbackMsg({ type: 'success', text: 'Tạo tài khoản thành công!' });
  setTimeout(() => setCurrentView('home'), 600);
};

  const renderAuthModal = () => {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl shadow-lg border border-gray-200 animate-fadeIn space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-900">
            {authView === 'login' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
          </h2>
          <p className="text-sm text-gray-500">
            {authView === 'login' ? 'Truy cập tài khoản để đánh giá và tương tác' : 'Tham gia cộng đồng đánh giá giảng viên đại học'}
          </p>
        </div>

        {feedbackMsg.text && (
          <div className={`p-4 rounded-xl text-sm font-medium ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {feedbackMsg.text}
          </div>
        )}

        <form onSubmit={authView === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {authView === 'signup' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Họ và tên</label>
              <input 
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email sinh viên / trường</label>
            <input 
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="example@university.edu.vn"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
            <input 
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-md text-base transition-all">
            {authView === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
          </button>
        </form>

        <div className="text-center pt-2">
          {authView === 'login' ? (
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <button onClick={() => { setAuthView('signup'); setFeedbackMsg({type:'', text:''}); }} className="font-bold text-blue-600 hover:underline">
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <button onClick={() => { setAuthView('login'); setFeedbackMsg({type:'', text:''}); }} className="font-bold text-blue-600 hover:underline">
                Đăng nhập
              </button>
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderHome = () => {
    const filteredInstitutions = institutions.filter(inst => 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 md:p-12 rounded-3xl shadow-xl text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Tìm kiếm Trường học hoặc Giảng viên</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base">
            Đánh giá và chia sẻ trải nghiệm học tập chân thực tại các trường Đại học & Cao đẳng tại Việt Nam.
          </p>
          <div className="max-w-xl mx-auto relative pt-2">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên trường, viết tắt (VD: HCMUT, NEU)..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 shadow-lg outline-none font-medium text-lg placeholder-gray-400 focus:ring-4 focus:ring-blue-300 transition-all"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-gray-900">Các trường Đại học</h2>
            <button 
              onClick={() => {
                if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                setSuggestionType('institution');
                setSuggestionTargetName('');
                setSuggestionContent('');
                setCurrentView('suggest');
              }}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-all"
            >
              + Đề xuất thêm trường
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredInstitutions.map(inst => {
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
                        {inst.shortName}
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
        </div>
      </div>
    );
  };

  const renderInstitution = () => {
    if (!selectedInst) return null;
    const stats = calculateInstStats(selectedInst.id);
    const reviews = instReviews.filter(r => r.instId === selectedInst.id);

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <button onClick={() => setCurrentView('home')} className="hover:text-blue-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Trang chủ
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-900">{selectedInst.name}</span>
        </div>

        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-block bg-blue-600 text-blue-100 font-bold px-3 py-1 rounded-xl text-xs mb-2">{selectedInst.shortName}</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{selectedInst.name}</h2>
            <p className="text-blue-200 text-sm">{stats.total} Đánh giá tổng quan cơ sở đào tạo • {selectedInst.departments.length} Khoa / Viện</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => {
                if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                setCurrentView('add-inst-review');
              }}
              className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow transition-all text-sm whitespace-nowrap"
            >
              + Viết đánh giá trường
            </button>
            <button 
              onClick={() => {
                if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                setSuggestionType('department');
                setSuggestionTargetName('');
                setSuggestionContent('');
                setCurrentView('suggest');
              }}
              className="px-5 py-3 bg-blue-600 text-white hover:bg-blue-50 font-bold rounded-2xl transition-all text-sm whitespace-nowrap border border-blue-500"
            >
              Đề xuất Khoa
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900">Các Khoa / Viện trực thuộc</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedInst.departments.map((dept, idx) => {
              const deptProfs = professors.filter(p => p.university === selectedInst.name && p.department === dept);
              return (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div onClick={() => { setSelectedDept(dept); setCurrentView('department'); }} className="cursor-pointer">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{dept}</h4>
                    <p className="text-xs text-gray-500">{deptProfs.length} Giảng viên có sẵn</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-blue-600">
                    <button onClick={() => { setSelectedDept(dept); setCurrentView('department'); }} className="hover:underline">Xem danh sách giảng viên →</button>
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
                    <span className="text-sm text-gray-400">{rev.created_at}</span>
                  </div>

                  <p className="text-gray-800 text-base font-medium">{rev.comment}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pt-2">
                    {Object.entries(rev.metrics).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-sm text-gray-700 font-medium">{key}</span>
                        <div className="flex gap-1 w-32">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-2 flex-1 rounded-full ${s <= val ? 'bg-green-300' : 'bg-gray-200'}`} />
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
                      <span>👎 {rev.notHelpful || 0}</span>
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
          <button onClick={() => setCurrentView('home')} className="hover:text-blue-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Trang chủ
          </button>
          <span>/</span>
          <button onClick={() => setCurrentView('institution')} className="hover:text-blue-600">
            {selectedInst.name}
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-900">{selectedDept}</span>
        </div>

        <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-blue-100 font-medium text-sm mb-1">{selectedInst.name}</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{selectedDept}</h2>
            <p className="text-blue-100 text-sm">{deptProfs.length} Giảng viên có sẵn để đánh giá.</p>
          </div>
          <button 
            onClick={() => {
              if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
              setSuggestionType('professor');
              setSuggestionTargetName('');
              setSuggestionContent('');
              setCurrentView('suggest');
            }}
            className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow transition-all text-sm whitespace-nowrap"
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
                  onClick={() => {
                    setSelectedProf(prof);
                    setCurrentView('professor');
                  }}
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
    if (!selectedProf) return null;
    const stats = calculateProfStats(selectedProf.id);
    let reviews = profReviews.filter(r => r.prof_id === selectedProf.id);

    if (profSort === 'highest-quality') reviews.sort((a, b) => b.teaching_rating - a.teaching_rating);
    else if (profSort === 'lowest-quality') reviews.sort((a, b) => a.teaching_rating - b.teaching_rating);
    else if (profSort === 'highest-difficulty') reviews.sort((a, b) => b.difficulty_rating - a.difficulty_rating);
    else reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (profTagFilter !== 'all') {
      reviews = reviews.filter(r => r.tags && r.tags.includes(profTagFilter));
    }

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <button onClick={() => setCurrentView('home')} className="hover:text-blue-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Trang chủ
          </button>
          <span>/</span>
          <button onClick={() => setCurrentView('department')} className="hover:text-blue-600">
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
              {selectedProf.tags.map((t, idx) => (
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
                    <span className="text-xs text-gray-400">{rev.created_at}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">Tính điểm: <strong className="text-gray-900">{rev.forCredit}</strong></span>
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
                    <span>👎 {rev.notHelpful || 0}</span>
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

    const handleSub = async (e) => {
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
      teaching_rating: parseInt(reviewTeaching),
      difficulty_rating: parseInt(reviewDifficulty),
      would_take_again: reviewWouldTakeAgain,
      for_credit: reviewForCredit,
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

    if (data) setProfReviews([data[0], ...profReviews]);
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
                  <button key={opt} type="button" onClick={() => setReviewForCredit(opt)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${reviewForCredit === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{opt}</button>
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
              rows="4"
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

    const handleInstSub = async (e) => {
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

    if (data) setInstReviews([data[0], ...instReviews]);
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
              rows="4"
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

  const renderSuggest = () => {
    const handleSubmitSuggest = async (e) => {
    e.preventDefault();
    if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
    if (!suggestionTargetName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Vui lòng nhập tên đối tượng đề xuất.' });
      return;
    }

    const newSugg = {
      type: suggestionType,
      target_name: suggestionTargetName.trim(),
      content: suggestionContent.trim(),
      user_email: currentUser.email,
      status: 'Chờ xét duyệt'
    };

    const { data, error } = await supabase.from('suggestions').insert([newSugg]).select();

    if (error) {
      setFeedbackMsg({ type: 'error', text: error.message });
      return;
    }

    if (data) setSuggestions([data[0], ...suggestions]);
    setFeedbackMsg({ type: 'success', text: 'Đề xuất đã được gửi thành công và đang chờ xét duyệt!' });
    setSuggestionTargetName('');
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Loại đề xuất</label>
              <select value={suggestionType} onChange={(e) => setSuggestionType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-gray-50 font-medium">
                <option value="professor">Giảng viên mới</option>
                <option value="institution">Trường đại học mới</option>
                <option value="department">Khoa / Viện mới</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tên đối tượng đề xuất *</label>
              <input 
                type="text"
                value={suggestionTargetName}
                onChange={(e) => setSuggestionTargetName(e.target.value)}
                placeholder="VD: PGS. TS Nguyễn Văn B hoặc Trường Đại học X..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Thông tin chi tiết / Lý do bổ sung</label>
              <textarea 
                rows="4"
                value={suggestionContent}
                onChange={(e) => setSuggestionContent(e.target.value)}
                placeholder="Cung cấp thêm thông tin xác thực..."
                className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              ></textarea>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all">
                Gửi đề xuất xét duyệt
              </button>
              <button type="button" onClick={() => setCurrentView('home')} className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all">
                Trang chủ
              </button>
            </div>
          </form>
        </div>

        {suggestions.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Danh sách đề xuất của bạn ({suggestions.length})</h3>
            <div className="space-y-3">
              {suggestions.map(s => (
                <div key={s.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-lg mb-1 uppercase tracking-wider">{s.type}</span>
                    <h4 className="font-bold text-gray-900">{s.targetName}</h4>
                    <p className="text-xs text-gray-500 mt-1">{s.content || 'Không có mô tả thêm'}</p>
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

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 selection:bg-blue-200">
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">RateVietProfs</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (!currentUser) { setCurrentView('auth'); setAuthView('login'); return; }
                setCurrentView('suggest');
              }} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all border border-blue-500 whitespace-nowrap"
            >
              + Đề xuất / Báo chỉnh sửa
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-blue-500">
                <span className="text-xs font-bold bg-blue-800 px-3 py-1.5 rounded-xl hidden sm:inline-block">
                  👤 {currentUser.name}
                </span>
                <button 
                  onClick={() => { setCurrentUser(null); setCurrentView('home'); }}
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
