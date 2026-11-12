import React from 'react';
import { ArrowUp } from 'lucide-react';

const exploreLinks = [
  { label: 'BIM Professional Program', href: '/#courses' },
  { label: 'Computational Design Program', href: '/#courses' },
  { label: 'Our courses', href: '/#courses' },
];

const aboutLinks = [
  { label: 'About SCS Academy', href: '#how-it-works' },
  { label: 'Our learners', href: '#stories' },
];

const legalLinks = [
  { label: 'Privacy policy', href: '/privacy-policy' },
  { label: 'Terms & conditions', href: '/terms-and-conditions' },
];

// "!" keeps these colours even when the footer is rendered inside a wrapper
// that forces `a { color: inherit }` (like the marketing page does).
const linkClass =
  'group inline-flex w-fit items-center gap-1.5 text-base !text-[#686674] no-underline transition-colors duration-200 hover:!text-[#6048b7]';

function FooterColumn({ title, links }) {
  return (
    <nav className="grid content-start gap-3.5" aria-label={title}>
      <h2 className="m-0 mb-1 text-sm font-bold uppercase tracking-[.16em] text-[#24232d]">{title}</h2>
      {links.map(({ label, href }) => (
        <a key={label} className={linkClass} href={href}>
          <span className="h-px w-0 bg-[#7ae8d5] transition-all duration-200 group-hover:w-3" aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}

function Footer({ logoSrc = '/images/logo.png' }) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative overflow-hidden border-t border-[#e7e5ed] bg-white px-[clamp(24px,5vw,80px)] pt-16 text-[#686674] max-[720px]:pt-12">

      <div className="relative z-10 mx-auto w-full max-w-[1280px]">
        <div className="grid grid-cols-[minmax(320px,1.5fr)_minmax(140px,.8fr)_minmax(220px,1.2fr)_minmax(140px,.8fr)] gap-x-8 gap-y-10 pb-12 max-[960px]:grid-cols-2 max-[720px]:gap-x-6 max-[720px]:pb-10 max-[480px]:grid-cols-1">
          {/* Brand */}
          <div className="max-w-[380px]">
            <a
              className="mx-auto flex h-[100px] w-[200px] items-center overflow-hidden no-underline max-[480px]:h-[88px] max-[480px]:w-[176px]"
              href="/"
              aria-label="SCS Academy home"
            >
              <img className="size-[140px] max-w-none object-contain object-center max-[480px]:size-[120px]" src={logoSrc} alt="SCS Academy" />
            </a>

            <p className="mb-0 mt-2 text-left text-sm leading-[1.6] text-[#686674] max-[480px]:text-xs max-[480px]:leading-[1.5]">
              SCS Academy delivers industry-aligned training in BIM and computational design,
              helping architecture, engineering and construction professionals build job-ready
              skills through guided, project-based learning.
            </p>

          </div>

          <FooterColumn title="About" links={aboutLinks} />
          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Legal" links={legalLinks} />

        </div>

        {/* Bottom bar */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-[#e7e5ed] py-6 max-[560px]:grid-cols-1 max-[560px]:justify-items-center max-[560px]:gap-4">
          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 justify-self-start rounded-full border border-[#d9d5e5] bg-white px-4 py-2 text-sm font-semibold text-[#555263] transition-colors duration-200 hover:border-[#a895f4] hover:bg-[#f7f5ff] hover:text-[#49358a] max-[560px]:-translate-x-5 max-[560px]:justify-self-center"
          >
            <ArrowUp size={14} className="transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden="true" />
            Back to top
          </button>
          <small className="text-sm text-[#8e899b] max-[560px]:max-w-[170px] max-[560px]:-translate-x-7">
            © 2026 SCS Academy. All rights reserved.
          </small>
          <span aria-hidden="true" />
        </div>
      </div>
    </footer>
  );
}

export default Footer;