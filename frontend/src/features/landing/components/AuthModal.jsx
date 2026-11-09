import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import JoinApplication from './JoinApplication.jsx';
import '../authFlipStyles.css';
import { postJson } from '../../../services/api.js';

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Google">
      <path fill="#4285F4" d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.4Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.4A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4v-5.4H5.9a20 20 0 0 0 0 18.2l6.9-5.4Z" />
      <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.9 14.9l6.9 5.4c1.6-4.7 6-8.2 11.2-8.2Z" />
    </svg>
  );
}

function AuthModal() {
  const [mode, setMode] = useState('');
  const [notice, setNotice] = useState('');
  const [step, setStep] = useState('identifier');
  const [loginMethod, setLoginMethod] = useState('otp');
  const [otpPurpose, setOtpPurpose] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const open = (event) => {
      setMode(event.detail === 'join' ? 'join' : event.detail);
      setStep('identifier');
      setLoginMethod('otp');
      setOtpPurpose(event.detail === 'signup' ? 'signup' : 'login');
      setError('');
      setOtp('');
      setPassword('');
    };
    window.addEventListener('scs-auth', open);
    if (new URLSearchParams(window.location.search).get('join') === '1') setMode('join');
    return () => window.removeEventListener('scs-auth', open);
  }, []);

  const close = () => {
    localStorage.removeItem('scs_checkout_redirect');
    setMode('');
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStep('identifier');
    setLoginMethod('otp');
    setOtpPurpose(nextMode);
    setOtp('');
    setPassword('');
    setError('');
  };

  const requestCode = () => {
    setBusy(true);
    setError('');
    postJson('/api/auth/request-otp', { identifier, name, purpose: mode })
      .then((result) => {
        setStep('otp');
        setNotice(result.message);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setBusy(false));
  };
  const submit = (event) => {
    event.preventDefault();
    requestCode();
  };
  const loginWithPassword = (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    postJson('/api/auth/password-login', { identifier, password })
      .then((result) => {
        if (result.requiresOtp) {
          setIdentifier(result.identifier);
          setOtpPurpose('two-factor-login');
          setStep('otp');
          setNotice(result.message);
          return;
        }
        localStorage.setItem('scs_session_token', result.token);
        localStorage.setItem('scs_user', JSON.stringify(result.user));
        window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: result.user }));
        const shouldRedirectToCheckout = localStorage.getItem('scs_checkout_redirect') === '1';
        localStorage.removeItem('scs_checkout_redirect');
        if (shouldRedirectToCheckout) {
          window.location.assign('/checkout');
          return;
        }
        close();
        setNotice('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setBusy(false));
  };
  const verify = (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    postJson('/api/auth/verify-otp', { identifier, name, otp, purpose: otpPurpose || mode })
      .then((result) => {
        localStorage.setItem('scs_session_token', result.token);
        localStorage.setItem('scs_user', JSON.stringify(result.user));
        window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: result.user }));
        const shouldRedirectToCheckout = localStorage.getItem('scs_checkout_redirect') === '1';
        localStorage.removeItem('scs_checkout_redirect');
        if (shouldRedirectToCheckout) {
          window.location.assign('/checkout');
          return;
        }
        close();
        setNotice('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setBusy(false));
  };
  if (mode === 'join') return <JoinApplication onClose={close} onComplete={(message) => { close(); setNotice(message); }} />;
  if (mode !== 'login' && mode !== 'signup') return notice ? <div className="marketing-toast">{notice}</div> : null;

  return (
    <>
      <div className="auth-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
        <section className={`auth-flip${mode === 'signup' ? ' is-register' : ''}`} role="dialog" aria-modal="true" aria-labelledby={`auth-title-${mode}`}>
          <button className="auth-close" aria-label="Close dialog" onClick={close}><X size={17} /></button>
          <div className="auth-flip-shape" aria-hidden="true" />
          <form className="auth-flip-panel is-form is-login-form" aria-hidden={mode !== 'login'} onSubmit={step === 'otp' ? verify : loginMethod === 'password' ? loginWithPassword : submit}>
            <h2 id="auth-title-login" className="auth-flip-title auth-login-title item" style={{ '--i': 0 }}>Log in to continue your learning journey</h2>
            {step === 'otp' ? <div className="auth-login-field item" style={{ '--i': 1 }}><input className="auth-login-identifier" id="auth-login-otp" value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder=" " aria-label="One-time password" required /><label className="auth-login-label" htmlFor="auth-login-otp">Enter OTP</label></div> : <div className="auth-login-field item" style={{ '--i': 1 }}><input className="auth-login-identifier" id="auth-login-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} name="identifier" type="text" autoComplete="username" placeholder=" " aria-label="Email or Phone Number" required /><label className="auth-login-label" htmlFor="auth-login-identifier">Email or Phone Number</label></div>}
            {step !== 'otp' && loginMethod === 'password' && <div className="auth-login-field item" style={{ '--i': 2 }}><input className="auth-login-identifier" id="auth-login-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder=" " aria-label="Password" required /><label className="auth-login-label" htmlFor="auth-login-password">Password</label></div>}
            <button className="auth-flip-submit auth-login-continue item" style={{ '--i': 2 }} type="submit" disabled={busy}>{busy ? 'Please wait...' : step === 'otp' ? 'Verify OTP' : loginMethod === 'password' ? 'Log in' : 'Send OTP'}</button>
            {step !== 'otp' && <p className="auth-flip-switch item" style={{ '--i': 3 }}>Use <button type="button" onClick={() => setLoginMethod((method) => method === 'otp' ? 'password' : 'otp')}>{loginMethod === 'otp' ? 'password' : 'OTP'} instead</button></p>}
            {error && <p className="auth-error item" role="alert">{error}</p>}
            <p className="auth-login-divider item" style={{ '--i': 3 }}>Other log in options</p>
            <button className="auth-login-google item" style={{ '--i': 4 }} type="button" onClick={() => setNotice('Google sign-in will be available when authentication is connected.')}><GoogleMark /><span>Sign in with Google</span></button>
            <p className="auth-flip-switch item" style={{ '--i': 5 }}>Don’t have an account? <button type="button" onClick={() => switchMode('signup')}>Sign Up</button></p>
          </form>
          <div className="auth-flip-panel is-info is-login-info" aria-hidden={mode !== 'login'}><img className="auth-flip-illustration item" src="/videos/Login.svg" alt="" /><h2 className="auth-flip-hello item" style={{ '--i': 1 }}>Welcome back</h2><p className="auth-flip-copy item" style={{ '--i': 2 }}>Continue your learning journey with expert-led BIM and computational design training.</p></div>
          <form className="auth-flip-panel is-form is-register-form" aria-hidden={mode !== 'signup'} onSubmit={step === 'otp' ? verify : submit}>
            <h2 id="auth-title-signup" className="auth-flip-title auth-register-title item" style={{ '--i': 0 }}>Sign up with email</h2>
            {step !== 'otp' && <div className="auth-register-field item" style={{ '--i': 1 }}><input className="auth-register-input" id="auth-name" name="name" value={name} onChange={(event) => setName(event.target.value)} type="text" autoComplete="name" placeholder=" " aria-label="Full name" required /><label className="auth-register-label" htmlFor="auth-name">Full name</label></div>}
            <div className="auth-register-field item" style={{ '--i': 2 }}><input className="auth-register-input" id="auth-identifier" name="identifier" value={step === 'otp' ? otp : identifier} onChange={(event) => step === 'otp' ? setOtp(event.target.value) : setIdentifier(event.target.value)} type={step === 'otp' ? 'text' : 'text'} inputMode={step === 'otp' ? 'numeric' : 'email'} maxLength={step === 'otp' ? 6 : undefined} autoComplete={step === 'otp' ? 'one-time-code' : 'email'} placeholder=" " aria-label={step === 'otp' ? 'One-time password' : 'Email or Phone Number'} required /><label className="auth-register-label" htmlFor="auth-identifier">{step === 'otp' ? 'Enter OTP' : 'Email or Phone Number'}</label></div>
            <button className="auth-flip-submit auth-register-continue item" style={{ '--i': 3 }} type="submit" disabled={busy}>{busy ? 'Please wait...' : step === 'otp' ? 'Verify OTP' : 'Send OTP'}</button>
            {error && <p className="auth-error item" role="alert">{error}</p>}
            <p className="auth-login-divider item" style={{ '--i': 4 }}>Other sign up options</p>
            <button className="auth-login-google item" style={{ '--i': 5 }} type="button" onClick={() => setNotice('Google sign-in will be available when authentication is connected.')}><GoogleMark /><span>Sign up with Google</span></button>
            <p className="auth-flip-switch item" style={{ '--i': 6 }}>Already have an account? <button type="button" onClick={() => switchMode('login')}>Login</button></p>
            <p className="auth-register-legal item" style={{ '--i': 7 }}>By signing up, you agree to our <a href="/terms-and-conditions">Terms of Use</a> and <a href="/privacy-policy">Privacy Policy</a>.</p>
          </form>
          <div className="auth-flip-panel is-info is-register-info" aria-hidden={mode !== 'signup'}><img className="auth-flip-illustration item" src="/videos/Login.svg" alt="" /><h2 className="auth-flip-hello item" style={{ '--i': 1 }}>Build your future</h2><p className="auth-flip-copy item" style={{ '--i': 2 }}>Create an account to explore practical, industry-focused learning programs.</p></div>
        </section>
      </div>
      {notice && <div className="marketing-toast">{notice}</div>}
    </>
  );
}

export default AuthModal;