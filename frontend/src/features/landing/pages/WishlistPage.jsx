import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, Heart, ShoppingCart, Star, Trash2 } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import { addToCart } from '../../../services/cart.js';
import { getWishlist, removeFromWishlist, subscribeToWishlist } from '../../../services/wishlist.js';

function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWishlist = () => {
      try {
        setWishlist(getWishlist());
        setError('');
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadWishlist();
    return subscribeToWishlist(setWishlist);
  }, []);

  const moveToCart = (course) => {
    try {
      addToCart(course);
      setWishlist(removeFromWishlist(course.id));
      setError('');
    } catch (moveError) {
      setError(moveError.message);
    }
  };

  const removeCourse = (courseId) => {
    try {
      setWishlist(removeFromWishlist(courseId));
      setError('');
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#29283a]">
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-250px)] max-w-[1180px] px-5 pb-12 pt-6 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e7e5ed] pb-5">
          <div>
            <h1 className="m-0 font-[Manrope] text-[clamp(1.9rem,3vw,2.4rem)] font-bold leading-tight tracking-[-.04em]">My wishlist</h1>
          </div>
          {wishlist.length > 0 && <span className="text-sm font-semibold text-[#686674]">{wishlist.length} {wishlist.length === 1 ? 'course' : 'courses'} saved</span>}
        </div>

        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

        {wishlist.length ? (
          <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Wishlisted courses">
            {wishlist.map((course) => (
              <article key={course.id} className="flex flex-col overflow-hidden rounded-xl border border-[#e1e4eb] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#c9c1ee] hover:shadow-[0_8px_20px_rgba(27,39,58,0.08)]">
                <div className="relative h-[170px] overflow-hidden bg-[#f2f0ec]">
                  {course.image
                    ? <img className="h-full w-full object-cover" src={course.image} alt="" loading="lazy" />
                    : <div className="grid h-full place-items-center text-[#7A1F2B]"><Heart size={32} /></div>}
                  {course.category && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7A1F2B]">{course.category}</span>}
                  <button type="button" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/95 text-[#7A1F2B] shadow-sm transition hover:scale-105" onClick={() => removeCourse(course.id)} aria-label={`Remove ${course.title} from wishlist`}>
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-3">
                    {course.level && <span className="rounded-full bg-[#f1effb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6048b7]">{course.level}</span>}
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#687789]"><Star size={12} className="fill-amber-400 text-amber-500" /> {course.rating || '4.8'}</span>
                  </div>
                  <h2 className="mb-0 mt-3 font-[Manrope] text-base font-bold leading-snug text-[#112e49]">{course.title}</h2>
                  <p className="mb-0 mt-1.5 text-xs text-[#687789]">By {course.instructor || 'SCS Academy'}</p>
                  {course.description && <p className="mb-0 mt-2 line-clamp-2 text-xs leading-5 text-[#687789]">{course.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-4 border-t border-[#edf0f4] pt-3 text-[11px] font-semibold text-[#687789]">
                    {course.duration && <span className="flex items-center gap-1"><Clock3 size={13} /> {course.duration}</span>}
                    {course.hours && <span className="flex items-center gap-1"><BookOpen size={13} /> {course.hours}</span>}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <strong className="text-base text-[#122b45]">₹{Number(course.price || 0).toLocaleString('en-IN')}</strong>
                    <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#7A1F2B] px-3 text-xs font-bold text-white transition hover:bg-[#641a25]" onClick={() => moveToCart(course)}>
                      Move to cart <ShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="grid min-h-72 place-items-center px-5 py-12 text-center">
            <div>
              <Heart className="mx-auto text-[#7A1F2B]" size={34} />
              <h2 className="mb-0 mt-4 font-[Manrope] text-xl font-bold">Your wishlist is empty</h2>
              <p className="mb-5 mt-2 text-sm text-[#686674]">Save courses you’re interested in and find them here later.</p>
              <Link to="/courses" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#7A1F2B] px-5 text-sm font-bold text-white no-underline hover:bg-[#641a25]">Explore courses <ArrowRight size={15} /></Link>
            </div>
          </section>
        )}
      </main>
      <div className="mx-auto max-w-[1320px] border-t border-[#e7e5ed] px-5 sm:px-8 lg:px-10" aria-hidden="true" />
      <Footer showAccent={false} />
    </div>
  );
}

export default WishlistPage;
