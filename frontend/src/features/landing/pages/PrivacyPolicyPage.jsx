import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

const sections = [
  { id: 'information', label: 'Information we handle' },
  { id: 'use', label: 'How information is used' },
  { id: 'sharing', label: 'Sharing & third parties' },
  { id: 'cookies', label: 'Cookies & browser storage' },
  { id: 'security', label: 'Security & retention' },
  { id: 'your-choices', label: 'Your choices' },
  { id: 'children', label: 'Children’s privacy' },
  { id: 'changes', label: 'Policy updates' },
  { id: 'contact', label: 'Contact' },
];

const quickFacts = [
  ['Accounts', 'Sign-in and join forms are illustrative only. They are not connected to any authentication service, so nothing you type into them, including your email address or password, is sent to or stored by us.'],
  ['Payments', 'None. The demo has no checkout, billing, or payment processing, and we do not ask for card or bank details anywhere on the site.'],
  ['Enrollment', 'Only a course ID is sent to our API when you use the enrollment demo. It is held in server memory, is not linked to any account, and is cleared whenever the server restarts.'],
  ['Cookies & storage', 'The application does not intentionally set cookies or use local or session storage. Your browser may still keep standard technical data on its own.'],
  ['Selling data', 'We do not sell personal information, and the demo has no advertising or analytics service that would receive it.'],
  ['Third-party resources', 'Google Fonts and Unsplash images load directly from their own servers, which may receive your IP address and browser details under their own privacy policies.'],
];

