import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Type definitions
interface Professor {
  id: number;
  name: string;
  department: string;
  university: string;
}

interface Review {
  id: number;
  professor_id: number;
  author_name: string;
  content: string;
  rating: number;
  created_at: string;
}

function App() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Form state
  const [authorName, setAuthorName] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch professors on mount
  useEffect(() => {
    const fetchProfessors = async () => {
      const { data, error } = await supabase.from('professors').select('*');
      if (error) console.error('Error fetching professors:', error);
      else setProfessors(data || []);
    };
    fetchProfessors();
  }, []);

  // Fetch reviews when a professor is selected
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessor) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    // Fallback to "Anonymous" if the input is entirely blank
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
      .select(); // Ask Supabase to return the newly created record

    setIsSubmitting(false);

    if (error) {
      console.error('Error submitting review:', error);
      setErrorMsg('Failed to submit review. Please try again.');
    } else if (data) {
      // Add the new review to the local state to update the UI instantly
      setReviews([data[0], ...reviews]);
      setAuthorName('');
      setReviewContent('');
      setRating(5);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Rate Viet Professors</h1>
        <p className="text-gray-600">Anonymous reviews for university professors in Vietnam.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar: Professor List */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Professors</h2>
          {professors.length === 0 ? (
            <p className="text-sm text-gray-500">No professors found.</p>
          ) : (
            <ul className="space-y-2">
              {professors.map((prof) => (
                <li key={prof.id}>
                  <button
                    onClick={() => setSelectedProfessor(prof)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedProfessor?.id === prof.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="font-medium">{prof.name}</div>
                    <div className="text-xs opacity-80">{prof.university}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Main Content: Reviews and Form */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow">
          {selectedProfessor ? (
            <>
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedProfessor.name}</h2>
                <p className="text-gray-600">{selectedProfessor.department} at {selectedProfessor.university}</p>
              </div>

              {/* Review Submission Form */}
              <div className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Leave an Anonymous Review</h3>
                {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="Anonymous"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1 to 5)</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !reviewContent.trim()}
                    className="w-full bg-blue-600 text-white font-medium p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-gray-500 italic">No reviews yet. Be the first!</p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map((review) => (
                      <li key={review.id} className="border border-gray-200 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-gray-800">{review.author_name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded">
                            {review.rating} / 5
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a professor from the list to view or write a review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
