import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, X } from 'lucide-react';

const joinApplicationStyles = `
.join-application-shell {
  position: relative;
  width: min(100%, 780px);
  height: min(590px, calc(100vh - 32px));
  overflow: hidden;
  border: 1px solid #dce2ed;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 80px #11182738, 0 0 0 1px #ffffff80;
  font-family: Manrope, sans-serif;
}
.join-application-shell > button {
  z-index: 5;
  border-color: #ffffff80;
  background: #fff;
  color: #263248;
}
.join-application-shell > div {
  position: relative;
  z-index: 1;
  height: 100%;
}
.join-application-aside {
  position: relative;
  order: 1;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  clip-path: polygon(0 0, 82% 0, 100% 100%, 0 100%);
  background: linear-gradient(135deg, rgb(62 55 82 / 94%) 0%, rgb(31 30 47 / 94%) 100%);
  padding: 18px 58px 26px 34px;
  text-align: left;
}
.join-application-aside > .join-application-brand {
  position: absolute;
  top: 2px;
  left: 4px;
  width: 148px;
  height: 98px;
  object-fit: cover;
  object-position: center;
  text-align: left;
}
.join-application-illustration {
  display: block;
  width: min(100%, 225px);
  height: 205px;
  margin: -2px auto 0;
  object-fit: contain;
}
.join-application-aside-copy {
  width: 250px;
  margin-left: 0;
  text-align: left;
}
.join-application-benefits {
  width: 250px;
  margin: 22px 0 0;
  text-align: left;
}
.join-application-benefits > p {
  justify-content: flex-start;
}
.join-application-form {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  order: 2;
  justify-content: center;
  overflow-y: auto;
  background: #fff;
  color: #1b2233;
}
.join-application-form > h1,
.join-application-form > p,
.join-application-form > div,
.join-application-form > label,
.join-application-form > button {
  max-width: 100%;
}
.join-application-form input,
.join-application-form select,
.join-application-form textarea {
  border-radius: 6px;
}
.join-application-form button[type='button'],
.join-application-form button[type='submit'] {
  border-radius: 7px;
}
@media (min-width: 768px) {
  .join-application-shell > div {
    grid-template-columns: 1.1fr .9fr;
  }
}
@media (max-width: 767px) {
  .join-application-shell {
    height: auto;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }
  .join-application-form {
    min-height: 100%;
  }
}
`;

const applicationSteps = [
  { eyebrow: 'Start your application', title: 'Tell us a little about yourself.' },
  { eyebrow: 'Find your fit', title: 'Where are you in your career?' },
  { eyebrow: 'Your experience', title: 'What does your work look like today?' },
  { eyebrow: 'Your foundation', title: 'Tell us about your education.' },
  { eyebrow: 'Your motivation', title: 'What would you like to achieve?' },
  { eyebrow: 'Your goals', title: 'What are you expecting from this course?' },
];

