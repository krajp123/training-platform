import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Bell, BookOpen, Heart, HelpCircle, LogOut, Menu, MoreVertical, Settings, ShoppingCart, User, Wallet, X } from 'lucide-react';
import { getBlob } from '../../../services/api.js';

function Navbar({ onAuth, light = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('scs_user') || 'null');
    } catch {
      return null;
    }
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');

  useEffect(() => {
    const updateUser = (event) => setUser(event.detail || null);
    window.addEventListener('scs-auth-state', updateUser);
    return () => window.removeEventListener('scs-auth-state', updateUser);
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setProfileAvatarUrl('');
    if (!user) return () => { active = false; };

    getBlob('/api/auth/profile/avatar')
      .then((image) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(image);
        setProfileAvatarUrl(objectUrl);
      })
      .catch((error) => {
        if (active && error.message !== 'No profile photo has been uploaded.') {
          console.error('Unable to load the profile photo for the account menu.', error);
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user]);

  const openAuth = (mode) => {
    setMenuOpen(false);
    if (onAuth) {
      onAuth(mode);
      return;
    }
    window.dispatchEvent(new CustomEvent('scs-auth', { detail: mode }));
  };

  const closeMenu = () => setMenuOpen(false);

  const logout = () => {
    localStorage.removeItem('scs_session_token');
    localStorage.removeItem('scs_user');
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: null }));
  };

  const profileItems = [
    { label: "My SCS Profile", icon: User, href: '/profile' },
    { label: 'My Learning', icon: BookOpen, href: '/dashboard' },
    { label: 'My Cart', icon: ShoppingCart, href: '/dashboard' },
    { label: 'Wishlist', icon: Heart, href: '/dashboard' },
    { label: 'Notification', icon: Bell, href: '/dashboard' },
    { label: 'Account Setting', icon: Settings, href: '/dashboard' },
    { label: 'Payment Method', icon: Wallet, href: '/dashboard' },
    { label: 'Purch history', icon: MoreVertical, href: '/dashboard' },
    { label: 'Help & Support', icon: HelpCircle, href: '/dashboard' },
  ];

  const avatarUrl = profileAvatarUrl || (user
    ? user.avatarUrl || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#7658e8"/><text x="40" y="46" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="28" font-weight="700">${(user.name || user.identifier || 'U').trim().slice(0, 1).toUpperCase()}</text></svg>`)}`
    : '');

  const scrollToSection = (event, sectionId) => {
    closeMenu();

    event.preventDefault();
    if (window.location.pathname !== '/') {
      window.location.assign(`/#${sectionId}`);
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) {
      window.location.assign(`/#${sectionId}`);
      return;
    }

    window.history.replaceState(null, '', `#${sectionId}`);
    section.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <header className={`sticky inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between gap-[clamp(24px,5vw,72px)] border-b px-[clamp(20px,6vw,94px)] max-[720px]:h-[62px] max-[720px]:px-[18px] ${light ? 'border-[#edf0f4] bg-white' : 'border-white/[0.06] bg-[#10101b]/95'}`}>
      <a className="inline-flex h-[60px] w-[140px] items-center overflow-hidden no-underline max-[720px]:h-[52px] max-[720px]:w-[120px]" href="/" aria-label="SCS Academy home" onClick={closeMenu}>
        <img className="h-full w-full object-cover object-center" src="/images/logo.png" alt="SCS Academy" />
      </a>
      <button
        className={`hidden size-[35px] place-items-center rounded-[6px] border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aa9bff] max-[720px]:grid ${light ? 'border-[#dfe3ea] bg-white text-[#24384d]' : 'border-white/[0.10] bg-white/[0.03] text-white'}`}
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="marketing-navigation"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav
        id="marketing-navigation"
        className={`flex flex-1 items-center gap-[clamp(20px,3.2vw,46px)] max-[720px]:absolute max-[720px]:top-[61px] max-[720px]:right-0 max-[720px]:left-0 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-0 max-[720px]:border-b max-[720px]:px-[17px] max-[720px]:pb-4 max-[720px]:pt-2 ${light ? 'text-[#687789] max-[720px]:border-[#edf0f4] max-[720px]:bg-white' : 'max-[720px]:border-white/[0.10] max-[720px]:bg-[#14131f]'} ${menuOpen ? 'max-[720px]:flex' : 'max-[720px]:hidden'}`}
        aria-label="Main navigation"
      >
        <a className={`text-[14px] no-underline transition-colors hover:text-[#6048b7] max-[720px]:border-b max-[720px]:px-[3px] max-[720px]:py-3 ${light ? 'text-[#687789] max-[720px]:border-[#edf0f4]' : 'text-[#b7b4c3] max-[720px]:border-white/[0.07]'}`} href="/bim" onClick={closeMenu}>Learn BIM</a>
        <a className={`text-[14px] no-underline transition-colors hover:text-[#6048b7] max-[720px]:border-b max-[720px]:px-[3px] max-[720px]:py-3 ${light ? 'text-[#687789] max-[720px]:border-[#edf0f4]' : 'text-[#b7b4c3] max-[720px]:border-white/[0.07]'}`} href="/#courses" onClick={(event) => scrollToSection(event, 'courses')}>Explore courses</a>

        <a className={`text-[14px] no-underline transition-colors hover:text-[#6048b7] max-[720px]:border-b max-[720px]:px-[3px] max-[720px]:py-3 ${light ? 'text-[#687789] max-[720px]:border-[#edf0f4]' : 'text-[#b7b4c3] max-[720px]:border-white/[0.07]'}`} href="/#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>About SAS Academy</a>
        <a className={`text-[14px] no-underline transition-colors hover:text-[#6048b7] max-[720px]:border-b max-[720px]:px-[3px] max-[720px]:py-3 ${light ? 'text-[#687789] max-[720px]:border-[#edf0f4]' : 'text-[#b7b4c3] max-[720px]:border-white/[0.07]'}`} href="/#stories" onClick={(event) => scrollToSection(event, 'stories')}>Our learners</a>
        <div className={`ml-auto flex items-center gap-[10px] max-[720px]:ml-0 max-[720px]:mt-3 max-[720px]:justify-start ${user ? 'absolute right-6 top-1/2 -translate-y-1/2 max-[720px]:right-[18px] max-[720px]:top-[11px] max-[720px]:translate-y-0' : ''}`}>
          {user ? (
            <div
              className="relative size-10 shrink-0"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aa9bff]"
                aria-label={`Open ${user.name || 'your'} account menu`}
                aria-expanded={profileOpen}
                aria-controls="profile-menu"
                onFocus={() => setProfileOpen(true)}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <img className="size-full object-cover" src={avatarUrl} alt="" />
              </button>
              <div
                className="absolute right-0 top-full z-50 w-[min(280px,calc(100vw-32px))] overflow-hidden pt-3 motion-reduce:transition-none"
                style={{
                  maxHeight: profileOpen ? 'calc(100vh - 96px)' : '0px',
                  opacity: profileOpen ? 1 : 0,
                  transform: profileOpen ? 'translateY(0) scaleY(1)' : 'translateY(-8px) scaleY(0.96)',
                  transformOrigin: 'top right',
                  transition: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'none'
                    : 'max-height 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease, transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: profileOpen ? 'auto' : 'none',
                }}
                aria-hidden={!profileOpen}
                inert={!profileOpen}
              >
                  <div id="profile-menu" className="max-h-[calc(100vh-96px)] overflow-y-auto overflow-x-hidden border border-[#d9dce5] bg-white shadow-[0_16px_40px_#10101b26]" role="menu" aria-label="Account menu">
                    <div className="flex min-h-[88px] items-center gap-3 border-b border-[#e3e5eb] px-5 py-4">
                      <img className="size-14 shrink-0 rounded-full object-cover" src={avatarUrl} alt="" />
                      <div className="min-w-0">
                        <strong className="block truncate text-[15px] font-bold text-[#252735]">{user.name || 'SCS Academy learner'}</strong>
                        <span className="mt-1 block truncate text-[12px] text-[#74798a]">{user.identifier}</span>
                      </div>
                    </div>
                    <div className="p-2">
                      {profileItems.map(({ label, icon: Icon, href }) => (
                        <a
                          key={label}
                          href={href}
                          role="menuitem"
                          className="!flex !min-h-11 !items-center !gap-3 !rounded-none !px-3 !py-2.5 !text-[13px] !font-semibold !text-[#555b6d] no-underline transition-colors hover:!bg-[#f4f3ff] hover:!text-[#6048b7]"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                          {label}
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-[#e3e5eb] p-2">
                      <button
                        role="menuitem"
                        className="!flex !min-h-11 !w-full !items-center !gap-3 !rounded-none !px-3 !py-2.5 !text-left !text-[13px] !font-semibold !text-[#c2414f] transition-colors hover:!bg-[#fff1f2]"
                        onClick={logout}
                      >
                        <LogOut size={16} aria-hidden="true" />
                        Log Out
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          ) : (
            <>
              <button className={`min-h-10 cursor-pointer rounded-[6px] border bg-transparent px-4 font-['DM_Sans'] text-[14px] font-bold hover:border-[#b7a5ff] ${light ? 'border-[#dfe3ea] text-[#24384d]' : 'border-white/[0.16] text-[#efedf7]'}`} onClick={() => openAuth('login')}>Login</button>
              <button className="inline-flex min-h-10 cursor-pointer items-center gap-[7px] rounded-full border border-white bg-white px-4 font-['DM_Sans'] text-[14px] font-bold text-[#211a37] hover:border-[#e9e9e9] hover:bg-[#e9e9e9]" onClick={() => openAuth('join')}>
                Join now <ArrowUpRight size={15} />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
