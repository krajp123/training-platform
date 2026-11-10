import React, { useState } from 'react';
import { AlertCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../services/api.js';

function AdminLoginPage({ message, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await apiRequest('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      onLogin(result.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4 py-6 font-sans text-[#292a32] antialiased sm:px-8 sm:py-10">
      <section className="grid w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-2xl border border-[#e8ebef] bg-white shadow-[0_24px_70px_rgba(30,41,59,.12)] md:min-h-[min(620px,calc(100vh-64px))] md:grid-cols-2" aria-label="Admin sign in">
        <div className="flex flex-col items-center justify-center border-b border-[#e8ebef] bg-white px-7 py-8 sm:px-12 md:border-b-0 md:border-r md:px-10">
          <img className="h-[90px] w-[190px] object-contain" src="/academy-logo-cropped.png" alt="SCS Academy" />
          <div className="my-2 flex w-full items-center justify-center">
            <div className="relative aspect-square w-full max-w-[260px] bg-white before:absolute before:inset-y-0 before:right-0 before:z-10 before:w-1 before:bg-white after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-1 after:bg-white sm:max-w-[320px] md:max-w-[380px]">
              <video
                aria-label="Secure sign-in animation"
                autoPlay
                className="h-full w-full object-contain"
                muted
                playsInline
              >
                <source src="/secure-login.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
          <p className="max-w-[300px] text-center text-sm leading-6 text-[#748092]">A secure place to manage learning and grow together.</p>
        </div>

        <div className="flex items-center justify-center px-7 py-10 sm:px-12 md:px-14 lg:px-[76px]">
          <div className="w-full max-w-[380px]">
            <header className="mb-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[1.7px] text-[#748092]">Administrator access</p>
              <h1 className="font-[Manrope,sans-serif] text-[30px] font-semibold tracking-[-1px] text-[#202b3b] sm:text-[34px]" id="admin-login-title">Welcome back</h1>
              <p className="mt-2 text-sm leading-6 text-[#77808e]">Sign in to continue to your admin dashboard.</p>
            </header>

            {(error || message) && (
              <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-[#f1d8d5] bg-[#fff7f6] px-3.5 py-3 text-[13px] text-[#a85248]" role="alert">
                <AlertCircle className="shrink-0" size={17} />
                <span>{error || message}</span>
              </div>
            )}

            <form className="grid gap-4" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#344054]" htmlFor="admin-email">Email address</label>
                <div className="flex h-[50px] items-center gap-3 rounded-lg border border-[#dce1e8] bg-white px-3.5 text-[#8993a2] transition focus-within:border-[#3975c6] focus-within:ring-[3px] focus-within:ring-[#3975c6]/10">
                  <Mail className="shrink-0" size={17} aria-hidden="true" />
                  <input
                    autoComplete="username"
                    className="h-full w-full min-w-0 border-0 bg-transparent text-sm text-[#293548] outline-none placeholder:text-[#a0a9b5]"
                    id="admin-email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#344054]" htmlFor="admin-password">Password</label>
                <div className="flex h-[50px] items-center gap-3 rounded-lg border border-[#dce1e8] bg-white px-3.5 text-[#8993a2] transition focus-within:border-[#3975c6] focus-within:ring-[3px] focus-within:ring-[#3975c6]/10">
                  <LockKeyhole className="shrink-0" size={17} aria-hidden="true" />
                  <input
                    autoComplete="current-password"
                    className="h-full w-full min-w-0 border-0 bg-transparent text-sm text-[#293548] outline-none placeholder:text-[#a0a9b5]"
                    id="admin-password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>
              <button className="mt-1 flex h-[50px] items-center justify-center rounded-lg border-0 bg-[#762f3b] font-sans text-sm font-semibold text-white shadow-[0_5px_12px_rgba(118,47,59,.2)] transition hover:bg-[#632630] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#b99a55]/50 disabled:cursor-wait disabled:opacity-70" disabled={submitting} type="submit">
                  {submitting ? 'Logging in…' : 'Login'}
                </button>
            </form>
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-[#edf0f3] pt-5 text-xs text-[#77808e]">
              <ShieldCheck className="text-[#a18443]" size={15} />
              <span>Secure access for authorized administrators</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminLoginPage;