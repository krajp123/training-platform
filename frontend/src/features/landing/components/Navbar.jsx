import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, BookOpen, Heart, HelpCircle, LogOut, Menu, MoreVertical, Plus, Settings, ShoppingCart, User, Wallet, X } from 'lucide-react';
import { getBlob } from '../../../services/api.js';
import { clearCartData, getCart, subscribeToCart } from '../../../services/cart.js';

function ShoppingCartPlus({ size = 21 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }} aria-hidden="true">
      <ShoppingCart size={size} strokeWidth={1.8} />
      <Plus className="absolute -right-1 -top-1 rounded-full bg-white" size={11} strokeWidth={2.5} />
    </span>
  );
}

const RING_WIDTH = 6; // golden line ki thickness (px)
const RING_CORNER = 28; // bottom corner radius (px) - className ke rounded-b-[28px] ke saath same rakhna
const RING_FADE = 90; // bottom corners ke baad line kitni door tak fade hoke khatam hogi (px)

// Orange-to-maroon accent gradient
const RING_GRADIENT =
  'linear-gradient(90deg, #7A1F2B 0%, #A52A32 22%, #D34B2F 48%, #E97832 68%, #C94C2D 84%, #7A1F2B 100%)';

// Top + left + right edge aur dono bottom corners
const ringStyle = {
  padding: `${RING_WIDTH}px`,
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  background: RING_GRADIENT,
};

