import React from 'react';
import AdminLoginPage from '../auth/AdminLoginPage.jsx';
import { getAdminToken } from '../auth/adminSession.js';
import { useAdminSession } from '../auth/useAdminSession.js';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import ScsProfilePage from '../../../frontend/src/features/landing/pages/ScsProfilePage.jsx';

function AdminApp() {
  const {
    authenticated, authMessage, checkingSession, signIn, signOut,
  } = useAdminSession();
  const learnerProfileId = new URLSearchParams(window.location.search).get('learnerProfile');
  const passwordResetToken = new URLSearchParams(window.location.search).get('passwordResetToken');

  if (passwordResetToken) {
    return <AdminLoginPage onLogin={signIn} message={authMessage} />;
  }
  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center bg-white font-sans text-sm font-medium text-[#777681]" aria-live="polite">Checking admin session…</main>;
  }
  if (!authenticated) {
    return <AdminLoginPage onLogin={signIn} message={authMessage} />;
  }
  if (learnerProfileId) {
    return <ScsProfilePage adminLearnerId={learnerProfileId} adminToken={getAdminToken()} logoSrc="/academy-logo-cropped.png" />;
  }
  return <AdminDashboardPage onLogout={signOut} />;
}

export default AdminApp;
