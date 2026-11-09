import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, KeyRound, Link2, LoaderCircle, LockKeyhole, Pencil, Phone, ShieldCheck, UserRound } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import { getBlob, getJson, patchJson, postJson, uploadFile } from '../../../services/api.js';

const initialLinks = { website: '', linkedin: '', instagram: '', youtube: '' };
const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-[#dfe3ea] bg-white px-3.5 text-sm text-[#29283a] outline-none transition focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10';

function AccountSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [links, setLinks] = useState(initialLinks);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [securityOtp, setSecurityOtp] = useState('');
  const [pendingTwoFactor, setPendingTwoFactor] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [editingSection, setEditingSection] = useState('');
  const avatarInput = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { profile: loadedProfile } = await getJson('/api/auth/profile');
        if (!active) return;
        setProfile(loadedProfile);
        setName(loadedProfile.name || '');
        setAbout(loadedProfile.about || '');
        setLinks({ ...initialLinks, ...(loadedProfile.socialLinks || {}) });
        setPhone(loadedProfile.phone || '');
        if (loadedProfile.avatar?.filename) {
          const image = await getBlob('/api/auth/profile/avatar');
          if (active) setAvatarUrl(URL.createObjectURL(image));
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    const handleAuthState = (event) => {
      if (event.detail && localStorage.getItem('scs_session_token')) {
        setLoading(true);
        load();
      } else {
        setProfile(null);
        setLoading(false);
      }
    };
    window.addEventListener('scs-auth-state', handleAuthState);

    if (!localStorage.getItem('scs_session_token')) {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('scs-auth', { detail: 'login' }));
      return () => {
        active = false;
        window.removeEventListener('scs-auth-state', handleAuthState);
      };
    }

    load();
    return () => {
      active = false;
      window.removeEventListener('scs-auth-state', handleAuthState);
      if (avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
    };
  }, []);

  useEffect(() => () => {
    if (avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
  }, [avatarUrl]);

  const runAction = async (action, callback) => {
    setBusy(action);
    setError('');
    setNotice('');
    try {
      await callback();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const startEditing = (section) => {
    setEditingSection(section);
    setError('');
    setNotice('');
    if (section === 'profile') setName(profile?.name || '');
    if (section === 'bio') setAbout(profile?.about || '');
    if (section === 'social') setLinks({ ...initialLinks, ...(profile?.socialLinks || {}) });
    if (section === 'phone') {
      setPhone(profile?.phone || '');
      setPhoneOtpSent(false);
      setOtp('');
    }
    if (section === 'password') {
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    }
    if (section === 'two-factor') {
      setPendingTwoFactor(null);
      setSecurityOtp('');
    }
  };

  const cancelEditing = () => {
    setEditingSection('');
    setError('');
    setNotice('');
    setPhoneOtpSent(false);
    setOtp('');
    setPendingTwoFactor(null);
    setSecurityOtp('');
  };

  const saveName = () => runAction('name', async () => {
    const result = await patchJson('/api/auth/profile', { section: 'personal', data: { name } });
    setProfile(result.profile);
    const user = { ...(JSON.parse(localStorage.getItem('scs_user') || '{}')), name: result.profile.name };
    localStorage.setItem('scs_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: user }));
    setEditingSection('');
    setNotice('Name updated.');
  });

  const saveAbout = () => runAction('about', async () => {
    const result = await patchJson('/api/auth/profile', { section: 'about', data: { about } });
    setProfile(result.profile);
    setEditingSection('');
    setNotice('Bio saved.');
  });

  const saveLinks = () => runAction('links', async () => {
    const result = await patchJson('/api/auth/profile', { section: 'socialLinks', data: { socialLinks: links } });
    setProfile(result.profile);
    setEditingSection('');
    setNotice('Social links saved.');
  });

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void runAction('avatar', async () => {
      await uploadFile('/api/auth/profile/avatar', 'avatar', file);
      const image = await getBlob('/api/auth/profile/avatar');
      setAvatarUrl((previous) => {
        if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
        return URL.createObjectURL(image);
      });
      setProfile((current) => ({ ...current, avatar: { filename: file.name } }));
      window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: JSON.parse(localStorage.getItem('scs_user') || 'null') }));
      setEditingSection('');
      setNotice('Profile photo updated.');
    });
    event.target.value = '';
  };

  const requestPhoneCode = () => runAction('phone', async () => {
    const result = await postJson('/api/auth/profile/phone/request-otp', { phone });
    setPhoneOtpSent(true);
    setNotice(result.message);
  });

  const verifyPhoneCode = () => runAction('phone', async () => {
    await postJson('/api/auth/profile/phone/verify-otp', { phone, otp });
    setProfile((current) => ({ ...current, phone, phoneVerified: true }));
    setPhoneOtpSent(false);
    setOtp('');
    setEditingSection('');
    setNotice('Phone number verified and added to your account.');
  });

  const savePassword = () => runAction('password', async () => {
    if (password !== confirmPassword) throw new Error('The new passwords do not match.');
    const result = await patchJson('/api/auth/profile/security/password', { password, currentPassword });
    setProfile((current) => ({ ...current, passwordEnabled: result.passwordEnabled }));
    setPassword('');
    setCurrentPassword('');
    setConfirmPassword('');
    setEditingSection('');
    setNotice('Password saved.');
  });

  const requestTwoFactor = (enabled) => runAction('two-factor', async () => {
    const result = await postJson('/api/auth/profile/security/two-factor/request-otp', {});
    setPendingTwoFactor(enabled);
    setNotice(result.message);
  });

  const verifyTwoFactor = () => runAction('two-factor', async () => {
    const result = await postJson('/api/auth/profile/security/two-factor/verify-otp', {
      otp: securityOtp,
      enabled: pendingTwoFactor,
    });
    setProfile((current) => ({ ...current, twoFactorEnabled: result.twoFactorEnabled }));
    setPendingTwoFactor(null);
    setSecurityOtp('');
    setEditingSection('');
    setNotice(`Two-factor authentication ${result.twoFactorEnabled ? 'enabled' : 'disabled'}.`);
  });

  const avatarInitial = (profile?.name || 'S').trim().slice(0, 1).toUpperCase();
  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: UserRound, description: 'Photo and full name' },
    { id: 'bio', label: 'Bio', icon: UserRound, description: 'About you' },
    { id: 'social', label: 'Social links', icon: Link2, description: 'Website and profiles' },
    { id: 'phone', label: 'Phone number', icon: Phone, description: 'Verified contact number' },
    { id: 'password', label: 'Password', icon: KeyRound, description: 'Sign-in password' },
    { id: 'two-factor', label: 'Two-factor auth', icon: ShieldCheck, description: 'Extra sign-in protection' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7fa] font-['DM_Sans',_sans-serif] text-[#29283a]">
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-250px)] max-w-[1120px] px-5 pb-14 pt-8 sm:px-8 lg:px-10">
        <div className="mb-7">
          <p className="mb-1 text-xs font-bold uppercase tracking-[.15em] text-[#7A1F2B]">Account</p>
          <h1 className="m-0 font-[Manrope] text-[clamp(1.9rem,3vw,2.4rem)] font-bold leading-tight tracking-[-.04em]">Account settings</h1>
          <p className="mb-0 mt-2 text-sm text-[#686674]">Manage your profile, contact details, and sign-in security.</p>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-[#686674]"><LoaderCircle className="animate-spin" size={18} /> Loading settings…</div>
        ) : !profile ? (
          <section className="rounded-xl border border-[#e7e5ed] bg-white p-6 text-sm text-[#686674]">Sign in to manage your account settings.</section>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <nav className="p-1 lg:sticky lg:top-28" aria-label="Account setting sections">
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
                {settingsSections.map(({ id, label, icon: Icon, description }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setActiveSection(id); cancelEditing(); }}
                    aria-current={activeSection === id ? 'page' : undefined}
                    className={`flex min-h-[58px] items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${activeSection === id ? 'bg-[#f8eeee] text-[#7A1F2B]' : 'text-[#555463] hover:bg-[#f7f6f9]'}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="mt-0.5 hidden text-[11px] text-[#858390] sm:block">{description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="min-h-[400px] px-1 py-2 sm:px-5 sm:py-4">
              {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
              {notice && <p className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status"><Check size={16} />{notice}</p>}

              {activeSection === 'profile' && (
                <section>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><UserRound className="text-[#7A1F2B]" size={20} /><div><h2 className="m-0 font-[Manrope] text-lg font-bold">Profile</h2><p className="mb-0 mt-1 text-xs text-[#777582]">Manage your profile photo and display name.</p></div></div>
                    {editingSection !== 'profile' && <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#686674] hover:bg-[#f4f3f6] hover:text-[#7A1F2B]" onClick={() => startEditing('profile')} aria-label="Edit profile"><Pencil size={17} /></button>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 border-b border-[#eeeef2] pb-6">
                    {avatarUrl ? <img className="size-20 rounded-full object-cover" src={avatarUrl} alt="Profile" /> : <div className="grid size-20 place-items-center rounded-full bg-[#f4e9e9] text-2xl font-bold text-[#7A1F2B]">{avatarInitial}</div>}
                    {editingSection === 'profile' && <div>
                      <p className="mb-2 text-sm font-semibold">Profile photo</p>
                      <input ref={avatarInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} />
                      <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dfe3ea] px-3 text-xs font-bold text-[#444454] hover:border-[#7A1F2B]" disabled={busy === 'avatar'} onClick={() => avatarInput.current?.click()}><Camera size={15} />{busy === 'avatar' ? 'Uploading…' : 'Change photo'}</button>
                      <p className="mb-0 mt-1.5 text-[11px] text-[#777582]">JPG, PNG, or WebP. Maximum 2 MB.</p>
                    </div>}
                  </div>
                  {editingSection === 'profile' ? (
                    <>
                      <label className="mt-6 block text-xs font-semibold text-[#4c4a59]">Full name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></label>
                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold text-[#555463]" onClick={cancelEditing}>Cancel</button>
                        <button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-5 text-sm font-bold text-white hover:bg-[#641a25] disabled:opacity-60" disabled={busy === 'name'} onClick={saveName}>{busy === 'name' ? 'Saving…' : 'Save'}</button>
                      </div>
                    </>
                  ) : <p className="mb-0 mt-5 text-sm font-semibold text-[#444454]">{profile.name || 'No name added'}</p>}
                </section>
              )}

              {activeSection === 'bio' && (
                <section>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><UserRound className="text-[#7A1F2B]" size={20} /><div><h2 className="m-0 font-[Manrope] text-lg font-bold">Bio</h2><p className="mb-0 mt-1 text-xs text-[#777582]">Share a little about yourself and your learning goals.</p></div></div>
                    {editingSection !== 'bio' && <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#686674] hover:bg-[#f4f3f6] hover:text-[#7A1F2B]" onClick={() => startEditing('bio')} aria-label="Edit bio"><Pencil size={17} /></button>}
                  </div>
                  {editingSection === 'bio' ? (
                    <>
                      <label className="block text-xs font-semibold text-[#4c4a59]">About you<textarea className={`${inputClass} min-h-48 py-3`} value={about} onChange={(event) => setAbout(event.target.value)} maxLength={2000} placeholder="Tell people a little about yourself" /></label>
                      <div className="mt-4 flex justify-end gap-2"><button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold text-[#555463]" onClick={cancelEditing}>Cancel</button><button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-5 text-sm font-bold text-white hover:bg-[#641a25]" disabled={busy === 'about'} onClick={saveAbout}>{busy === 'about' ? 'Saving…' : 'Save'}</button></div>
                    </>
                  ) : <p className="mb-0 whitespace-pre-wrap text-sm leading-6 text-[#555463]">{profile.about || 'No bio added yet.'}</p>}
                </section>
              )}

              {activeSection === 'social' && (
                <section>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><Link2 className="text-[#7A1F2B]" size={20} /><div><h2 className="m-0 font-[Manrope] text-lg font-bold">Social links</h2><p className="mb-0 mt-1 text-xs text-[#777582]">Add links to your website and social profiles.</p></div></div>
                    {editingSection !== 'social' && <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#686674] hover:bg-[#f4f3f6] hover:text-[#7A1F2B]" onClick={() => startEditing('social')} aria-label="Edit social links"><Pencil size={17} /></button>}
                  </div>
                  {editingSection === 'social' ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Object.entries({ website: 'Website', linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube' }).map(([key, label]) => (
                          <label key={key} className="block text-xs font-semibold text-[#4c4a59]">{label}<input className={inputClass} type="url" value={links[key]} onChange={(event) => setLinks((current) => ({ ...current, [key]: event.target.value }))} placeholder="https://" /></label>
                        ))}
                      </div>
                      <div className="mt-5 flex justify-end gap-2"><button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold text-[#555463]" onClick={cancelEditing}>Cancel</button><button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-5 text-sm font-bold text-white hover:bg-[#641a25]" disabled={busy === 'links'} onClick={saveLinks}>{busy === 'links' ? 'Saving…' : 'Save'}</button></div>
                    </>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries({ website: 'Website', linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube' }).map(([key, label]) => (
                        <div key={key} className="text-sm"><span className="block text-xs font-semibold text-[#777582]">{label}</span>{profile.socialLinks?.[key] ? <a className="mt-1 inline-block break-all font-medium text-[#7A1F2B] underline" href={profile.socialLinks[key]} target="_blank" rel="noreferrer">{profile.socialLinks[key]}</a> : <span className="mt-1 inline-block text-[#aaa8b2]">Not added</span>}</div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeSection === 'phone' && (
                <section>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><Phone className="text-[#7A1F2B]" size={20} /><div><h2 className="m-0 font-[Manrope] text-lg font-bold">Phone number</h2><p className="mb-0 mt-1 text-xs text-[#777582]">Verify a phone number for account recovery and two-factor sign-in.</p></div></div>
                    {editingSection !== 'phone' && <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#686674] hover:bg-[#f4f3f6] hover:text-[#7A1F2B]" onClick={() => startEditing('phone')} aria-label="Edit phone number"><Pencil size={17} /></button>}
                  </div>
                  {editingSection === 'phone' ? (
                    <>
                      <label className="block max-w-lg text-xs font-semibold text-[#4c4a59]">Phone number with country code<input className={inputClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+919876543210" /></label>
                      {phoneOtpSent && <label className="mt-4 block max-w-lg text-xs font-semibold text-[#4c4a59]">Verification code<input className={inputClass} inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} maxLength={6} /></label>}
                      <div className="mt-4 flex gap-2">
                        <button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold text-[#555463]" onClick={cancelEditing}>Cancel</button>
                        <button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-5 text-sm font-bold text-white hover:bg-[#641a25]" disabled={busy === 'phone'} onClick={phoneOtpSent ? verifyPhoneCode : requestPhoneCode}>{busy === 'phone' ? 'Please wait…' : phoneOtpSent ? 'Verify & save' : 'Send verification code'}</button>
                      </div>
                    </>
                  ) : <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">{profile.phone || phone || 'No phone number added'}</span>{profile.phoneVerified && <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">Verified</span>}</div>}
                </section>
              )}

              {activeSection === 'password' && (
                <section>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><KeyRound className="text-[#7A1F2B]" size={20} /><div><h2 className="m-0 font-[Manrope] text-lg font-bold">Password</h2><p className="mb-0 mt-1 text-xs text-[#777582]">{profile.passwordEnabled ? 'Change your password.' : 'Create a password to sign in with password as well as OTP.'}</p></div></div>
                    {editingSection !== 'password' && <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#686674] hover:bg-[#f4f3f6] hover:text-[#7A1F2B]" onClick={() => startEditing('password')} aria-label="Edit password"><Pencil size={17} /></button>}
                  </div>
                  {editingSection === 'password' ? (
                    <>
                      {profile.passwordEnabled && <label className="mb-4 block max-w-lg text-xs font-semibold text-[#4c4a59]">Current password<input className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-semibold text-[#4c4a59]">New password<input className={inputClass} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} /></label>
                        <label className="block text-xs font-semibold text-[#4c4a59]">Confirm new password<input className={inputClass} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} /></label>
                      </div>
                      <div className="mt-5 flex justify-end gap-2"><button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold text-[#555463]" onClick={cancelEditing}>Cancel</button><button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-5 text-sm font-bold text-white hover:bg-[#641a25]" disabled={busy === 'password'} onClick={savePassword}>{busy === 'password' ? 'Saving…' : 'Save'}</button></div>
                    </>
                  ) : <p className="mb-0 text-sm font-semibold text-[#555463]">{profile.passwordEnabled ? 'Password is set' : 'No password set'}</p>}
                </section>
              )}

              {activeSection === 'two-factor' && (
                <section>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3"><ShieldCheck className="text-[#7A1F2B]" size={20} /><div><h2 className="m-0 font-[Manrope] text-lg font-bold">Two-factor authentication</h2><p className="mb-0 mt-1 text-xs text-[#777582]">When enabled, sign-in requires your password and a code sent to your verified phone.</p></div></div>
                    {editingSection !== 'two-factor' && <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#686674] hover:bg-[#f4f3f6] hover:text-[#7A1F2B]" onClick={() => startEditing('two-factor')} aria-label="Edit two-factor authentication"><Pencil size={17} /></button>}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">{profile.twoFactorEnabled ? <><Check size={17} className="text-green-600" /> Enabled</> : <><LockKeyhole size={17} className="text-[#777582]" /> Disabled</>}</div>
                  {editingSection === 'two-factor' && !pendingTwoFactor && (
                    <>
                      {!profile.phoneVerified && <p className="mb-0 mt-3 text-xs text-[#777582]">Verify a phone number first to enable this feature.</p>}
                      {!profile.passwordEnabled && <p className="mb-0 mt-3 text-xs text-[#777582]">Create a password first to enable this feature.</p>}
                      <div className="mt-5 flex justify-end gap-2">
                        <button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold text-[#555463]" onClick={cancelEditing}>Cancel</button>
                        <button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-4 text-sm font-bold text-white hover:bg-[#641a25] disabled:opacity-50" disabled={busy === 'two-factor' || !profile.passwordEnabled || !profile.phoneVerified} onClick={() => requestTwoFactor(!profile.twoFactorEnabled)}>{profile.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}</button>
                      </div>
                    </>
                  )}
                  {editingSection === 'two-factor' && pendingTwoFactor !== null && (
                    <div className="mt-5 max-w-lg">
                      <label className="block text-xs font-semibold text-[#4c4a59]">Verification code sent to your phone<input className={inputClass} inputMode="numeric" autoComplete="one-time-code" value={securityOtp} onChange={(event) => setSecurityOtp(event.target.value)} maxLength={6} /></label>
                      <div className="mt-3 flex justify-end gap-2"><button type="button" className="min-h-10 rounded-lg border border-[#dfe3ea] px-4 text-sm font-semibold" onClick={cancelEditing}>Cancel</button><button type="button" className="min-h-10 rounded-lg bg-[#7A1F2B] px-4 text-sm font-bold text-white hover:bg-[#641a25]" disabled={busy === 'two-factor'} onClick={verifyTwoFactor}>Save</button></div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer showAccent={false} />
    </div>
  );
}

export default AccountSettingsPage;
