import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- Type definitions ---
interface Institution {
  id: number;
  name: string;
  location: string;
}

interface Department {
  id: number;
  institution_id: number;
  name: string;
}

interface Professor {
  id: number;
  department_id: number;
  name: string;
}

interface Review {
  id: number;
  professor_id: number;
  author_name: string;
  content: string;
  rating: number;
  created_at: string;
}

type ViewState = 'institutions' | 'departments' | 'professors' | 'account';

function App() {
  // Navigation & Hierarchy State
  const [currentView, setCurrentView] = useState<ViewState>('institutions');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);

  // Data State
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Review Form State
  const [authorName, setAuthorName] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Institutions on mount
  useEffect(() => {
    const fetchInstitutions = async () => {
      const { data, error } = await supabase.from('institutions').select('*');
      if (error) console.error('Error fetching institutions:', error);
      else setInstitutions(data || []);
    };
    fetchInstitutions();
  }, []);

  // Fetch Departments when an institution is selected
  useEffect(() => {
    if (!selectedInstitution) return;
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('institution_id', selectedInstitution.id);
      if (error) console.error('Error fetching departments:', error);
      else setDepartments(data || []);
    };
    fetchDepartments();
  }, [selectedInstitution]);

  // Fetch Professors when a department is selected
  useEffect(() => {
    if (!selectedDepartment) return;
    const fetchProfessors = async () => {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .eq('department_id', selectedDepartment.id);
      if (error) console.error('Error fetching professors:', error);
      else setProfessors(data || []);
    };
    fetchProfessors();
  }, [selectedDepartment]);

  // Fetch Reviews when a professor is selected
  useEffect(() => {
    if (!selectedProfessor) return;
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('professor_id', selectedProfessor.id)
        .order('created_at', { ascending: false });
      
      if (error) console.error('Error fetching reviews:', error);
      else setReviews(data || []);
    };
    fetchReviews();
  }, [selectedProfessor]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessor) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    const finalName = authorName.trim() === '' ? 'Anonymous' : authorName.trim();

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          professor_id: selectedProfessor.id,
          author_name: finalName,
          content: reviewContent,
          rating: rating,
        }
      ])
      .select();

    setIsSubmitting(false);

    if (error) {
      console.error('Error submitting review:', error);
      setErrorMsg('Failed to submit review. Please try again.');
    } else if (data) {
      setReviews([data[0], ...reviews]);
      setAuthorName('');
      setReviewContent('');
      setRating(5);
    }
  };

  const handleNavigateHome = () => {
    setSelectedInstitution(null);
    setSelectedDepartment(null);
    setSelectedProfessor(null);
    setCurrentView('institutions');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-blue-600 text-white shadow-md py-4 px-8 flex justify-between items-center">
        <div>
          <h1 
            className="text-2xl font-bold cursor-pointer" 
            onClick={handleNavigateHome}
          >
            Rate Viet Professors
          </h1>
        </div>
        <div>
          <button 
            onClick={() => setCurrentView('account')}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md font-medium transition"
          >
            Settings / Account
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
        
        {/* Account / Settings View */}
        {currentView === 'account' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
            <p className="text-gray-600 mb-4">
              Authentication has been disabled. You are browsing and reviewing in anonymous mode.
            </p>
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Display Preferences</h3>
              <p className="text-sm text-gray-500">Theme and layout settings will appear here.</p>
              {/* Additional generic settings can go here */}
            </div>
            <button 
              onClick={handleNavigateHome}
              className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Back to Directory
            </button>
          </div>
        )}

        {/* Directory Navigation Views */}
        {currentView !== 'account' && (
          <>
            {/* Breadcrumbs */}
            <div className="mb-6 text-sm text-gray-500 flex gap-2">
              <button onClick={handleNavigateHome} className="hover:text-blue-600">Home</button>
              {selectedInstitution && (
                <>
                  <span>/</span>
                  <button 
                    onClick={() => {
                      setSelectedDepartment(null);
                      setSelectedProfessor(null);
                      setCurrentView('departments');
                    }}
                    className="hover:text-blue-600"
                  >
                    {selectedInstitution.name}
                  </button>
                </>
              )}
              {selectedDepartment && (
                <>
                  <span>/</span>
                  <button 
                    onClick={() => {
                      setSelectedProfessor(null);
                      setCurrentView('professors');
                    }}
                    className="hover:text-blue-600"
                  >
                    {selectedDepartment.name}
                  </button>
                </>
              )}
              {selectedProfessor && (
                <>
                  <span>/</span>
                  <span className="text-gray-800 font-medium">{selectedProfessor.name}</span>
                </>
              )}
            </div>

            {/* Institutions View */}
            {currentView === 'institutions' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Select an Institution</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {institutions.map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => {
                        setSelectedInstitution(inst);
                        setCurrentView('departments');
                      }}
                      className="p-4 border rounded-lg text-left hover:border-blue-500 hover:shadow-md transition"
                    >
                      <div className="font-bold text-lg">{inst.name}</div>
                      <div className="text-gray-500 text-sm">{inst.location}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Departments View */}
            {currentView === 'departments' && selectedInstitution && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Departments at {selectedInstitution.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setCurrentView('professors');
                      }}
                      className="p-4 border rounded-lg text-left hover:border-blue-500 hover:shadow-md transition"
                    >
                      <div className="font-bold text-lg">{dept.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Professors View */}
            {currentView === 'professors' && selectedDepartment && !selectedProfessor && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Professors in {selectedDepartment.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professors.map(prof => (
                    <button
                      key={prof.id}
                      onClick={() => setSelectedProfessor(prof)}
                      className="p-4 border rounded-lg text-left hover:border-blue-500 hover:shadow-md transition"
                    >
                      <div className="font-bold text-lg">{prof.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Professor & Reviews View */}
            {currentView === 'professors' && selectedProfessor && (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Professor Info & Review Form */}
                <div className="w-full md:w-1/3 space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold">{selectedProfessor.name}</h2>
                    <p className="text-gray-600">{selectedDepartment?.name}</p>
                    <p className="text-gray-500 text-sm mb-4">{selectedInstitution?.name}</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Leave an Anonymous Review</h3>
                    {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="Anonymous"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <select
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                          className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[5, 4, 3, 2, 1].map((num) => (
                            <option key={num} value={num}>{num} Stars</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                        <textarea
                          placeholder="Share your experience..."
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          required
                          rows={4}
                          className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !reviewContent.trim()}
                        className="w-full bg-blue-600 text-white font-medium p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-6">Student Reviews</h3>
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
                  ) : (
                    <ul className="space-y-4">
                      {reviews.map((review) => (
                        <li key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-bold text-gray-800">{review.author_name}</span>
                              <span className="text-sm text-gray-500 ml-3">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded">
                              {review.rating} / 5
                            </div>
                          </div>
                          <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
