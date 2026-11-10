import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, LoaderCircle, ReceiptText } from 'lucide-react';
import Navbar from '../../landing/components/Navbar.jsx';
import Footer from '../../landing/components/Footer.jsx';
import { getJson } from '../../../services/api.js';

function PurchaseHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(() => {
    setLoading(true);
    getJson('/api/payments/my-orders')
      .then((result) => {
        setOrders(result.orders);
        setError('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (localStorage.getItem('scs_session_token')) loadOrders();
    else {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));
    }
    window.addEventListener('scs-auth-state', loadOrders);
    return () => window.removeEventListener('scs-auth-state', loadOrders);
  }, [loadOrders]);

  const viewReceipt = async (id) => {
    setError('');
    try {
      const result = await getJson(`/api/payments/my-orders/${encodeURIComponent(id)}/receipt`);
      setReceipt(result.receipt);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] font-['DM_Sans',_sans-serif] text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-[#7A1F2B]">Account</p>
        <h1 className="m-0 font-[Manrope] text-3xl font-bold">Purchase history</h1>
        <p className="mt-2 text-sm text-slate-600">View payment status and print receipts for completed purchases.</p>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {loading ? <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />Loading purchases…</p> : orders.length ? (
          <div className="mt-6 space-y-3">{orders.map((order) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={order.razorpayOrderId}><div className="min-w-0"><p className="m-0 text-[11px] text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''} · {order.razorpayOrderId}</p><h2 className="mb-1 mt-1 text-sm font-bold">{order.courseTitles?.join(', ') || 'Course purchase'}</h2><p className="m-0 text-xs capitalize text-slate-600">Status: {String(order.status).replaceAll('_', ' ')}{order.refundedAmount ? ` · Refunded ₹${Number(order.refundedAmount).toLocaleString('en-IN')}` : ''}</p></div><div className="flex items-center gap-3"><strong className="text-sm">₹{Number(order.amount).toLocaleString('en-IN')}</strong>{['paid', 'partially_refunded', 'refunded'].includes(order.status) && <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" onClick={() => viewReceipt(order.razorpayOrderId)}><ReceiptText size={14} />Receipt</button>}</div></article>)}</div>
        ) : <section className="mt-6 rounded-xl border border-slate-200 bg-white p-7 text-center"><FileText className="mx-auto text-slate-400" size={28} /><h2 className="mt-3 text-lg font-bold">No purchases yet</h2><Link className="mt-2 inline-block text-sm font-semibold text-[#7A1F2B]" to="/courses">Explore courses</Link></section>}
        {receipt && <section className="receipt-print mt-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="m-0 text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">{receipt.issuer} · Payment receipt</p><h2 className="mb-1 mt-2 text-xl font-bold">{receipt.status === 'refunded' ? 'Refunded purchase' : 'Payment received'}</h2><p className="m-0 text-sm text-slate-600">{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : ''}</p></div><button className="print:hidden rounded-lg bg-[#7A1F2B] px-4 py-2 text-sm font-bold text-white" onClick={() => window.print()}>Print / Save PDF</button></div>
          <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Receipt</dt><dd className="m-0 break-all font-semibold">{receipt.receipt || receipt.razorpayOrderId}</dd></div><div><dt className="text-slate-500">Payment ID</dt><dd className="m-0 break-all font-semibold">{receipt.razorpayPaymentId || 'No gateway payment ID'}</dd></div><div><dt className="text-slate-500">Courses</dt><dd className="m-0 font-semibold">{receipt.courseTitles?.join(', ')}</dd></div><div><dt className="text-slate-500">Paid</dt><dd className="m-0 font-semibold">₹{Number(receipt.amount).toLocaleString('en-IN')} {receipt.currency}</dd></div>{receipt.discount > 0 && <div><dt className="text-slate-500">Discount</dt><dd className="m-0 font-semibold">₹{Number(receipt.discount).toLocaleString('en-IN')} ({receipt.couponCode})</dd></div>}</dl>
        </section>}
      </main>
      <Footer />
    </div>
  );
}

export default PurchaseHistoryPage;