const experienceOptions = ['Currently studying', '0-1 years', '1-2 years', '2-4 years', '4-8 years', '8-10 years', '10-12 years', '12+ years'];
const qualificationOptions = ['Diploma', 'Associate Degree', "Bachelor's Degree", "Master's Degree", 'Ph.D', 'Others'];
const specializationOptions = ['Architecture', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'];
const expectationOptions = ['Upskilling', 'Getting a new job role', 'Growth in current job', 'Setup/improve my freelancing', 'Setup/improve my business', 'Preparing for higher education', 'Others'];

function ChoiceList({ label, options, value, onChange }) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-bold text-[#6048b7]">{label}<span className="text-[#e85b68]">*</span></legend>
      <div className="mt-2 grid gap-2">
        {options.map((option) => (
          <label key={option} className={`flex min-h-10 cursor-pointer items-center rounded-none border px-4 text-[13px] transition-colors ${value === option ? 'border-[#7c5cff] bg-[#e8e2ff] text-[#49358a]' : 'border-[#d7dbe6] bg-white text-[#24324b] hover:border-[#9b88ed]'}`}>
            <input className="sr-only" type="radio" name={label} value={option} checked={value === option} onChange={(event) => onChange(event.target.value)} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function JoinApplication({ onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', experience: '', specialization: '',
    qualification: '', college: '', company: '', role: '', sop: '', expectation: '',
    linkedin: '', cv: null, consent: false,
  });
  const [error, setError] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const next = () => {
    setError('');
    if (step === 0 && (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.specialization || !form.consent)) {
      setError('Please complete all required fields to continue.');
      return;
    }
    if (step === 1 && !form.experience) return setError('Please select your work experience.');
    if (step === 2 && form.experience !== 'Currently studying' && (!form.company.trim() || !form.role.trim())) return setError('Please add your company and job role.');
    if (step === 3 && form.experience !== 'Currently studying' && (!form.qualification || !form.college.trim())) return setError('Please add your qualification and college.');
    if (step === 2 && form.experience === 'Currently studying' && (!form.qualification || !form.college.trim())) return setError('Please add your qualification and college.');
    if (step === 4 && form.sop.trim().length < 50) return setError('Please write at least 50 characters about your goals.');
    if (step === 5 && !form.expectation) return setError('Please select one expectation.');
    if (step === 5) {
      setShowAdditionalDetails(true);
      return;
    }
    setStep((current) => current + (current === 2 && form.experience === 'Currently studying' ? 2 : 1));
  };
  const submit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    onComplete('Your application has been received. Our counsellor will contact you within 24 working hours.');
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] grid min-h-full place-items-center overflow-y-auto bg-[#10101b33] p-4 backdrop-blur-md">
        <section className="relative w-full max-w-[460px] rounded-none bg-[#f7f5ff] p-6 text-center shadow-[0_24px_90px_#0008] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="application-success">
          <button className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[#d9d4eb] text-[#555263]" onClick={onClose} aria-label="Close application"><X size={17} /></button>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#d9fff4] text-[#188c75]"><Check size={30} /></div>
          <h2 id="application-success" className="mt-6 font-[Manrope] text-2xl font-bold text-[#24232d]">We received your details!</h2>
          <p className="mt-3 text-sm leading-6 text-[#686674]">Our academic counsellor will reach out to you within <strong className="text-[#6048b7]">24 working hours</strong>.</p>
          <a className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-none bg-[#6048b7] px-6 text-sm font-bold text-white transition-colors hover:bg-[#49358a]" href="https://wa.me/?text=Hi%2C%20I%20have%20just%20submitted%20my%20SCS%20Academy%20application." target="_blank" rel="noreferrer">Message us on WhatsApp <ArrowRight size={16} /></a>
          <button className="mt-5 block w-full text-sm font-semibold text-[#6048b7]" onClick={onClose}>Close</button>
        </section>
      </div>
    );
  }

  if (showAdditionalDetails) {
    return (
      <div className="fixed inset-0 z-[60] grid min-h-full place-items-center overflow-y-auto bg-[#10101b33] p-4 backdrop-blur-md sm:p-8">
        <section className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-none bg-[#f7f5ff] p-5 shadow-[0_24px_90px_#0008] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="additional-details-title">
          <div className="h-1.5 absolute inset-x-0 top-0 bg-[#6048b7]" />
          <button className="absolute right-4 top-5 grid size-9 place-items-center rounded-full border border-[#d9d4eb] bg-white/80 text-[#555263]" onClick={onClose} aria-label="Close application"><X size={17} /></button>
          <div className="mt-4 rounded-none bg-white px-5 py-5 text-center shadow-[0_8px_24px_#6048b714]">
            <div className="mx-auto mb-3 flex h-9 max-w-[190px] items-center justify-center gap-2 text-[#6048b7]" aria-hidden="true">
              <span className="h-2 w-2 rotate-45 bg-[#7ae8d5]" /><span className="h-3 w-1 bg-[#ffb39c]" /><span className="h-2 w-2 rotate-45 bg-[#6048b7]" /><span className="h-3 w-1 rotate-45 bg-[#f2c94c]" /><span className="h-2 w-2 rotate-45 bg-[#7ae8d5]" />
            </div>
            <h2 className="m-0 font-[Manrope] text-lg font-bold text-[#4c5872]">We have received your details!</h2>
            <p className="mb-0 mt-2 text-sm leading-6 text-[#68748b]">Our academic counsellor will reach out to you within next <strong className="text-[#6048b7]">24 hours</strong> between <strong className="text-[#6048b7]">10AM - 10PM IST</strong>.</p>
          </div>
          <div className="mt-8 text-center">
            <p className="mb-1 text-sm font-semibold text-[#6048b7]">Increase your chances of selection</p>
            <h2 id="additional-details-title" className="m-0 font-[Manrope] text-xl font-bold leading-tight text-[#24232d]">by providing a few additional details</h2>
          </div>
          <div className="mt-6 grid gap-5">
            <label className="text-sm font-bold text-[#6048b7]">Your LinkedIn profile<span className="mt-2 block"><input className="h-12 w-full rounded-none border border-[#d7dbe6] bg-white px-4 text-sm font-normal text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" type="url" value={form.linkedin} onChange={(event) => update('linkedin', event.target.value)} placeholder="Your LinkedIn profile" /></span></label>
            <label className="text-sm font-bold text-[#6048b7]">Your updated CV<span className="mt-2 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-none border border-dashed border-[#9b88ed] bg-white px-4 text-sm font-semibold text-[#6048b7]"><ArrowUpRight size={16} />Upload<input className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => update('cv', event.target.files?.[0] || null)} /></span><span className="mt-1 block text-xs font-normal text-[#686674]">{form.cv ? form.cv.name : 'DOC, DOCX, PDF (Max 2 MB)'}</span></label>
          </div>
          <button className="mt-7 min-h-12 w-full rounded-none bg-[#151420] text-sm font-bold text-white transition-colors hover:bg-[#6048b7]" type="button" onClick={submit}>Submit <ArrowRight className="ml-2 inline" size={16} /></button>
          <button className="mx-auto mt-5 block text-sm font-semibold text-[#6048b7]" type="button" onClick={onClose}>Not now</button>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] grid min-h-full place-items-center overflow-y-auto bg-[#10101b33] p-4 backdrop-blur-md sm:p-8">
      <style>{joinApplicationStyles}</style>
      <section className="join-application-shell relative mx-auto" role="dialog" aria-modal="true" aria-labelledby="join-application-title">
        <button className="absolute right-4 top-5 z-10 grid size-9 place-items-center rounded-full border border-[#d9d4eb] bg-white/80 text-[#555263]" onClick={onClose} aria-label="Close application"><X size={17} /></button>
        <div className="grid md:grid-cols-[.8fr_1.2fr]">
          <aside className="join-application-aside hidden text-white md:flex">
            <img className="join-application-brand" src="/images/logo.png" alt="SCS Academy" />
            <img className="join-application-illustration" src="/videos/Login.svg" alt="" aria-hidden="true" />
            <div className="join-application-aside-copy">
              <h2 className="m-0 font-[Manrope] text-[22px] font-bold leading-tight">Build skills that move your career forward.</h2>
              <p className="mt-3 text-xs leading-5 text-[#bdb8cd]">A short application helps us understand your goals and recommend the right learning path.</p>
            </div>
            <div className="join-application-benefits space-y-3 text-[13px] text-[#cbc6d7]">
              {['Expert-led live training', 'Real AEC projects', 'Personalised career guidance'].map((item) => <p className="flex items-center gap-3" key={item}><span className="grid size-5 place-items-center rounded-full bg-[#6048b7] text-xs text-white">✓</span>{item}</p>)}
            </div>
          </aside>
          <form className="join-application-form p-6 sm:p-9" onSubmit={submit}>
            {step < 6 ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6048b7]">{step === 2 && form.experience === 'Currently studying' ? 'Your foundation' : applicationSteps[step].eyebrow}</p>
                <h1 id="join-application-title" className="mt-2 max-w-[430px] font-[Manrope] text-[26px] font-bold leading-tight text-[#1b2233]">{step === 2 && form.experience === 'Currently studying' ? 'Tell us about your education.' : applicationSteps[step].title}</h1>
              </>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6048b7]">Almost there</p>
                <h1 id="join-application-title" className="mt-2 font-[Manrope] text-2xl font-bold leading-tight text-[#24232d]">Increase your chances of selection.</h1>
                <p className="mt-2 text-sm text-[#686674]">You can optionally share a LinkedIn profile or CV with our counsellor.</p>
              </>
            )}

            {step === 0 && <div className="mt-5 grid gap-3">
              <input className="h-10 rounded-none border border-[#d7dbe6] bg-white px-3 text-[13px] text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" placeholder="Full name*" value={form.name} onChange={(event) => update('name', event.target.value)} />
              <input className="h-10 rounded-none border border-[#d7dbe6] bg-white px-3 text-[13px] text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" placeholder="Phone number*" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
              <input className="h-10 rounded-none border border-[#d7dbe6] bg-white px-3 text-[13px] text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" placeholder="Email address*" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
              <select className="h-10 rounded-none border border-[#d7dbe6] bg-white px-3 text-[13px] text-[#24324b] outline-none focus:border-[#6048b7]" value={form.specialization} onChange={(event) => update('specialization', event.target.value)}><option value="">Specialisation*</option>{specializationOptions.map((option) => <option key={option}>{option}</option>)}</select>
              <label className="flex items-start gap-2 text-xs leading-5 text-[#686674]"><input className="mt-1 accent-[#6048b7]" type="checkbox" checked={form.consent} onChange={(event) => update('consent', event.target.checked)} />I agree to be contacted by SCS Academy about suitable programs.</label>
            </div>}
            {step === 1 && <ChoiceList label="Your work experience" options={experienceOptions} value={form.experience} onChange={(value) => update('experience', value)} />}
            {step === 2 && form.experience !== 'Currently studying' && <div className="mt-7 grid gap-5"><label className="text-sm font-bold text-[#6048b7]">Current or recent company name*<input className="mt-2 h-12 w-full rounded-none border border-[#d7dbe6] bg-white px-4 text-sm font-normal text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" value={form.company} onChange={(event) => update('company', event.target.value)} placeholder="Company name" /></label><label className="text-sm font-bold text-[#6048b7]">Current or recent job role*<input className="mt-2 h-12 w-full rounded-none border border-[#d7dbe6] bg-white px-4 text-sm font-normal text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" value={form.role} onChange={(event) => update('role', event.target.value)} placeholder="Job role" /></label></div>}
            {((step === 2 && form.experience === 'Currently studying') || step === 3) && <div className="mt-5 grid gap-5"><ChoiceList label="Your highest qualification" options={qualificationOptions} value={form.qualification} onChange={(value) => update('qualification', value)} /><input className="h-12 rounded-none border border-[#aab4ca] bg-white px-4 text-sm text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" placeholder="Your college name*" value={form.college} onChange={(event) => update('college', event.target.value)} /></div>}
            {step === 4 && <label className="mt-7 block text-sm font-bold leading-6 text-[#6048b7]">Why do you want to take this course and how will it impact your career?*<textarea className="mt-3 min-h-40 w-full resize-y rounded-none border border-[#d7dbe6] bg-white p-4 text-sm font-normal leading-6 text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" maxLength={500} value={form.sop} onChange={(event) => update('sop', event.target.value)} placeholder="Write your statement of purpose (minimum 50 characters)" /><span className="mt-1 block text-right text-xs font-normal text-[#8b8796]">{form.sop.length}/500</span></label>}
            {step === 5 && <ChoiceList label="Your expectations from this course" options={expectationOptions} value={form.expectation} onChange={(value) => update('expectation', value)} />}
            {step === 6 && (
              <>
                <div className="mt-7 rounded-none bg-white px-5 py-5 text-center shadow-[0_8px_24px_#6048b714]">
                  <div className="mx-auto mb-3 flex h-9 max-w-[190px] items-center justify-center gap-2 overflow-hidden text-[#6048b7]" aria-hidden="true">
                    <span className="h-2 w-2 rotate-45 bg-[#7ae8d5]" />
                    <span className="h-3 w-1 bg-[#ffb39c]" />
                    <span className="h-2 w-2 rotate-45 bg-[#6048b7]" />
                    <span className="h-3 w-1 rotate-45 bg-[#f2c94c]" />
                    <span className="h-2 w-2 rotate-45 bg-[#7ae8d5]" />
                  </div>
                  <h2 className="m-0 font-[Manrope] text-lg font-bold text-[#4c5872]">We have received your details!</h2>
                  <p className="mb-0 mt-2 text-sm leading-6 text-[#68748b]">
                    Our academic counsellor will reach out to you within next <strong className="text-[#6048b7]">24 hours</strong> between <strong className="text-[#6048b7]">10AM - 10PM IST</strong>.
                  </p>
                </div>
                <div className="mt-8 text-center">
                  <p className="mb-1 text-sm font-semibold text-[#6048b7]">Increase your chances of selection</p>
                  <h2 className="m-0 font-[Manrope] text-xl font-bold leading-tight text-[#24232d]">by providing a few additional details</h2>
                </div>
                <div className="mt-6 grid gap-5">
                  <label className="text-sm font-bold text-[#6048b7]">
                    Your LinkedIn profile
                    <span className="mt-2 block">
                      <input className="h-12 w-full rounded-lg border border-[#d7dbe6] bg-white px-4 text-sm font-normal text-[#24324b] outline-none placeholder:text-[#8994a4] focus:border-[#6048b7]" type="url" value={form.linkedin} onChange={(event) => update('linkedin', event.target.value)} placeholder="Your LinkedIn profile" />
                    </span>
                  </label>
                  <label className="text-sm font-bold text-[#6048b7]">
                    Your updated CV
                    <span className="mt-2 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#9b88ed] bg-white px-4 text-sm font-semibold text-[#6048b7]">
                      <ArrowUpRight size={16} />
                      Upload
                      <input className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => update('cv', event.target.files?.[0] || null)} />
                    </span>
                    <span className="mt-1 block text-xs font-normal text-[#686674]">{form.cv ? form.cv.name : 'DOC, DOCX, PDF (Max 2 MB)'}</span>
                  </label>
                </div>
              </>
            )}

            {error && <p className="mt-4 text-sm font-semibold text-[#d84d5a]" role="alert">{error}</p>}
            <div className="mt-5 flex items-center gap-2">
              {step > 0 && <button className="min-h-10 flex-1 rounded-none border border-[#cfd4e0] text-[13px] font-bold text-[#4c5060] transition-colors hover:bg-white" type="button" onClick={() => { setError(''); setStep((current) => current - 1); }}>Back</button>}
              <button className="min-h-10 flex-1 rounded-none bg-[#151420] text-[13px] font-bold text-white transition-colors hover:bg-[#6048b7]" type={step === 6 ? 'submit' : 'button'} onClick={step === 6 ? undefined : next}>{step === 6 ? 'Submit application' : 'Next'} <ArrowRight className="ml-2 inline" size={15} /></button>
            </div>
            {step === 6 && <button className="mx-auto mt-5 block text-sm font-semibold text-[#6048b7]" type="button" onClick={onClose}>Not now</button>}
            <p className="mt-3 text-center text-[11px] text-[#8b8796]">Step {step + 1} of 7</p>
          </form>
        </div>
      </section>
    </div>
  );
}


export default JoinApplication;