// Bottom corners ke baad line smoothly fade hoke khatam hoti hai, bottom ka beech wala hissa khali rehta hai
const ringFadeMask = {
  WebkitMaskImage: 'linear-gradient(#000, #000), linear-gradient(to right, #000, transparent), linear-gradient(to left, #000, transparent)',
  maskImage: 'linear-gradient(#000, #000), linear-gradient(to right, #000, transparent), linear-gradient(to left, #000, transparent)',
  WebkitMaskSize: `100% calc(100% - ${RING_CORNER}px), ${RING_FADE}px ${RING_CORNER + 2}px, ${RING_FADE}px ${RING_CORNER + 2}px`,
  maskSize: `100% calc(100% - ${RING_CORNER}px), ${RING_FADE}px ${RING_CORNER + 2}px, ${RING_FADE}px ${RING_CORNER + 2}px`,
  WebkitMaskPosition: 'top left, bottom left, bottom right',
  maskPosition: 'top left, bottom left, bottom right',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

function Navbar({ onAuth, logoSrc = '/images/logo.png', isHomePageOverride, disableScrollShift = false }) {
  const navigate = useNavigate();
  const isHomePage = isHomePageOverride ?? window.location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCompactNav, setIsCompactNav] = useState(() => window.matchMedia('(max-width: 980px)').matches);
  const [compactNavHeight, setCompactNavHeight] = useState(0);
  const navigationRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState(null);
  const profileButtonRef = useRef(null);
  const mobileProfileButtonRef = useRef(null);
  const profileMenuContainerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 32);
  const showScrolledStyle = isScrolled && !disableScrollShift;
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('scs_user') || 'null');
    } catch {
      return null;
    }
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const updateProfileMenuPosition = (button = (isCompactNav ? mobileProfileButtonRef.current : profileButtonRef.current)) => {
    if (!button) return;

    const anchor = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.min(280, viewportWidth - 24);
    const menuLeft = Math.max(12, Math.min(anchor.right - menuWidth, viewportWidth - menuWidth - 12));
    const menuHeight = profileMenuRef.current?.scrollHeight || 560;
    const spaceBelow = Math.max(0, viewportHeight - anchor.bottom - 24);
    const spaceAbove = Math.max(0, anchor.top - 24);
    const opensAbove = spaceBelow < Math.min(menuHeight, viewportHeight - 24) && spaceAbove > spaceBelow;

    setProfileMenuPosition({
      left: menuLeft,
      width: menuWidth,
      maxHeight: opensAbove ? spaceAbove : spaceBelow,
      opensAbove,
      top: anchor.bottom,
      bottom: viewportHeight - anchor.top,
    });
  };

  useEffect(() => {
    try {
      setCartCount(getCart().length);
    } catch (error) {
      console.error('Unable to load the shopping cart count.', error);
    }

    return subscribeToCart((cart) => setCartCount(cart.length));
  }, []);

  useEffect(() => {
    const updateScrollState = () => {
      const scrollY = window.scrollY;
      setIsScrolled((scrolled) => {
        if (!scrolled && scrollY > 32) return true;
        if (scrolled && scrollY < 8) return false;
        return scrolled;
      });
    };
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  useEffect(() => {
    const updateCompactNav = () => setIsCompactNav(window.matchMedia('(max-width: 980px)').matches);
    window.addEventListener('resize', updateCompactNav, { passive: true });
    return () => window.removeEventListener('resize', updateCompactNav);
  }, []);

  useEffect(() => {
    if (isCompactNav && menuOpen) {
      setCompactNavHeight(navigationRef.current?.scrollHeight ?? 0);
    }
  }, [isCompactNav, menuOpen, user]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const updatePosition = () => updateProfileMenuPosition();

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [profileOpen]);

  useEffect(() => {
    const updateUser = (event) => {
      const nextUser = event.detail || null;
      setUser(nextUser);
      if (!nextUser) {
        clearCartData();
      }
    };
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
  const toggleMenu = () => {
    if (!menuOpen && isCompactNav) {
      setCompactNavHeight(navigationRef.current?.scrollHeight ?? 0);
    }
    setMenuOpen((isOpen) => !isOpen);
  };

  const logout = () => {
    localStorage.removeItem('scs_session_token');
    localStorage.removeItem('scs_user');
    clearCartData();
    setUser(null);
    setMenuOpen(false);
    setProfileOpen(false);
    window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: null }));
    navigate('/');
  };

  const profileItems = [
    { label: "My SCS Profile", icon: User, href: '/profile' },
    { label: 'My Learning', icon: BookOpen, href: '/dashboard' },
    { label: 'My Cart', icon: ShoppingCart, href: '/cart' },
    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
    { label: 'Notification', icon: Bell, href: '/dashboard' },
    { label: 'Account Setting', icon: Settings, href: '/account-settings' },
    { label: 'Payment Method', icon: Wallet, href: '/payment-method' },
    { label: 'Purch history', icon: MoreVertical, href: '/orders' },
    { label: 'Help & Support', icon: HelpCircle, href: '/support' },
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
    <header className={`${isHomePage ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 h-[96px] px-4 pt-6 max-[980px]:h-[78px] max-[980px]:px-2 max-[980px]:pt-4`}>
      <div className={`relative mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between gap-[clamp(18px,3vw,40px)] border bg-white px-[clamp(18px,2.4vw,36px)] text-[#202330] transition-[translate,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-[980px]:h-[62px] max-[980px]:px-[18px] ${showScrolledStyle ? '-translate-y-6 max-[980px]:-translate-y-4 rounded-t-none rounded-b-[28px] border-transparent shadow-[0_8px_24px_#15162918]' : 'translate-y-0 rounded-2xl border-[#e7e9ef] shadow-[0_8px_30px_#15162920]'}`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500 motion-reduce:transition-none ${showScrolledStyle ? 'opacity-100' : 'opacity-0'}`}
        style={ringFadeMask}
      >
        <div className="absolute inset-0 rounded-[inherit]" style={ringStyle} />
      </div>
      <a className="relative z-10 inline-flex h-[68px] w-[148px] shrink-0 items-center overflow-hidden no-underline max-[980px]:h-[58px] max-[980px]:w-[132px] max-[380px]:w-[96px]" href="/" aria-label="SCS Academy home" onClick={closeMenu}>
        <img className="h-full w-full scale-[1.45] object-contain object-center max-[980px]:scale-[1.35]" src={logoSrc} alt="SCS Academy" />
      </a>
      <button
        type="button"
        className="relative z-10 hidden size-[35px] place-items-center rounded-md border border-[#dfe3ea] bg-white text-[#24384d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#64748b] max-[980px]:order-3 max-[980px]:ml-1 max-[980px]:grid max-[380px]:size-8"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="marketing-navigation"
        onClick={toggleMenu}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav
        ref={navigationRef}
        id="marketing-navigation"
        className="relative z-10 flex flex-1 items-center gap-[clamp(16px,2vw,28px)] text-[#303545] transition-[height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-[980px]:absolute max-[980px]:top-[61px] max-[980px]:right-0 max-[980px]:left-0 max-[980px]:flex-col max-[980px]:items-stretch max-[980px]:gap-0 max-[980px]:min-h-0 max-[980px]:overflow-hidden max-[980px]:border max-[980px]:border-t-0 max-[980px]:border-[#e7e9ef] max-[980px]:bg-white max-[980px]:px-[17px] max-[980px]:pb-4 max-[980px]:pt-2 max-[980px]:shadow-[0_12px_20px_#15162918]"
        style={{
          height: isCompactNav ? `${menuOpen ? compactNavHeight : 0}px` : 'auto',
          opacity: isCompactNav && !menuOpen ? 0 : 1,
          transform: isCompactNav && !menuOpen ? 'translateY(-10px)' : 'translateY(0)',
          pointerEvents: isCompactNav && !menuOpen ? 'none' : 'auto',
        }}
        aria-hidden={isCompactNav && !menuOpen}
        inert={isCompactNav && !menuOpen ? '' : undefined}
        aria-label="Main navigation"
      >
        <a className="text-[15px] font-bold text-[#171923] no-underline transition-colors hover:text-[#6048b7] max-[980px]:border-b max-[980px]:border-[#edf0f4] max-[980px]:px-[3px] max-[980px]:py-3" href="/bim" onClick={closeMenu}>Learn BIM</a>
        <a className="text-[15px] font-bold text-[#171923] no-underline transition-colors hover:text-[#6048b7] max-[980px]:border-b max-[980px]:border-[#edf0f4] max-[980px]:px-[3px] max-[980px]:py-3" href="/#courses" onClick={(event) => scrollToSection(event, 'courses')}>Explore courses</a>

        <a className="text-[15px] font-bold text-[#171923] no-underline transition-colors hover:text-[#6048b7] max-[980px]:border-b max-[980px]:border-[#edf0f4] max-[980px]:px-[3px] max-[980px]:py-3" href="/#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>About SAS Academy</a>
        <a className="text-[15px] font-bold text-[#171923] no-underline transition-colors hover:text-[#6048b7] max-[980px]:border-b max-[980px]:border-[#edf0f4] max-[980px]:px-[3px] max-[980px]:py-3" href="/#stories" onClick={(event) => scrollToSection(event, 'stories')}>Our learners</a>
        {!user && (
          <div className="mt-3 flex items-center gap-2 min-[981px]:hidden">
            <button className="min-h-10 cursor-pointer rounded-md border border-[#dfe3ea] bg-white px-4 font-['DM_Sans'] text-[14px] font-bold text-[#24384d] transition-colors hover:border-[#aeb8c6] hover:bg-[#f8fafc]" onClick={() => openAuth('login')}>Login</button>
            <button className="inline-flex min-h-10 cursor-pointer items-center gap-[7px] rounded-full border border-[#dfe3ea] bg-white px-4 font-['DM_Sans'] text-[14px] font-bold text-[#202330] transition-colors hover:border-[#aeb8c6] hover:bg-[#f8fafc]" onClick={() => openAuth('join')}>
              Join now <ArrowUpRight size={15} />
            </button>
          </div>
        )}
      </nav>
      <div className="relative z-10 ml-auto flex shrink-0 items-center gap-[10px] max-[980px]:order-2 max-[980px]:gap-0">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#7A1F2B] transition-colors hover:bg-[#fff3eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#64748b] max-[980px]:size-8 max-[380px]:size-[30px]"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={21} strokeWidth={1.8} />
            </button>
            <a
              href="/wishlist"
              className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#7A1F2B] transition-colors hover:bg-[#fff3eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#64748b] max-[980px]:size-8 max-[380px]:size-[30px]"
              aria-label="Wishlist"
            >
              <Heart size={21} strokeWidth={1.8} />
            </a>
          </div>
          <a
            href="/cart"
            className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#7A1F2B] transition-colors hover:bg-[#fff3eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#64748b] max-[980px]:size-8 max-[380px]:size-[30px]"
            aria-label={`Shopping cart${cartCount ? `, ${cartCount} ${cartCount === 1 ? 'course' : 'courses'}` : ''}`}
          >
            <ShoppingCartPlus />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[#E97832] px-1 text-[10px] font-bold leading-none text-white">
                {cartCount}
              </span>
            )}
          </a>
          {user && (
            <button
              ref={mobileProfileButtonRef}
              type="button"
              className="hidden size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#e1e5ec] bg-white shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#64748b] max-[980px]:inline-flex max-[980px]:size-8 max-[380px]:size-[30px]"
              aria-label={`Open ${user.name || 'your'} account menu`}
              aria-expanded={profileOpen}
              aria-controls="profile-menu"
              onClick={(event) => {
                updateProfileMenuPosition(event.currentTarget);
                setProfileOpen((open) => (
                  window.matchMedia('(hover: hover) and (pointer: fine)').matches ? true : !open
                ));
              }}
            >
              <img className="size-full object-cover" src={avatarUrl} alt="" />
            </button>
          )}
          {user ? (
            <>
              <div
                className="relative size-10 shrink-0 max-[980px]:hidden"
                onMouseEnter={() => {
                  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setProfileOpen(true);
                }}
                onMouseLeave={(event) => {
                  if (
                    window.matchMedia('(hover: hover) and (pointer: fine)').matches
                    && !profileMenuContainerRef.current?.contains(event.relatedTarget)
                  ) setProfileOpen(false);
                }}
              >
                <button
                  ref={profileButtonRef}
                  type="button"
                  className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#e1e5ec] bg-white shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#64748b]"
                  aria-label={`Open ${user.name || 'your'} account menu`}
                  aria-expanded={profileOpen}
                  aria-controls="profile-menu"
                  onClick={(event) => {
                    updateProfileMenuPosition(event.currentTarget);
                    setProfileOpen((open) => (
                      window.matchMedia('(hover: hover) and (pointer: fine)').matches ? true : !open
                    ));
                  }}
                >
                  <img className="size-full object-cover" src={avatarUrl} alt="" />
                </button>
              </div>
              {profileMenuPosition && createPortal(
                <div
                  ref={profileMenuContainerRef}
                  className="fixed z-[60] overflow-hidden motion-reduce:transition-none"
                  style={{
                    left: `${profileMenuPosition.left}px`,
                    top: profileMenuPosition.opensAbove ? 'auto' : `${profileMenuPosition.top}px`,
                    bottom: profileMenuPosition.opensAbove ? `${profileMenuPosition.bottom}px` : 'auto',
                    width: `${profileMenuPosition.width}px`,
                    maxHeight: profileOpen ? `${profileMenuPosition.maxHeight + 12}px` : '0px',
                    paddingTop: profileMenuPosition.opensAbove ? 0 : '12px',
                    paddingBottom: profileMenuPosition.opensAbove ? '12px' : 0,
                    opacity: profileOpen ? 1 : 0,
                    transform: profileOpen
                      ? 'translateY(0) scaleY(1)'
                      : `translateY(${profileMenuPosition.opensAbove ? '8px' : '-8px'}) scaleY(0.96)`,
                    transformOrigin: profileMenuPosition.opensAbove ? 'bottom right' : 'top right',
                    transition: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'none'
                      : 'max-height 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease, transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: profileOpen ? 'auto' : 'none',
                  }}
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setProfileOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setProfileOpen(false);
                  }}
                  aria-hidden={!profileOpen}
                  inert={!profileOpen ? '' : undefined}
                >
                  <div
                    ref={profileMenuRef}
                    id="profile-menu"
                    className="overflow-y-auto overflow-x-hidden overscroll-contain border border-[#d9dce5] bg-white shadow-[0_16px_40px_#10101b26]"
                    style={{ maxHeight: profileOpen ? `${profileMenuPosition.maxHeight}px` : undefined }}
                    role="menu"
                    aria-label="Account menu"
                  >
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
                </div>,
                document.body,
              )}
            </>
          ) : (
            <>
              <button className="min-h-10 cursor-pointer rounded-md border border-[#dfe3ea] bg-white px-4 font-['DM_Sans'] text-[14px] font-bold text-[#24384d] transition-colors hover:border-[#aeb8c6] hover:bg-[#f8fafc] max-[980px]:hidden" onClick={() => openAuth('login')}>Login</button>
              <button className="inline-flex min-h-10 cursor-pointer items-center gap-[7px] rounded-full border border-[#dfe3ea] bg-white px-4 font-['DM_Sans'] text-[14px] font-bold text-[#202330] transition-colors hover:border-[#aeb8c6] hover:bg-[#f8fafc] max-[980px]:hidden" onClick={() => openAuth('join')}>
                Join now <ArrowUpRight size={15} />
              </button>
            </>
          )}
      </div>
      </div>
    </header>
  );
}

export default Navbar;