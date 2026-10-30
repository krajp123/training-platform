import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2,
  GraduationCap, Palette, Play, Sparkles, Star, Video, X,
} from 'lucide-react';
import '../styles/home.css';
import Navbar from '../components/layout/Navbar.jsx';
import { getJson } from '../services/api.js';

const featuredCourses = [
  {
    title: 'UI/UX Design Fundamentals',
    category: 'DESIGN',
    duration: '8 weeks',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=85',
    tone: 'violet',
  },
  {
    title: 'Full Stack Web Development',
    category: 'DEVELOPMENT',
    duration: '12 weeks',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85',
    tone: 'teal',
  },
  {
    title: 'Data Science with Python',
    category: 'DATA SCIENCE',
    duration: '10 weeks',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=85',
    tone: 'pink',
  },
];

const benefits = [
  {
    icon: Palette,
    title: 'Learn by doing',
    text: 'Work on real-world projects that turn new knowledge into practical skills.',
    tone: 'mint',
  },
  {
    icon: Video,
    title: 'Learn with experts',
    text: 'Get guidance, thoughtful feedback, and live sessions with industry mentors.',
    tone: 'violet',
  },
  {
    icon: ArrowDownRight,
    title: 'Build your next chapter',
    text: 'Create a portfolio of work and skills that help move your career forward.',
    tone: 'coral',
  },
];

