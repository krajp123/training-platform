import React, { useEffect, useState } from 'react';
import { HelpCircle, MessageSquare, Send } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getJson, postJson } from '../../../services/api.js';

function SupportPage() {
  const [content, setContent] = useState({ announcements: [], faqs: [] });
  const [form, setForm] = useState({ subject: '', body: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getJson('/api/platform/content')
      .then(setContent)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (!localStorage.getItem('scs_session_token')) {
        window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));
        return;
      }
      await postJson('/api/support/tickets', form);
      setForm({ subject: '', body: '' });
      setNotice('Your support request has been submitted. Our team will follow up.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] font-['DM_Sans',_sans-serif] text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-[#7A1F2B]">Learner care</p>
        <h1 className="m-0 font-[Manrope] text-3xl font-bold">Help & support</h1>
        <p className="mt-2 text-sm text-slate-600">Find answers or send a private support request to our team.</p>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{notice}</p>}
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {content.announcements.map((item) => <article className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm" key={item.id}><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-violet-700">Announcement</p><h2 className="mb-1 mt-1 text-base font-bold">{item.title}</h2><p className="m-0 text-sm leading-6 text-slate-600">{item.body}</p></article>)}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="m-0 flex items-center gap-2 text-base font-bold"><HelpCircle size={18} className="text-[#7A1F2B]" />Frequently asked questions</h2>
              <div className="mt-3 divide-y divide-slate-100">{content.faqs.map((item) => <details className="py-3" key={item.id}><summary className="cursor-pointer text-sm font-semibold text-slate-800">{item.title}</summary><p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.body}</p></details>)}{!content.faqs.length && <p className="mb-0 py-4 text-sm text-slate-500">FAQs are being updated. Send us a message if you need help.</p>}</div>
            </section>
          </section>
          <form className="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
            <h2 className="m-0 flex items-center gap-2 text-base font-bold"><MessageSquare size={18} className="text-[#7A1F2B]" />Contact support</h2>
            <label className="block text-xs font-semibold text-slate-600">Subject<input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#7A1F2B]" required maxLength="180" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
            <label className="block text-xs font-semibold text-slate-600">How can we help?<textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#7A1F2B]" required rows="6" maxLength="10000" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#7A1F2B] px-4 text-sm font-bold text-white disabled:opacity-50" disabled={busy}><Send size={15} />{busy ? 'Submitting…' : 'Submit request'}</button>
            <p className="m-0 text-[11px] leading-5 text-slate-500">You need to be signed in to create a support request. Do not include passwords or payment-card details.</p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SupportPage;
