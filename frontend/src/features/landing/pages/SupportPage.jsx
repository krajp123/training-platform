import React, { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle, Send } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getJson, postJson } from '../../../services/api.js';

const projectFaqs = [
  {
    title: 'How do I sign in to SCS Academy?',
    body: 'Use the email address or phone number associated with your account and follow the sign-in code prompt. If password sign-in is enabled for your account, you can also use your password.',
  },
  {
    title: 'Where can I find my courses after enrolling?',
    body: 'Open My Learning from your account menu to see courses associated with your account. If a completed payment does not appear there, contact support with the email used at checkout and your order ID.',
  },
  {
    title: 'How do I access a course lesson?',
    body: 'Open My Learning and select the course you want to continue. Course lessons are available from the course learning page.',
  },
  {
    title: 'Where can I check an order or payment status?',
    body: 'Open Purchase History from your account menu to review your orders and their current status. Include the order ID when contacting support about a payment.',
  },
  {
    title: 'What should I do if payment is pending or checkout fails?',
    body: 'Wait for the payment status to update before trying again. If the order remains pending or you are unsure whether you were charged, send us the order ID and the email used at checkout. Do not send card details or one-time passwords.',
  },
  {
    title: 'How do I update my profile or password?',
    body: 'Open Account Setting from your account menu. From there you can manage your profile details and sign-in security options.',
  },
  {
    title: 'How do I update my phone number or two-factor authentication?',
    body: 'Go to Account Setting and choose Phone number or Two-factor auth. Follow the prompts to verify your phone number before enabling phone-based sign-in protection.',
  },
  {
    title: 'How do I save a course for later?',
    body: 'Use the wishlist control on a course and open Wishlist from your account menu to see saved courses.',
  },
  {
    title: 'How do I change email marketing preferences?',
    body: 'Open Account Setting, select Email updates, and change your preference. Required account and purchase service messages are not affected.',
  },
  {
    title: 'How can I ask about a refund or course access issue?',
    body: 'Use the contact form on this page. Include the account email and relevant order or course details so the support team can investigate.',
  },
];

function SupportPage() {
  const [content, setContent] = useState({ announcements: [], faqs: [] });
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', body: '' });
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
      await postJson('/api/support/contact', form);
      setForm({ name: '', email: '', body: '' });
      setNotice('Your message has been sent to our support team. We will follow up by email.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-slate-900">
      <Navbar />
      <main className="customer-page-main">
        <h1 className="customer-page-title">Help & support</h1>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{notice}</p>}
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {content.announcements.map((item) => <article className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm" key={item.id}><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-violet-700">Announcement</p><h2 className="mb-1 mt-1 text-base font-bold">{item.title}</h2><p className="m-0 text-sm leading-6 text-slate-600">{item.body}</p></article>)}
            <section>
              <h2 className="customer-page-section-title flex items-center gap-2"><HelpCircle size={21} className="text-[#7A1F2B]" />Frequently asked questions</h2>
              <div className="mt-4 divide-y divide-slate-200">
                {[...projectFaqs, ...content.faqs].map((item, index) => (
                  <div className="py-3.5" key={item.id || `project-faq-${index}`}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 text-left text-base font-semibold leading-6 text-slate-900"
                      aria-expanded={openFaq === index}
                      aria-controls={`support-faq-answer-${index}`}
                      onClick={() => setOpenFaq((current) => current === index ? null : index)}
                    >
                      {item.title}
                      <ChevronDown className={`shrink-0 text-[#7A1F2B] transition-transform duration-300 ease-in-out motion-reduce:transition-none ${openFaq === index ? 'rotate-180' : ''}`} size={19} aria-hidden="true" />
                    </button>
                    <div
                      id={`support-faq-answer-${index}`}
                      className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${openFaq === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                      aria-hidden={openFaq !== index}
                    >
                      <div className="overflow-hidden">
                        <p className={`mb-0 whitespace-pre-wrap pt-2 text-base leading-7 text-slate-700 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${openFaq === index ? 'opacity-100' : 'opacity-0'}`}>{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
          <form className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
            <label className="block text-sm font-semibold text-slate-700">Name<input autoComplete="name" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-base font-normal text-slate-900 outline-none focus:border-[#7A1F2B]" required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="block text-sm font-semibold text-slate-700">Email<input autoComplete="email" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-base font-normal text-slate-900 outline-none focus:border-[#7A1F2B]" required type="email" maxLength="254" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="block text-sm font-semibold text-slate-700">How can we help?<textarea className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-base font-normal text-slate-900 outline-none focus:border-[#7A1F2B]" required rows="6" maxLength="10000" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#7A1F2B] px-5 text-base font-bold text-white disabled:opacity-50" disabled={busy}><Send size={17} />{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SupportPage;
