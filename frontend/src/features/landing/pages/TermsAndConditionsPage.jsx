import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

const sections = [
  { id: 'acceptance', label: 'Agreement to these terms' },
  { id: 'the-platform', label: 'The platform' },
  { id: 'accounts', label: 'Accounts & eligibility' },
  { id: 'courses', label: 'Courses & enrollment' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'content', label: 'Content & intellectual property' },
  { id: 'third-parties', label: 'Third-party services' },
  { id: 'availability', label: 'Availability & disclaimers' },
  { id: 'liability', label: 'Limitation of liability' },
  { id: 'changes', label: 'Changes & contact' },
];

const quickFacts = [
  ['Platform', 'SCS Academy is currently a demonstration training platform.'],
  ['Accounts', 'Login and join forms are demos and do not create accounts.'],
  ['Enrollment', 'Demo enrollments are temporary and stored in server memory.'],
  ['Payments', 'The platform does not currently process payments or checkout.'],
  ['Course material', 'Use platform content for personal, non-commercial learning.'],
  ['Privacy', 'See the Privacy Policy for details about information handling.'],
];

function TermsSection({ id, number, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[#dde2ea] py-10 first:border-t-0 first:pt-0">
      <h2 className="m-0 mb-4 flex items-baseline gap-3 font-['Source_Serif_4',Georgia,serif] text-[26px] font-semibold leading-tight tracking-[-.01em] text-[#1b2233]">
        <span className="w-6 shrink-0 font-['DM_Sans',sans-serif] text-sm font-medium tabular-nums text-[#2347a8]">{number}</span>
        {title}
      </h2>
      <div className="space-y-4 font-['Source_Serif_4',Georgia,serif] text-[17px] leading-[1.75] text-[#3c4558] sm:pl-9 [&_strong]:font-semibold [&_strong]:text-[#1b2233]">
        {children}
      </div>
    </section>
  );
}

function TermsAndConditionsPage() {
  const [active, setActive] = useState(sections[0].id);
  const [revealedSections, setRevealedSections] = useState(() => new Set());

  useEffect(() => {
    const targets = sections.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive(visible[0].target.id);
        },
        { rootMargin: '-90px 0px -65% 0px', threshold: 0 },
      )
      : null;
    targets.forEach((target) => observer?.observe(target));

    const revealScrolledSections = () => {
      if (window.scrollY <= 80) return;
      const passedSections = sections
        .filter(({ id }) => {
          const section = document.getElementById(id);
          return section && section.getBoundingClientRect().top <= window.innerHeight * 0.8;
        })
        .map(({ id }) => id);
      if (passedSections.length) {
        setRevealedSections((previous) => {
          const next = new Set(previous);
          passedSections.forEach((id) => next.add(id));
          return next.size === previous.size ? previous : next;
        });
      }
    };

    window.addEventListener('scroll', revealScrolledSections, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', revealScrolledSections);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-['DM_Sans',_sans-serif] text-[#1b2233]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
      />

      <div className="relative h-[72px] bg-[#151420] max-[720px]:h-[62px]">
        <Navbar onAuth={(mode) => window.location.assign(mode === 'join' ? '/?join=1' : '/login')} />
      </div>

      <main>
        <section className="border-b border-[#dde2ea] bg-white">
          <div className="mx-auto grid max-w-[1160px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
            <div>
              <h1 className="m-0 font-['Source_Serif_4',Georgia,serif] text-[clamp(2.4rem,5.5vw,3.9rem)] font-bold leading-[1.06] tracking-[-.02em] text-[#1b2233]">
                Terms &amp; Conditions
              </h1>
              <p className="mb-0 mt-5 max-w-[34rem] font-['Source_Serif_4',Georgia,serif] text-lg leading-8 text-[#3c4558]">
                These terms explain the basic rules for accessing and using the SCS Academy website, courses, and learning features.
              </p>
              <p className="mb-0 mt-8 text-sm text-[#5a6275]">
                Effective November 4, 2026. Applies to the SCS Academy website and current learning demo.
              </p>
            </div>

            <div>
              <h2 className="m-0 mb-1 text-base font-semibold text-[#1b2233]">At a glance</h2>
              <dl className="m-0 divide-y divide-[#e4e8ee] border-y border-[#dde2ea]">
                {quickFacts.map(([term, detail]) => (
                  <div key={term} className="grid grid-cols-[116px_1fr] gap-4 py-3 text-sm leading-6">
                    <dt className="font-semibold text-[#1b2233]">{term}</dt>
                    <dd className="m-0 text-[#4a5368]">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1160px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-20">
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <nav aria-label="Terms and conditions contents">
              <p className="m-0 mb-3 text-sm font-semibold text-[#1b2233]">Contents</p>
              <ul className="m-0 grid list-none gap-x-6 p-0 sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-[#dde2ea]">
                {sections.map(({ id, label }) => {
                  const isActive = active === id;
                  const isRevealed = revealedSections.has(id);
                  return (
                    <li
                      key={id}
                      aria-hidden={!isRevealed}
                      className={`transform transition-all duration-500 ease-out motion-reduce:transition-none ${
                        isRevealed ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
                      }`}
                    >
                      <a
                        href={`#${id}`}
                        aria-current={isActive ? 'true' : undefined}
                        tabIndex={isRevealed ? undefined : -1}
                        className={`-ml-px block py-1.5 text-[14px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2347a8] lg:border-l-2 lg:pl-4 ${
                          isActive
                            ? 'font-semibold text-[#2347a8] lg:border-[#2347a8]'
                            : 'text-[#5a6275] hover:text-[#1b2233] lg:border-transparent'
                        }`}
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 max-w-[700px]">
            <div className="mb-12 border-l-4 border-[#2347a8] bg-[#e9eefa] px-5 py-4">
              <h2 className="m-0 text-base font-semibold text-[#1b2233]">Please note: this is a demo</h2>
              <p className="mb-0 mt-1.5 text-[15px] leading-7 text-[#3c4558]">
                SCS Academy is currently a demonstration platform. Sign-in and sign-up forms do not create accounts, and checkout and payment features are not connected. Course enrollment is temporary demo functionality. Do not rely on the demo as a permanent learner record or submit real passwords or payment details.
              </p>
            </div>

            <TermsSection id="acceptance" number="1" title="Agreement to these terms">
              <p>By accessing or using the SCS Academy website, you agree to follow these Terms &amp; Conditions and applicable laws. If you do not agree, do not use the website. These terms apply to the services and features currently available, including demonstration features.</p>
            </TermsSection>

            <TermsSection id="the-platform" number="2" title="The platform">
              <p>SCS Academy provides information about training and learning in areas such as BIM and computational design. The current website includes course and learning interfaces for demonstration purposes. Features, course descriptions, schedules, prices, imagery, and other materials shown on the site may be illustrative and should not be treated as a confirmed offer or guarantee of availability.</p>
              <p>We may add, change, suspend, or remove site features as the platform develops. We will make reasonable efforts to keep public information useful, but we do not promise that every page or feature will always be available or error-free.</p>
            </TermsSection>

            <TermsSection id="accounts" number="3" title="Accounts & eligibility">
              <p>The sign-in and join forms currently shown on the website are visual demonstrations only. They do not create or authenticate an account. Do not enter a real password or other sensitive information into these forms.</p>
              <p>If account features are introduced later, additional terms may apply. You will be responsible for providing accurate information and protecting your account credentials once real accounts are available.</p>
            </TermsSection>

            <TermsSection id="courses" number="4" title="Courses & enrollment">
              <p>Course enrollment is currently a demo. If you use it, a course selection is sent to the platform API and held in server memory; it is not linked to a learner account and may be cleared when the server restarts. It does not reserve a place in a real course or establish a paid enrollment.</p>
              <p>The current demo has no checkout or payment processing. Do not send card, bank, or payment information through the site. Any future course purchase, cancellation, or refund terms will be presented separately before a real transaction is offered.</p>
            </TermsSection>

            <TermsSection id="acceptable-use" number="5" title="Acceptable use">
              <p>Use the site lawfully and in a way that does not interfere with other people or the operation of the platform. You must not attempt to gain unauthorized access to systems or data, disrupt the website, introduce malicious code, misuse any feature, or use automated means to overload or copy the service without permission.</p>
              <p>You are responsible for activity you carry out through the website and for ensuring that any information you submit is appropriate and lawful.</p>
            </TermsSection>

            <TermsSection id="content" number="6" title="Content & intellectual property">
              <p>The website’s text, design, branding, graphics, videos, and other materials are owned by SCS Academy or used with permission, unless indicated otherwise. You may view and use the website for personal, non-commercial learning and evaluation.</p>
              <p>Except where the law permits or we have given prior written permission, you must not reproduce, republish, distribute, sell, modify, or create derivative works from website materials. Course materials may have additional terms when formal courses become available.</p>
            </TermsSection>

            <TermsSection id="third-parties" number="7" title="Third-party services">
              <p>The website may include links to third-party websites or load resources from external providers. Those services are operated independently and may have their own terms and privacy practices. We do not control or endorse third-party services and are not responsible for their content or availability.</p>
            </TermsSection>

            <TermsSection id="availability" number="8" title="Availability & disclaimers">
              <p>The website and demo features are provided on an “as is” and “as available” basis. To the extent allowed by applicable law, we do not make warranties that the site will be uninterrupted, secure, error-free, or suitable for a particular purpose. Information and learning materials are general in nature and are not a guarantee of academic, certification, or career outcomes.</p>
            </TermsSection>

            <TermsSection id="liability" number="9" title="Limitation of liability">
              <p>To the extent permitted by applicable law, SCS Academy will not be liable for indirect, incidental, special, consequential, or punitive loss, or loss of data, profits, or opportunities arising from your use of or inability to use the demonstration website. Nothing in these terms excludes liability that cannot lawfully be excluded or limited.</p>
            </TermsSection>

            <TermsSection id="changes" number="10" title="Changes & contact">
              <p>We may update these terms as the platform or its features change. The effective date above identifies this version. Continued use of the website after updated terms are published means you accept the updated terms, to the extent permitted by applicable law.</p>
              <p>For questions about these terms, use the contact options published on the official SCS Academy website. Please do not send passwords, payment information, or other sensitive details through a general contact channel. For information about data handling, read our <a className="font-semibold text-[#2347a8] underline underline-offset-2 hover:text-[#17347f]" href="/privacy-policy">Privacy Policy</a>.</p>
            </TermsSection>

            <p className="mb-0 mt-4 border-t border-[#dde2ea] pt-6 text-[13px] leading-6 text-[#6b7387]">
              These terms describe the current demonstration website and are not legal advice. Have them reviewed and adapted to your organization and applicable laws before launching production services.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default TermsAndConditionsPage;
