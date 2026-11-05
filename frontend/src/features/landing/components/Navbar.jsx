import React, { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

function Navbar({ onAuth, light = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openAuth = (mode) => {
    setMenuOpen(false);
    if (onAuth) {
      onAuth(mode);
      return;
    }
    window.dispatchEvent(new CustomEvent('scs-auth', { detail: mode }));
  };

  const closeMenu = () => setMenuOpen(false);

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
    <header className={`absolute inset-x-0 top-0 z-20 flex h-[72px] items-center justify-between gap-[clamp(24px,5vw,72px)] border-b px-[clamp(20px,6vw,94px)] backdrop-blur-sm max-[720px]:h-[62px] max-[720px]:px-[18px] ${light ? 'border-[#edf0f4] bg-white' : 'border-white/[0.06] bg-[#10101b]/35'}`}>
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
        <div className="ml-auto flex items-center gap-[10px] max-[720px]:ml-0 max-[720px]:mt-3 max-[720px]:justify-start">
          <button className={`min-h-10 cursor-pointer rounded-[6px] border bg-transparent px-4 font-['DM_Sans'] text-[14px] font-bold hover:border-[#b7a5ff] ${light ? 'border-[#dfe3ea] text-[#24384d]' : 'border-white/[0.16] text-[#efedf7]'}`} onClick={() => openAuth('login')}>Login</button>
          <button className="inline-flex min-h-10 cursor-pointer items-center gap-[7px] rounded-full border border-white bg-white px-4 font-['DM_Sans'] text-[14px] font-bold text-[#211a37] hover:border-[#e9e9e9] hover:bg-[#e9e9e9]" onClick={() => openAuth('join')}>
            Join now <ArrowUpRight size={15} />
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