function PolicySection({ id, number, title, children }) {
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

function PrivacyPolicyPage() {
  const [active, setActive] = useState(sections[0].id);
  const [revealedSections, setRevealedSections] = useState(() => new Set());

  useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
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

      <Navbar />

      <main>
        {/* Intro: headline on the left, the policy's short answers on the right */}
        <section className="border-b border-[#dde2ea] bg-white">
          <div className="mx-auto grid max-w-[1160px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
            <div>
              <h1 className="m-0 font-['Source_Serif_4',Georgia,serif] text-[clamp(2.4rem,5.5vw,3.9rem)] font-bold leading-[1.06] tracking-[-.02em] text-[#1b2233]">
                Privacy policy
              </h1>
              <p className="mb-0 mt-5 max-w-[34rem] font-['Source_Serif_4',Georgia,serif] text-lg leading-8 text-[#3c4558]">
                This policy explains what information SCS Academy’s learning platform handles, why it is handled, who else may receive technical data when you visit, how long anything is kept, and the choices you have while using the site.
              </p>
              <p className="mb-0 mt-8 text-sm text-[#5a6275]">
                Effective November 4, 2026. Applies to the SCS Academy website and learning demo, including its public pages, course and learning interfaces, and the demo enrollment feature.
              </p>
            </div>

            <div>
              <h2 className="m-0 mb-1 text-base font-semibold text-[#1b2233]">Short answers</h2>
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
            <nav aria-label="Privacy policy contents">
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
              <h2 className="m-0 text-base font-semibold text-[#1b2233]">A note about this demo</h2>
              <p className="mb-0 mt-1.5 text-[15px] leading-7 text-[#3c4558]">
                SCS Academy is currently a demonstration platform. The sign-in and sign-up forms are for illustration only: they do not create accounts, and the details you type into them are not sent to us. Course enrollment is also a demo and stores only a course ID, temporarily, in server memory, where it is not tied to any person. Because nothing here is built to protect real credentials, please do not enter real passwords, payment details, or other sensitive personal information anywhere on the site.
              </p>
            </div>

            <PolicySection id="information" number="1" title="Information we handle">
              <p>We aim to handle only the minimum information needed to show and operate the learning experience, and we have deliberately kept the demo simple. In the current demo, the information involved is limited to the following:</p>
              <ul className="my-0 list-disc space-y-3 pl-5 marker:text-[#8b95ab]">
                <li><strong>Course selections:</strong> if you use the enrollment demo, the ID of the course you select is sent to our API so the demo can respond to your choice. The demo keeps this enrollment state only in server memory. It is not linked to a name, email address, or account, it is not written to a permanent database, and it is cleared whenever the server restarts.</li>
                <li><strong>Sign-in form entries:</strong> the visible sign-in and join forms are illustrative only. They are not connected to an authentication service, and they do not submit your name, email address, or password to our application. Whatever you type into those fields stays in your own browser and is not received or stored by us.</li>
                <li><strong>Technical information:</strong> whenever you load any website, your browser and the hosting or network providers involved may process standard connection details, such as your IP address, device and browser information, the pages you request, and timestamps. This processing is a normal part of delivering a website and helps keep the service reliable and protected against abuse.</li>
              </ul>
              <p>Please do not submit sensitive information through any demo interface. The demo does not currently provide a functioning learner account, checkout, or payment processing, so there is no feature on the site that needs your financial, identity, or login details.</p>
            </PolicySection>

            <PolicySection id="use" number="2" title="How information is used">
              <p>Information handled by the current demo is used for a small number of practical purposes: to display the site, to provide its course and learning interfaces, to respond when you select a course in the enrollment demo, and to support the basic operation and security of the website. We do not use demo enrollment IDs to identify, track, or profile individual learners, and we do not combine them with any other data to build a picture of who you are.</p>
              <p>If we introduce real accounts, communications, or paid services in the future, this policy will be updated before those features are offered, so that you can see exactly what data would be involved, why it would be needed, and how you could control it.</p>
            </PolicySection>

            <PolicySection id="sharing" number="3" title="Sharing & third parties">
              <p>We do not sell personal information. The website does load some resources from third parties, including fonts from Google Fonts and images hosted by Unsplash. When your browser requests those resources, the provider may receive technical connection information, such as your IP address, browser details, and the page that requested the resource. That information is handled by the provider under its own privacy policy, which we do not control.</p>
              <p>Our hosting and infrastructure providers may also process technical data as needed to deliver the site and keep it secure. We do not currently have an integrated advertising, analytics, account, or payment service in this demo, so no such third party receives information through the application itself.</p>
            </PolicySection>

            <PolicySection id="cookies" number="4" title="Cookies & browser storage">
              <p>The current application code does not intentionally set cookies, and it does not use browser local storage or session storage for tracking or to hold account data. Even so, your browser may still store standard technical information, such as cached files, and infrastructure or third-party resources, like the fonts and images mentioned above, may operate under their own practices.</p><p>You can review, block, or delete cookies and other site data at any time through your browser settings. Doing so will not affect your ability to browse the public pages of this demo.</p>
            </PolicySection>

            <PolicySection id="security" number="5" title="Security & retention">
              <p>We take reasonable steps appropriate to this demo to avoid unnecessary data handling, and the simplest protection is that we collect very little in the first place. However, no method of internet transmission or electronic storage can be guaranteed to be completely secure. The demo is not designed for confidential information, and its in-memory enrollment state is temporary: it exists only while the server is running and is not a permanent learner record.</p>
              <p>Technical logs may be retained by hosting or network providers according to their own operational and security needs. We do not control those providers’ retention schedules, so how long such logs are kept depends on their policies rather than on this site.</p>
            </PolicySection>

            <PolicySection id="your-choices" number="6" title="Your choices">
              <p>You can browse the public pages without creating an account, and you are not required to use the enrollment demo. Please do not enter real credentials in the demo sign-in or join forms. Through your browser settings, you may also control cookies, stored site data, and whether external resources such as fonts and images are loaded, for example by using content-blocking features or extensions.</p><p>If you have a question or concern about information handled in connection with this site, you can contact us using the website contact options.</p>
            </PolicySection>

            <PolicySection id="children" number="7" title="Children’s privacy">
              <p>This professional training platform is intended for people seeking education and career development, not for children. The demo is not designed to knowingly collect personal information from children, and it does not ask for personal details such as names, ages, or contact information. If you believe a child has provided personal information through a functioning feature, please contact us so we can review the matter and take appropriate action.</p>
            </PolicySection>

            <PolicySection id="changes" number="8" title="Policy updates">
              <p>We may update this policy from time to time as the platform and its features change, or to reflect improvements in how we describe our practices. The effective date at the top of this page shows when this version was last revised, so please check it if you return to the site. If a significant change is made, we will take reasonable steps to make the updated policy clearly visible on this page.</p>
            </PolicySection>

            <PolicySection id="contact" number="9" title="Contact">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </PolicySection>

            <p className="mb-0 mt-4 border-t border-[#dde2ea] pt-6 text-[13px] leading-6 text-[#6b7387]">
              This page describes the current demonstration website and is not a substitute for legal advice. It should be reviewed and adapted to your organization and to the laws that apply to you before any production features are launched.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage;
