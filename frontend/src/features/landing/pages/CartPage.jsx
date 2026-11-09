import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, Crown, ShoppingCart, Star } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import {
  getCart,
  getSavedCourses,
  moveSavedToCart,
  removeFromCart,
  removeSavedCourse,
  subscribeToCart,
} from '../../../services/cart.js';

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCart = () => {
      try {
        setCart(getCart());
        setSavedCourses(getSavedCourses());
        setError('');
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadCart();
    return subscribeToCart(setCart);
  }, []);

  const removeItem = (courseId) => {
    try {
      setCart(removeFromCart(courseId));
      setError('');
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  const restoreItem = (courseId) => {
    try {
      const updated = moveSavedToCart(courseId);
      setCart(updated.cart);
      setSavedCourses(updated.saved);
      setError('');
    } catch (restoreError) {
      setError(restoreError.message);
    }
  };

  const deleteSavedItem = (courseId) => {
    try {
      setSavedCourses(removeSavedCourse(courseId));
      setError('');
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  const total = cart.reduce((sum, course) => sum + course.price, 0);

  const handleCheckout = () => {
    const token = localStorage.getItem('scs_session_token');
    const user = localStorage.getItem('scs_user');

    if (!token || !user) {
      localStorage.setItem('scs_checkout_redirect', '1');
      window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));
      return;
    }

    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#29283a]">
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-250px)] max-w-[1320px] px-5 pb-12 pt-5 sm:px-8 lg:px-10">
        <h1 className="m-0 font-[Manrope] text-[clamp(1.9rem,3vw,2.4rem)] font-bold leading-tight tracking-[-.04em] text-[#29283a]">Shopping Cart</h1>

        {error && <p className="mb-5 mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

        {cart.length ? (
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
            <section aria-label="Courses in your cart">
              <div className="border-b border-[#e7e5ed] pb-2.5 text-base font-semibold text-[#29283a]">
                {cart.length} {cart.length === 1 ? 'Course' : 'Courses'} in Cart
              </div>
              <div>
                {cart.map((course) => (
                  <article key={course.id} className="grid gap-4 py-5 sm:grid-cols-[132px_minmax(0,1fr)] lg:grid-cols-[152px_minmax(0,1fr)_auto] lg:gap-5">
                    {course.image && <img className="h-[88px] w-[132px] rounded-md bg-[#f2f0ec] object-cover sm:w-[152px]" src={course.image} alt="" />}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {course.category && <span className="rounded-full bg-[#f8e9e5] px-2.5 py-1 text-[11px] font-bold text-[#7A1F2B]">{course.category}</span>}
                        {course.level && <span className="rounded-full bg-[#fff3e9] px-2.5 py-1 text-[11px] font-semibold text-[#984a24]">{course.level}</span>}
                      </div>
                      <h2 className="mb-0 mt-2 font-[Manrope] text-base font-bold leading-snug text-[#29283a] sm:text-[17px]">{course.title}</h2>
                      <p className="mb-0 mt-1 text-xs text-[#686674]">By {course.instructor || 'SCS Academy'}</p>
                      {course.description && <p className="mb-0 mt-2 max-w-2xl text-sm leading-5 text-[#686674]">{course.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
                        {course.badge && <span className="rounded bg-[#e7f2ef] px-2 py-1 text-[11px] font-bold text-[#385f53]">{course.badge}</span>}
                        <span className="font-bold text-[#984a24]">{course.rating || '4.8'}</span>
                        <span className="flex items-center gap-0.5 text-[#c6781b]" aria-label={`${course.rating || '4.8'} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill="currentColor" aria-hidden="true" />)}
                        </span>
                        {course.ratingsCount && <span className="text-[#777582]">({course.ratingsCount} ratings)</span>}
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[#686674]">
                        {course.duration && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-[#A52A32]" /> Duration: {course.duration}</span>}
                        {course.hours && <span className="inline-flex items-center gap-1.5"><BookOpen size={14} className="text-[#A52A32]" /> Course hours: {course.hours}</span>}
                      </div>
                      {course.premium && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded bg-[#7A1F2B] px-2.5 py-1 text-xs font-bold text-white">
                          <Crown size={13} /> Premium
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:justify-start">
                      <div className="flex gap-4 text-xs font-semibold text-[#7A1F2B]">
                        <button type="button" className="transition-colors hover:text-[#A52A32] hover:underline" onClick={() => removeItem(course.id)} aria-label={`Remove ${course.title} from cart`}>Remove</button>
                      </div>
                      <strong className="inline-flex items-center gap-1 whitespace-nowrap text-base font-bold text-[#7A1F2B]">
                        ₹{course.price.toLocaleString('en-IN')}.00
                      </strong>
                    </div>
                  </article>
                ))}
              </div>

              {savedCourses.length > 0 && (
                <section className="mt-10" aria-label="Saved courses">
                  <h2 className="mb-0 border-b border-[#e7e5ed] pb-2.5 font-[Manrope] text-lg font-bold text-[#29283a]">Saved for Later ({savedCourses.length})</h2>
                  {savedCourses.map((course) => (
                    <article key={course.id} className="flex flex-wrap items-center gap-4 py-4">
                      {course.image && <img className="h-16 w-24 rounded-sm object-cover" src={course.image} alt="" />}
                      <div className="min-w-[160px] flex-1">
                        <h3 className="m-0 font-[Manrope] text-sm font-bold text-[#29283a]">{course.title}</h3>
                        <strong className="mt-1 block text-sm text-[#7A1F2B]">₹{course.price.toLocaleString('en-IN')}.00</strong>
                      </div>
                      <button type="button" className="text-sm font-semibold text-[#7A1F2B] hover:underline" onClick={() => restoreItem(course.id)}>Move to cart</button>
                      <button type="button" className="text-sm text-[#777582] hover:text-red-700" onClick={() => deleteSavedItem(course.id)} aria-label={`Remove saved ${course.title}`}>Remove</button>
                    </article>
                  ))}
                </section>
              )}
            </section>

            <aside className="lg:sticky lg:top-28">
              <p className="mb-2 text-sm font-medium text-[#686674]">Total</p>
              <p className="mb-0 font-[Manrope] text-3xl font-bold tracking-tight text-[#29283a]">₹{total.toLocaleString('en-IN')}.00</p>
              <button
                type="button"
                onClick={handleCheckout}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#7A1F2B] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#641a25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E97832]"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              <p className="mb-0 mt-3 text-xs text-[#777582]">You won’t be charged yet</p>
            </aside>
          </div>
        ) : (
          <section className="mt-6 grid min-h-64 place-items-center px-5 py-10 text-center">
            <div>
              <ShoppingCart className="mx-auto text-[#7A1F2B]" size={32} />
              <h2 className="mb-0 mt-4 font-[Manrope] text-xl font-bold">Your cart is empty</h2>
              <p className="mb-5 mt-2 text-sm text-[#686674]">Add a course to see it here and continue to checkout.</p>
              <Link to="/courses" className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#7A1F2B] px-5 text-sm font-bold text-white no-underline hover:bg-[#641a25]">Browse courses</Link>
            </div>
            {savedCourses.length > 0 && (
              <section className="w-full max-w-4xl self-start text-left" aria-label="Saved courses">
                <h2 className="mb-0 border-b border-[#d9d7e3] pb-2.5 font-[Manrope] text-xl font-bold text-[#29283a]">Saved for Later ({savedCourses.length})</h2>
                {savedCourses.map((course) => (
                  <article key={course.id} className="flex flex-wrap items-center gap-4 py-4">
                    {course.image && <img className="h-16 w-24 rounded-sm object-cover" src={course.image} alt="" />}
                    <div className="min-w-[160px] flex-1">
                      <h3 className="m-0 font-[Manrope] text-sm font-bold text-[#29283a]">{course.title}</h3>
                      <strong className="mt-1 block text-sm text-[#7A1F2B]">₹{course.price.toLocaleString('en-IN')}.00</strong>
                    </div>
                    <button type="button" className="text-sm font-semibold text-[#7A1F2B] hover:underline" onClick={() => restoreItem(course.id)}>Move to cart</button>
                    <button type="button" className="text-sm text-[#777582] hover:text-red-700" onClick={() => deleteSavedItem(course.id)} aria-label={`Remove saved ${course.title}`}>Remove</button>
                  </article>
                ))}
              </section>
            )}
          </section>
        )}
      </main>
      <div className="mx-auto max-w-[1320px] border-t border-[#e7e5ed] px-5 sm:px-8 lg:px-10" aria-hidden="true" />
      <Footer showAccent={false} />
    </div>
  );
}

export default CartPage;
