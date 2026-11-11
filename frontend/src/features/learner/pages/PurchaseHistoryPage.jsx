import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, LoaderCircle, ReceiptText, ShoppingCart } from 'lucide-react';
import Navbar from '../../landing/components/Navbar.jsx';
import Footer from '../../landing/components/Footer.jsx';
import { getJson } from '../../../services/api.js';

function PurchaseHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const pageCount = Math.ceil(orders.length / pageSize);
  const visibleOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadOrders = useCallback(() => {
    setLoading(true);
    getJson('/api/payments/my-orders')
      .then((result) => {
        setOrders(result.orders);
        setCurrentPage(1);
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
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-slate-900">
      <Navbar />
      <main className="customer-page-main">
        <h1 className="customer-page-title">Purchase History</h1>
        {error && <p className="mt-4 text-sm text-red-800" role="alert">{error}</p>}
        {loading ? <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />Loading purchases…</p> : orders.length ? (
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(280px,2.4fr)_minmax(100px,.8fr)_minmax(110px,.8fr)_minmax(120px,1fr)_200px] items-center gap-4 border-b border-slate-200 px-2 py-3 text-sm font-semibold text-black">
                <span aria-hidden="true" />
                <span>Date</span>
                <span>Total price</span>
                <span>Payment type</span>
                <span aria-label="Purchase documents" />
              </div>
              {visibleOrders.map((order) => {
                const hasReceipt = ['paid', 'partially_refunded', 'refunded'].includes(order.status);
                return (
                  <article className="grid grid-cols-[minmax(280px,2.4fr)_minmax(100px,.8fr)_minmax(110px,.8fr)_minmax(120px,1fr)_200px] items-center gap-4 border-b border-slate-200 px-2 py-4 text-sm" key={order.razorpayOrderId}>
                    <div className="flex min-w-0 items-center gap-4">
                      <ShoppingCart className="shrink-0 text-black" size={18} aria-hidden="true" />
                      <div className="min-w-0">
                        <h2 className="m-0 truncate text-sm font-medium text-black" title={order.courseTitles?.join(', ') || 'Course purchase'}>{order.courseTitles?.join(', ') || 'Course purchase'}</h2>
                        <p className="m-0 mt-1 text-sm capitalize text-black">Status: {String(order.status).replaceAll('_', ' ')}{order.refundedAmount ? ` · Refunded ₹${Number(order.refundedAmount).toLocaleString('en-IN')}` : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm text-black">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                    <strong className="text-sm font-medium text-black">₹{Number(order.amount).toLocaleString('en-IN')}</strong>
                    <span className="text-sm text-black">{order.paymentMethod || order.method || '—'}</span>
                    <div className="flex items-center justify-end gap-3">
                      {hasReceipt && (
                        <>
                          <button type="button" disabled className="min-w-[86px] cursor-not-allowed rounded-md border border-[#7A1F2B] bg-transparent px-3 py-1.5 text-sm font-semibold text-[#7A1F2B]"><ReceiptText className="mr-1 inline" size={13} />Receipt</button>
                          <button type="button" disabled className="min-w-[86px] cursor-not-allowed rounded-md border border-[#7A1F2B] bg-transparent px-3 py-1.5 text-sm font-semibold text-[#7A1F2B]">Invoice</button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : <section className="mt-6 py-7 text-center"><FileText className="mx-auto text-slate-400" size={28} /><h2 className="mt-3 text-lg font-bold">No purchases yet</h2><Link className="mt-2 inline-block text-sm font-semibold text-[#7A1F2B]" to="/courses">Explore courses</Link></section>}
        {!loading && pageCount > 1 && (
          <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Purchase history pagination">
            <p className="m-0 text-[#686674]">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, orders.length)} of {orders.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#dfe3ea] px-3 font-semibold text-[#29283a] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="px-1 text-[#29283a]" aria-live="polite">Page {currentPage} of {pageCount}</span>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#dfe3ea] px-3 font-semibold text-[#29283a] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={currentPage === pageCount}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </nav>
        )}
        {receipt && <section className="receipt-print mt-7 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="m-0 text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">{receipt.issuer} · Payment receipt</p><h2 className="mb-1 mt-2 text-xl font-bold">{receipt.status === 'refunded' ? 'Refunded purchase' : 'Payment received'}</h2><p className="m-0 text-sm text-slate-600">{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : ''}</p></div><button className="print:hidden rounded-lg bg-[#7A1F2B] px-4 py-2 text-sm font-bold text-white" onClick={() => window.print()}>Print / Save PDF</button></div>
          <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Receipt</dt><dd className="m-0 break-all font-semibold">{receipt.receipt || receipt.razorpayOrderId}</dd></div><div><dt className="text-slate-500">Payment ID</dt><dd className="m-0 break-all font-semibold">{receipt.razorpayPaymentId || 'No gateway payment ID'}</dd></div><div><dt className="text-slate-500">Courses</dt><dd className="m-0 font-semibold">{receipt.courseTitles?.join(', ')}</dd></div><div><dt className="text-slate-500">Paid</dt><dd className="m-0 font-semibold">₹{Number(receipt.amount).toLocaleString('en-IN')} {receipt.currency}</dd></div>{receipt.discount > 0 && <div><dt className="text-slate-500">Discount</dt><dd className="m-0 font-semibold">₹{Number(receipt.discount).toLocaleString('en-IN')} ({receipt.couponCode})</dd></div>}</dl>
        </section>}
      </main>
      <Footer />
    </div>
  );
}

export default PurchaseHistoryPage;