function HomePage() {
  const [courses, setCourses] = useState(featuredCourses);
  const [authMode, setAuthMode] = useState('');
  const [notice, setNotice] = useState('');
  const [apiUnavailable, setApiUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    getJson('/api/courses')
      .then((catalog) => {
        if (active && catalog.length) {
          setCourses(catalog.slice(0, 3).map((course, index) => ({
            title: course.title,
            category: course.category.toUpperCase(),
            duration: course.duration,
            rating: course.rating,
            image: course.image,
            tone: ['violet', 'teal', 'pink'][index % 3],
          })));
        }
      })
      .catch(() => {
        if (active) setApiUnavailable(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const submitAuth = (event) => {
    event.preventDefault();
    setAuthMode('');
    setNotice('Login and account creation will be connected when authentication is added.');
  };

  return (
    <div className="marketing-page">
      <Navbar onAuth={setAuthMode} />

      <main>
        <section className="landing-hero">
          <video
            className="hero-background-video"
            src="/Hero-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-content">
            <h1>Become the <span>architect</span> of ideas<br />and the <span>engineer</span> of<br className="hero-heading-break" /> innovation.</h1>
            <p className="hero-description">Practical courses. Real projects. People who want to see you grow. Build skills for a career that feels like yours.</p>
            <div className="hero-actions">
              <a className="hero-primary" href="#courses">Find your course <ArrowRight size={17} /></a>
              <a className="hero-secondary" href="#how-it-works"><span><Play size={13} fill="currentColor" /></span> See how it works</a>
            </div>
          </div>
          <a href="#courses" className="hero-scroll"><span /> SCROLL TO EXPLORE <ChevronDown size={13} /></a>
          <div className="hero-index">SKILLPATH / 2026</div>
        </section>

        <section className="trust-strip" aria-label="Learner outcomes">
          <p>GOOD THINGS HAPPEN WHEN YOU KEEP LEARNING</p>
          <div className="trust-stats"><div><strong>12k<span>+</span></strong><span>curious learners</span></div><i /><div><strong>40<span>+</span></strong><span>expert-led courses</span></div><i /><div><strong>92<span>%</span></strong><span>finish what they start</span></div><i /><div className="trust-partner">BUILT FOR <strong>WHAT'S NEXT <ArrowUpRight size={13} /></strong></div></div>
        </section>

        <section className="landing-section learning-section" id="how-it-works">
          <div className="section-intro"><div><div className="landing-kicker"><span /> A BETTER WAY TO GROW</div><h2>Not just more learning.<br /><span>Learning that goes somewhere.</span></h2></div><p>We bring the right people, useful skills, and real practice together—so your next step feels a little closer.</p></div>
          <div className="benefit-grid">{benefits.map(({ icon: Icon, title, text, tone }, index) => <article className="benefit-card" key={title}><div className={`benefit-icon ${tone}`}><Icon size={20} /></div><span className="benefit-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="landing-section courses-landing" id="courses">
          <div className="section-intro courses-intro"><div><div className="landing-kicker"><span /> PICK A PLACE TO BEGIN</div><h2>Skills worth<br /><span>showing up for.</span></h2></div><a className="all-courses-link" href="/dashboard">Explore all courses <ArrowRight size={15} /></a></div>
          {apiUnavailable && <div className="catalog-note">Showing a few favorites while the live course catalog is unavailable.</div>}
          <div className="featured-courses">{courses.map((course, index) => <article className={`featured-course ${course.tone}`} key={course.title}><a href="/dashboard" className="featured-course-link" aria-label={`Explore ${course.title}`}><div className="featured-image"><img src={course.image} alt="" loading="lazy" /><span className="featured-course-index">0{index + 1} / 03</span><span className="featured-arrow"><ArrowUpRight size={19} /></span></div><div className="featured-info"><span className="featured-category">{course.category}</span><h3>{course.title}</h3><div className="featured-meta"><span>{course.duration} · Expert led</span><span><Star size={13} fill="currentColor" /> {course.rating}</span></div></div></a></article>)}</div>
          <div className="course-bottom-cta"><span>There’s a course for the direction you’re headed.</span><a href="/dashboard">Find your direction <ArrowRight size={15} /></a></div>
        </section>

        <section className="story-section" id="stories">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85" alt="Learners sharing ideas around a table" /><div className="story-image-tag"><span /> REAL PEOPLE. REAL PROGRESS.</div></div>
          <div className="story-copy"><div className="landing-kicker"><span /> MADE FOR YOUR MOMENT</div><h2>Your next chapter<br />doesn’t write <span>itself.</span></h2><p>Start with one skill. Find your people. Make a little progress every week. You don’t need it all figured out to begin.</p><div className="story-quote"><div className="quote-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><blockquote>“I stopped waiting until I felt ready. The projects helped me prove I already was.”</blockquote><span>RIYA M. · PRODUCT DESIGNER</span></div><a href="/dashboard" className="story-link">Start learning <ArrowRight size={15} /></a></div>
        </section>

        <section className="closing-cta"><div className="cta-decoration">S</div><div className="landing-kicker"><span /> THE FIRST STEP IS YOURS</div><h2>Curiosity looks good<br />on <span>you.</span></h2><p>Find a course, meet a mentor, and see what you can make happen.</p><button onClick={() => setAuthMode('join')}>Join Skillpath <ArrowUpRight size={16} /></button></section>
      </main>

      <footer className="marketing-footer"><a className="inline-flex items-center gap-[9px] font-[Manrope] text-[15px] font-extrabold tracking-[-.8px] text-[#fbfaff] no-underline" href="/" aria-label="Skillpath home"><span className="grid size-[26px] place-items-center rounded-[8px] bg-[#7658e8] text-white"><GraduationCap size={18} /></span><span>skillpath<span className="text-[#b19dff]">.</span></span></a><span>Good things happen when you keep learning.</span><div><a href="#courses">Courses</a><a href="#how-it-works">How it works</a><a href="#stories">Our learners</a></div><small>© 2026 Skillpath Learning, Inc.</small></footer>

      {notice && <div className="marketing-toast"><Check size={16} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}
      {authMode && <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(''); }}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" aria-label="Close dialog" onClick={() => setAuthMode('')}><X size={17} /></button><div className="auth-symbol"><GraduationCap size={22} /></div><div className="landing-kicker"><span /> YOUR NEXT CHAPTER</div><h2 id="auth-title">{authMode === 'login' ? 'Welcome back.' : 'Make room for what’s next.'}</h2><p>{authMode === 'login' ? 'Pick up right where you left off.' : 'Create your free account and start exploring.'}</p><form onSubmit={submitAuth}><label>Email address<input type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input type="password" placeholder="At least 8 characters" minLength="8" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required /></label><button className="auth-submit" type="submit">{authMode === 'login' ? 'Login' : 'Join now'} <ArrowRight size={15} /></button></form><div className="auth-demo-note">Demo form only — account authentication isn’t connected yet.</div><button className="auth-switch" onClick={() => setAuthMode(authMode === 'login' ? 'join' : 'login')}>{authMode === 'login' ? 'New to Skillpath? Join now' : 'Already learning with us? Login'}</button></section></div>}
    </div>
  );
}

export default HomePage;
