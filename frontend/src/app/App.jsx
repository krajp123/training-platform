import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from '../features/landing/pages/HomePage.jsx';
import CoursesPage from '../features/landing/pages/CoursesPage.jsx';
import PrivacyPolicyPage from '../features/landing/pages/PrivacyPolicyPage.jsx';
import TermsAndConditionsPage from '../features/landing/pages/TermsAndConditionsPage.jsx';
import MyLearning from '../features/learner/pages/mylearning.jsx';
import BimPage from '../features/landing/pages/BimPage.jsx';
import AuthModal from '../features/landing/components/AuthModal.jsx';
import ScsProfilePage from '../features/landing/pages/ScsProfilePage.jsx';
import CartPage from '../features/landing/pages/CartPage.jsx';
import CheckoutPage from '../features/landing/pages/CheckoutPage.jsx';
import WishlistPage from '../features/landing/pages/WishlistPage.jsx';
import AccountSettingsPage from '../features/landing/pages/AccountSettingsPage.jsx';
import SupportPage from '../features/landing/pages/SupportPage.jsx';
import CourseLearningPage from '../features/learner/pages/CourseLearningPage.jsx';
import PurchaseHistoryPage from '../features/learner/pages/PurchaseHistoryPage.jsx';
import PaymentMethodPage from '../features/landing/pages/PaymentMethodPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PlaceholderPage({ title, notFound = false }) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-16 text-center text-[#29283a]">
      <section className="max-w-lg" aria-labelledby="placeholder-title">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#7A1F2B]">SCS Academy</p>
        <h1 id="placeholder-title" className="customer-page-title customer-page-title--spaced">{title}</h1>
        <p className="customer-page-lead text-[#686674]">
          {notFound ? "We couldn't find the page you're looking for." : 'This page is coming soon.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link className="rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white" to="/">Go home</Link>
          <Link className="rounded-lg border border-[#dfe3ea] px-5 py-3 font-semibold text-[#29283a]" to="/dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

function AuthEntryPage({ mode }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scs-auth', { detail: mode }));
  }, [mode]);

  return <main className="min-h-screen bg-white" aria-label="Authentication" />;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthModal />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<MyLearning />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ScsProfilePage />} />
        <Route path="/account-settings" element={<AccountSettingsPage />} />
        <Route path="/payment-method" element={<PaymentMethodPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/bim" element={<BimPage />} />
        <Route path="/courses/:slug" element={<PlaceholderPage title="Course details" />} />
        <Route path="/learn/:courseId" element={<CourseLearningPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/orders" element={<PurchaseHistoryPage />} />
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
