import React, { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import HomePage from '../features/landing/pages/HomePage.jsx';
import CoursesPage from '../features/landing/pages/CoursesPage.jsx';
import PrivacyPolicyPage from '../features/landing/pages/PrivacyPolicyPage.jsx';
import TermsAndConditionsPage from '../features/landing/pages/TermsAndConditionsPage.jsx';
import DashboardPage from '../features/learner/pages/DashboardPage.jsx';
import BimPage from '../features/landing/pages/BimPage.jsx';
import AuthModal from '../features/landing/components/AuthModal.jsx';

function PlaceholderPage({ title, notFound = false }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#10101b] px-6 py-16 text-center text-white">
      <section className="max-w-lg" aria-labelledby="placeholder-title">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b9a6ff]">SCS Academy</p>
        <h1 id="placeholder-title" className="mt-4 font-[Manrope] text-4xl font-bold">{title}</h1>
        <p className="mt-4 text-[#c8c3d6]">
          {notFound ? "We couldn't find the page you're looking for." : 'This page is coming soon.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link className="rounded-lg bg-white px-5 py-3 font-semibold text-[#24232d]" to="/">Go home</Link>
          <Link className="rounded-lg border border-white/25 px-5 py-3 font-semibold text-white" to="/dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

function AuthEntryPage({ mode }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scs-auth', { detail: mode }));
  }, [mode]);

  return <main className="min-h-screen bg-[#10101b]" aria-label="Authentication" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthModal />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/bim" element={<BimPage />} />
        <Route path="/courses/:slug" element={<PlaceholderPage title="Course details" />} />
        <Route path="/learn/:courseSlug" element={<PlaceholderPage title="Course learning" />} />
        <Route path="/login" element={<AuthEntryPage mode="login" />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/refund-policy" element={<PlaceholderPage title="Refund policy" />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" notFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
