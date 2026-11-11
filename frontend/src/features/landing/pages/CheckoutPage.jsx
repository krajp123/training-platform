import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgePercent, CheckCircle2, CreditCard, LoaderCircle, LockKeyhole } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import { clearCartData, getCart } from '../../../services/cart.js';
import { postJson } from '../../../services/api.js';

const scriptUrl = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
      if (existing.dataset.razorpayLoaded === 'true') {
        resolve(Boolean(window.Razorpay));
        return;
      }
      if (existing.dataset.razorpayLoaded === 'false') {
        reject(new Error('Payment checkout could not be loaded. Please try again.'));
        return;
      }
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => reject(new Error('Payment checkout could not be loaded. Please try again.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      script.dataset.razorpayLoaded = 'true';
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => {
      script.dataset.razorpayLoaded = 'false';
      reject(new Error('Payment checkout could not be loaded. Please check your connection and try again.'));
    };
    document.body.append(script);
  });
}

function getSavedPayment() {
  try {
    const payment = JSON.parse(sessionStorage.getItem('scs_pending_payment') || 'null');
    return payment
      && typeof payment.razorpay_order_id === 'string'
      && typeof payment.razorpay_payment_id === 'string'
      && typeof payment.razorpay_signature === 'string'
      ? payment
      : null;
  } catch {
    return null;
  }
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(getSavedPayment);
  const courseIds = useMemo(() => cart.map((item) => item.id.match(/^catalog-(\d+)$/)?.[1]).filter(Boolean).map(Number), [cart]);
  const unsupportedCartItems = cart.filter((item) => !/^catalog-\d+$/.test(item.id));
  const subtotal = cart.reduce((total, item) => total + Number(item.price || 0), 0);

  useEffect(() => {
    try {
      setCart(getCart());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  const verifyPayment = async (payment) => {
    if (!localStorage.getItem('scs_session_token')) {
      localStorage.setItem('scs_checkout_redirect', '1');
      window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));
      setError('Sign in again to confirm this payment and activate your course access.');
      return;
    }

    setBusy(true);
    setError('');
    setPendingPayment(payment);
    try {
      sessionStorage.setItem('scs_pending_payment', JSON.stringify(payment));
    } catch (storageError) {
      console.error('Unable to save the pending payment confirmation for recovery.', storageError);
    }

    try {
      const result = await postJson('/api/payments/verify-signature', payment);
      if (result.success !== true) throw new Error('The server did not confirm the payment.');
      try {
        sessionStorage.removeItem('scs_pending_payment');
      } catch (storageError) {
        console.error('Unable to clear the saved payment confirmation.', storageError);
      }
      setPendingPayment(null);
      clearCartData();
      setCart([]);
      setPaid(true);
      setNotice('Payment verified. Your course access is ready.');
    } catch (verificationError) {
      setError(`Payment confirmation is pending. Retry confirmation before starting another payment. ${verificationError.message}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (pendingPayment && localStorage.getItem('scs_session_token')) verifyPayment(pendingPayment);
  }, []);

  const applyCoupon = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!couponCode.trim() || !courseIds.length) return;
    setBusy(true);
    try {
      const result = await postJson('/api/platform/coupons/validate', { code: couponCode, courseIds });
      setCoupon({ code: result.code, discount: result.discount });
      setNotice('Coupon applied. Final discount is calculated again securely at checkout.');
    } catch (requestError) {
      setCoupon(null);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async () => {
    setError('');
    setNotice('');
    if (!localStorage.getItem('scs_session_token')) {
      localStorage.setItem('scs_checkout_redirect', '1');
      window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));
      return;
    }
    if (unsupportedCartItems.length || !courseIds.length) {
      setError('Some cart items are not available in the published course catalog. Remove them and try again.');
      return;
    }
    setBusy(true);
    let orderId = '';
    try {
      const ready = await loadRazorpay();
      if (!ready) throw new Error('Payment checkout is not available in this browser.');
      const result = await postJson('/api/payments/create-order', { courseIds, couponCode: coupon?.code || '' });
      if (result.freeEnrollment) {
        clearCartData();
        setCart([]);
        setPaid(true);
        setNotice(result.message);
        return;
      }
      orderId = result.order.id;
      let user = {};
      try {
        user = JSON.parse(localStorage.getItem('scs_user') || '{}');
      } catch (parseError) {
        console.error('Unable to read the signed-in user for Razorpay prefill.', parseError);
      }
      const checkout = new window.Razorpay({
        key: result.keyId,
        amount: result.order.amount,
        currency: result.order.currency,
        name: 'SCS Academy',
        description: result.summary.courseTitles.join(', '),
        order_id: result.order.id,
        prefill: { name: user.name || '', email: user.identifier || '' },
        theme: { color: '#7A1F2B' },
        handler: (payment) => { void verifyPayment(payment); },
        modal: {
          ondismiss: () => {
            if (orderId) postJson('/api/payments/failure', { orderId, reason: 'Checkout was closed before payment completed.' })
              .catch((failureError) => console.error('Unable to record the cancelled payment attempt.', failureError));
            setBusy(false);
          },
        },
      });
      checkout.on('payment.failed', (failure) => {
        postJson('/api/payments/failure', { orderId, reason: failure.error?.description || 'Payment was declined.' })
          .catch((failureError) => console.error('Unable to record the failed payment.', failureError));
        setError(failure.error?.description || 'Payment failed. You can try again.');
        setBusy(false);
      });
      checkout.open();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  const displayedTotal = Math.max(0, subtotal - (coupon?.discount || 0));

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#29283a]">
      <Navbar />
      <main className="customer-page-main min-h-[calc(100vh-250px)]">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A1F2B] no-underline" to="/cart"><ArrowLeft size={16} />Back to cart</Link>
        <header className="mt-5"><p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-[#7A1F2B]">Secure checkout</p><h1 className="customer-page-title">Complete your enrollment</h1><p className="customer-page-lead text-slate-600">Payments are processed securely by Razorpay. Prices and coupons are verified by the server.</p></header>
        {(error || notice) && <p className={`mt-5 rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}
        {paid ? (
          <section className="mt-7 rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto text-emerald-600" size={40} /><h2 className="mt-4 font-[Manrope] text-xl font-bold">You’re enrolled</h2><p className="text-sm text-slate-600">Your course access is available in your learning dashboard.</p><button className="mt-3 rounded-lg bg-[#7A1F2B] px-5 py-3 text-sm font-bold text-white" onClick={() => navigate('/dashboard')}>Go to learning</button></section>
        ) : pendingPayment ? (
          <section className="mt-7 rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm"><LoaderCircle className={`mx-auto text-[#7A1F2B] ${busy ? 'animate-spin' : ''}`} size={36} /><h2 className="mt-4 font-[Manrope] text-xl font-bold">Payment confirmation pending</h2><p className="text-sm text-slate-600">We’ll verify the payment before you try to pay again.</p><button className="mt-4 rounded-lg bg-[#7A1F2B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => verifyPayment(pendingPayment)} disabled={busy}>{busy ? 'Confirming payment…' : 'Retry payment confirmation'}</button></section>
        ) : !cart.length ? (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-8 text-center"><h2 className="font-[Manrope] text-xl font-bold">Your cart is empty</h2><Link className="mt-3 inline-block font-semibold text-[#7A1F2B]" to="/courses">Browse courses</Link></section>
        ) : (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="m-0 text-lg font-bold">Order summary <span className="text-sm font-normal text-slate-500">({cart.length} {cart.length === 1 ? 'course' : 'courses'})</span></h2>
              <div className="mt-4 divide-y divide-slate-100">{cart.map((item) => <article className="flex items-center gap-4 py-4 first:pt-0" key={item.id}>{item.image && <img className="h-16 w-24 rounded-md object-cover" src={item.image} alt="" />}<div className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong><span className="text-xs text-slate-500">{item.category} · {item.level}</span></div><strong className="text-sm">₹{Number(item.price).toLocaleString('en-IN')}</strong></article>)}</div>
              {unsupportedCartItems.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Some items in the cart are not available for secure online checkout. Remove those items from your cart to continue.</p>}
              <form className="mt-3 flex gap-2" onSubmit={applyCoupon}><label className="sr-only" htmlFor="checkout-coupon">Coupon code</label><input id="checkout-coupon" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} /><button className="rounded-lg border border-slate-200 px-3 text-sm font-semibold" disabled={busy}><BadgePercent size={15} className="mr-1 inline" />Apply</button></form>
            </section>
            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="m-0 text-base font-bold">Payment details</h2>
              <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>{coupon && <div className="flex justify-between text-emerald-700"><span>Coupon ({coupon.code})</span><span>-₹{coupon.discount.toLocaleString('en-IN')}</span></div>}<div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold"><span>Total</span><span>₹{displayedTotal.toLocaleString('en-IN')}</span></div></div>
              <button className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#7A1F2B] px-4 text-sm font-bold text-white hover:bg-[#641a25] disabled:opacity-50" onClick={pendingPayment ? () => verifyPayment(pendingPayment) : startCheckout} disabled={busy || unsupportedCartItems.length > 0 || !courseIds.length}>
                {busy ? <LoaderCircle className="animate-spin" size={17} /> : pendingPayment ? <LoaderCircle size={17} /> : <CreditCard size={17} />}{busy ? 'Confirming payment…' : pendingPayment ? 'Retry payment confirmation' : displayedTotal === 0 ? 'Redeem coupon' : 'Pay securely'}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-500"><LockKeyhole size={12} />Encrypted payment · Razorpay</p>
              <p className="mt-4 text-[11px] leading-5 text-slate-500">Refunds are subject to the platform refund policy. Your receipt appears in purchase history once payment is verified.</p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default CheckoutPage;
