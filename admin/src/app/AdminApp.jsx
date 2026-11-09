import React from 'react';
import AdminLoginPage from '../auth/AdminLoginPage.jsx';
import { useAdminSession } from '../auth/useAdminSession.js';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';

function AdminApp() {
  const {
    authenticated, authMessage, checkingSession, signIn, signOut,
  } = useAdminSession();

  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center bg-white font-sans text-sm font-medium text-[#777681]" aria-live="polite">Checking admin session…</main>;
  }
  if (!authenticated) {
    return <AdminLoginPage onLogin={signIn} message={authMessage} />;
  }
  return <AdminDashboardPage onLogout={signOut} />;
}

export default AdminApp;
