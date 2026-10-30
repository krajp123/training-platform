import React, { useState } from 'react';
import { ArrowUpRight, GraduationCap, Menu, X } from 'lucide-react';

function Navbar({ onAuth }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openAuth = (mode) => {
    setMenuOpen(false);
    onAuth(mode);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative z-20 flex h-[72px] items-center justify-between border-b border-white/[0.06] bg-[#10101bee] px-[clamp(20px,6vw,94px)] max-[720px]:h-[62px] max-[720px]:px-[18px]">
      <a className="inline-flex items-center gap-[9px] font-[Manrope] text-[19px] font-extrabold tracking-[-.8px] text-[#fbfaff] no-underline" href="/" aria-label="SCS Academy home" onClick={closeMenu}>
        <span className="grid size-[31px] place-items-center rounded-[9px] bg-[#7658e8] text-white"><GraduationCap size={20} strokeWidth={2.5} /></span>
        <span>SCS Academy</span>
      </a>
      <button
        className="hidden size-[35px] place-items-center rounded-[6px] border border-white/[0.10] bg-white/[0.03] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aa9bff] max-[720px]:grid"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="marketing-navigation"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav
        id="marketing-navigation"
        className={`flex items-center gap-[clamp(20px,3.2vw,46px)] max-[720px]:absolute max-[720px]:top-[61px] max-[720px]:right-0 max-[720px]:left-0 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-0 max-[720px]:border-b max-[720px]:border-white/[0.10] max-[720px]:bg-[#14131f] max-[720px]:px-[17px] max-[720px]:pb-4 max-[720px]:pt-2 ${menuOpen ? 'max-[720px]:flex' : 'max-[720px]:hidden'}`}
        aria-label="Main navigation"
      >
        <a className="text-[14px] text-[#b7b4c3] no-underline transition-colors hover:text-[#c8b9ff] max-[720px]:border-b max-[720px]:border-white/[0.07] max-[720px]:px-[3px] max-[720px]:py-3" href="#courses" onClick={closeMenu}>Explore courses</a>
        <a className="text-[14px] text-[#b7b4c3] no-underline transition-colors hover:text-[#c8b9ff] max-[720px]:border-b max-[720px]:border-white/[0.07] max-[720px]:px-[3px] max-[720px]:py-3" href="#how-it-works" onClick={closeMenu}>How it works</a>
        <a className="text-[14px] text-[#b7b4c3] no-underline transition-colors hover:text-[#c8b9ff] max-[720px]:border-b max-[720px]:border-white/[0.07] max-[720px]:px-[3px] max-[720px]:py-3" href="#stories" onClick={closeMenu}>Our learners</a>
        <div className="ml-2 flex items-center gap-[10px] max-[720px]:ml-0 max-[720px]:mt-3 max-[720px]:justify-start">
          <button className="min-h-10 cursor-pointer rounded-[6px] border border-white/[0.16] bg-transparent px-4 font-['DM_Sans'] text-[14px] font-bold text-[#efedf7] hover:border-[#b7a5ff]" onClick={() => openAuth('login')}>Login</button>
          <button className="inline-flex min-h-10 cursor-pointer items-center gap-[7px] rounded-[6px] border border-[#c9bbff] bg-[#c9bbff] px-4 font-['DM_Sans'] text-[14px] font-bold text-[#211a37] hover:border-white hover:bg-white" onClick={() => openAuth('join')}>
            Join now <ArrowUpRight size={15} />
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
