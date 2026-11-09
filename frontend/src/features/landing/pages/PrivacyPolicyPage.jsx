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
  ['Accounts', 'Account sign-in and profile settings are functional. Account identifiers, names, verified phone numbers, profile details, password hashes, OTP challenges, and session records are processed by the application and stored in MongoDB where applicable. OTPs are sent through the configured email or SMS provider.'],
  ['Payments', 'None. The demo has no checkout, billing, or payment processing, and we do not ask for card or bank details anywhere on the site.'],
  ['Enrollment', 'Only a course ID is sent to our API when you use the enrollment demo. It is held in server memory, is not linked to any account, and is cleared whenever the server restarts.'],
  ['Cookies & storage', 'The application stores the sign-in token and basic user details in your browser local storage. Course cart and wishlist data are also stored locally on your device.'],
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
                SCS Academy is a developing platform. Account registration, OTP sign-in, profile settings, and password sign-in are functional and process the information needed for those features. Course catalog and enrollment data remain demo functionality, and checkout is not a completed payment service. Do not submit payment-card details through the site.
              </p>
            </div>

            <PolicySection id="information" number="1" title="Information we handle">
              <p>We handle information needed to operate account features and the learning experience. This includes:</p>
              <ul className="my-0 list-disc space-y-3 pl-5 marker:text-[#8b95ab]">
                <li><strong>Account and profile information:</strong> account identifier, name, optional verified phone number, bio, social links, and uploaded profile photo are processed for account and profile features. User and profile records are stored in MongoDB.</li>
                <li><strong>Authentication and security:</strong> OTP challenges are stored temporarily with an expiry, session token hashes are stored with an expiry, and passwords are stored as derived hashes rather than plaintext. Email and SMS delivery uses the configured SMTP and Twilio providers.</li>
                <li><strong>Course selections:</strong> cart and wishlist contents are stored in your browser's local storage. Enrollment and catalog data are currently demo functionality and may be held in server memory.</li>
                <li><strong>Technical information:</strong> whenever you load any website, your browser and the hosting or network providers involved may process standard connection details, such as your IP address, device and browser information, the pages you request, and timestamps. This processing is a normal part of delivering a website and helps keep the service reliable and protected against abuse.</li>
              </ul>
              <p>Keep your account credentials private. Checkout and payment processing are not currently complete; do not enter payment-card or bank details.</p>
            </PolicySection>

            <PolicySection id="use" number="2" title="How information is used">
              <p>Information handled by the current demo is used for a small number of practical purposes: to display the site, to provide its course and learning interfaces, to respond when you select a course in the enrollment demo, and to support the basic operation and security of the website. We do not use demo enrollment IDs to identify, track, or profile individual learners, and we do not combine them with any other data to build a picture of who you are.</p>
              <p>Account communications may be delivered through configured email and SMS providers. You can update profile information in account settings; account access and stored records are managed by the platform.</p>
            </PolicySection>

            <PolicySection id="sharing" number="3" title="Sharing & third parties">
              <p>We do not sell personal information. The website does load some resources from third parties, including fonts from Google Fonts and images hosted by Unsplash. When your browser requests those resources, the provider may receive technical connection information, such as your IP address, browser details, and the page that requested the resource. That information is handled by the provider under its own privacy policy, which we do not control.</p>
              <p>Our hosting and infrastructure providers may process technical data to deliver the site. SMTP and Twilio receive the contact destination and message content needed to deliver verification codes. The application does not currently process payments.</p>
            </PolicySection>

            <PolicySection id="cookies" number="4" title="Cookies & browser storage">
              <p>The application uses browser local storage for the sign-in token, basic user details, course cart, and wishlist. Clearing local storage signs you out and removes the locally saved cart and wishlist. Your browser may also store cached files, and third-party resources may operate under their own practices.</p><p>You can review or delete site data through your browser settings. Clearing it may affect account sign-in and locally saved course selections.</p>
            </PolicySection>

            <PolicySection id="security" number="5" title="Security & retention">
              <p>Passwords are stored as derived hashes and session tokens are stored as hashes. No method of internet transmission or electronic storage can be guaranteed completely secure. Course catalog and enrollment data remain demo functionality and are not a permanent learner record.</p>
              <p>Technical logs may be retained by hosting or network providers according to their own operational and security needs. We do not control those providers’ retention schedules, so how long such logs are kept depends on their policies rather than on this site.</p>
            </PolicySection>

            <PolicySection id="your-choices" number="6" title="Your choices">
              <p>You can browse public pages without an account. You may update profile details in account settings or clear local browser storage to remove locally saved course selections and sign-in state. Through your browser settings, you may also control stored site data and external resources.</p><p>If you have a question or concern about information handled in connection with this site, you can contact us using the website contact options.</p>
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
