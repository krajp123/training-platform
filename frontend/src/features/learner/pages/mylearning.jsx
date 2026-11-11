import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, LoaderCircle, Play, Star } from 'lucide-react';
import Navbar from '../../landing/components/Navbar.jsx';
import Footer from '../../landing/components/Footer.jsx';
import { getJson } from '../../../services/api.js';

function MyLearning() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('scs_session_token')));
  const [error, setError] = useState('');
  const [signedIn, setSignedIn] = useState(Boolean(localStorage.getItem('scs_session_token')));

  const loadCourses = useCallback(async () => {
    if (!localStorage.getItem('scs_session_token')) {
      setSignedIn(false);
      setCourses([]);
      setLoading(false);
      return;
    }

    setSignedIn(true);
    setLoading(true);
    setError('');
    try {
      const result = await getJson('/api/enrollments/my');
      if (!Array.isArray(result.courses)) {
        throw new Error('Your learning courses could not be loaded due to an invalid server response.');
      }
      setCourses(result.courses);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    const updateAuth = (event) => {
      if (event.detail) loadCourses();
      else {
        setSignedIn(false);
        setCourses([]);
        setError('');
        setLoading(false);
      }
    };
    window.addEventListener('scs-auth-state', updateAuth);
    return () => window.removeEventListener('scs-auth-state', updateAuth);
  }, [loadCourses]);

  const requestSignIn = () => window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-slate-900">
      <Navbar />
      <main className="customer-page-main min-h-[calc(100vh-250px)]">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="customer-page-title">My Learning</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-lg bg-[#7A1F2B] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#641a25]" to="/courses">
              Explore courses <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

        {loading ? (
          <p className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-sm text-slate-600" role="status">
            <LoaderCircle className="animate-spin" size={18} /> Loading your courses…
          </p>
        ) : !signedIn ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <BookOpen className="mx-auto text-[#7A1F2B]" size={34} />
            <h2 className="mt-4 font-[Manrope] text-xl font-bold">Sign in to see your courses</h2>
            <p className="mt-2 text-sm text-slate-600">Your purchased courses and progress are available after you sign in.</p>
            <button className="mt-5 rounded-lg bg-[#7A1F2B] px-5 py-2.5 text-sm font-bold text-white" onClick={requestSignIn}>Sign in</button>
          </section>
        ) : courses.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <BookOpen className="mx-auto text-slate-400" size={34} />
            <h2 className="mt-4 font-[Manrope] text-xl font-bold">No courses yet</h2>
            <p className="mt-2 text-sm text-slate-600">Once you enroll in a course, it will appear here.</p>
            <Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#7A1F2B] px-5 py-2.5 text-sm font-bold text-white no-underline" to="/courses">
              Browse courses <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <section className="mt-8" aria-labelledby="enrolled-courses-title">
            <div className="grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const progress = Math.min(100, Math.max(0, Number(course.progress) || 0));
                return (
                  <article className="group overflow-hidden bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg" key={course.id}>
                    <div className="p-4 pb-0">
                      <Link className="relative block overflow-hidden no-underline" to={`/learn/catalog-${course.id}`} aria-label={`Continue learning ${course.title}`}>
                        {course.image && <img className="h-[190px] w-full border border-slate-300 object-cover transition-transform duration-300 group-hover:scale-[1.03]" src={course.image} alt="" loading="lazy" />}
                        <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors duration-200 group-hover:bg-black/25 group-focus-visible:bg-black/25" aria-hidden="true">
                          <span className="grid size-14 scale-90 place-items-center rounded-full bg-white/95 text-[#6048b7] opacity-0 shadow-lg transition duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
                            <Play size={24} fill="currentColor" />
                          </span>
                        </span>
                      </Link>
                      <Link className="mt-3 block no-underline" to={`/learn/catalog-${course.id}`}>
                        <h3 className="m-0 line-clamp-2 font-[Manrope] text-base font-bold leading-[1.3] text-slate-900">{course.title}</h3>
                      </Link>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="mt-1 mb-0 truncate text-xs text-slate-500">{course.instructor || 'SCS Academy'}</p>
                      <div className="mt-4 h-2 overflow-hidden bg-[#dedee5]" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                        <div className="h-full bg-[#6048b7]" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-2 text-xs leading-4">
                        <span className="font-medium text-slate-600">{progress}% complete</span>
                        <Link className="flex flex-col items-end gap-1 font-medium text-slate-700 no-underline hover:text-[#6048b7]" to={`/learn/catalog-${course.id}`} aria-label={`Leave a rating for ${course.title}`}>
                          <span className="flex text-amber-600" aria-hidden="true">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} />)}</span>
                          <span>Leave a rating</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default MyLearning;
