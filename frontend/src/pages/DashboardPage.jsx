import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, Bell, BookOpen, Check, ChevronDown, ChevronRight,
  Clock3, Compass, CreditCard, GraduationCap, LayoutDashboard, Menu, MoreHorizontal,
  Play, Search, ShieldCheck, Sparkles, Star, Video, X,
} from 'lucide-react';
import CourseCard from '../components/courses/CourseCard.jsx';
import DashboardSidebar from '../components/layout/DashboardSidebar.jsx';
import '../styles/dashboard.css';
import { getJson, postJson } from '../services/api.js';

function DashboardPage() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeCategory, setActiveCategory] = useState('All courses');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All levels');
  const [showFilter, setShowFilter] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [courseList, setCourseList] = useState([]);
  const [toast, setToast] = useState('');
  const [modalCourse, setModalCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    let active = true;
    Promise.all([
      getJson('/api/courses'),
      getJson('/api/live-classes'),
    ]).then(([loadedCourses, loadedClasses]) => {
      if (!active) return;
      setCourseList(loadedCourses);
      setClasses(loadedClasses);
      setLoadError('');
    }).catch((error) => {
      if (!active) return;
      setLoadError(error.message);
    }).finally(() => {
      if (active) setLoadingCourses(false);
    });
    return () => { active = false; };
  }, []);

  const enrolled = courseList.filter((course) => course.enrolled);
  const visibleCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courseList.filter((course) => {
      const matchesCategory = activeCategory === 'All courses' || course.category === activeCategory;
      const matchesSearch = !query || `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query);
      const matchesLevel = filter === 'All levels' || course.level === filter;
      const matchesPage = activeNav !== 'My learning' || course.enrolled;
      return matchesCategory && matchesSearch && matchesLevel && matchesPage;
    });
  }, [activeCategory, activeNav, courseList, filter, search]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const selectNav = (label) => {
    setActiveNav(label);
    setMenuOpen(false);
    if (label === 'Live classes') document.getElementById('live-classes')?.scrollIntoView({ behavior: 'smooth' });
    else document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  const buyCourse = async (course) => {
    try {
      const result = await postJson('/api/enrollments', { courseId: course.id });
      setCourseList((current) => current.map((item) => item.id === course.id ? result.course : item));
      setModalCourse(null);
      setActiveNav('My learning');
      notify(`You're enrolled in ${course.title}!`);
    } catch (error) {
      notify(error.message);
    }
  };

  const joinClass = (classItem) => {
    notify(`Class room link for "${classItem.title}" is not configured yet.`);
  };

  return (
    <div className="app-shell">
      <DashboardSidebar
        activeNav={activeNav}
        activeCategory={activeCategory}
        classes={classes}
        menuOpen={menuOpen}
        onNavSelect={selectNav}
        onCategorySelect={(name) => {
          setActiveCategory(name);
          selectNav('Explore courses');
        }}
        onNotify={notify}
      />

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          <div className="breadcrumbs"><span>Pages</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="top-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You’re all caught up!')}><Bell size={19} /><i /></button>
            <div className="top-avatar avatar-user">AK</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line" /> {today.toUpperCase()}</div><h1>{activeNav === 'My learning' ? 'Your learning journey' : 'Good morning, Arjun'} <span className="wave">✦</span></h1><p className="welcome-subtitle">{activeNav === 'My learning' ? 'Pick up where you left off and keep making progress.' : 'Ready to learn something new today?'}</p></div>
            <button className="outline-button" onClick={() => { setActiveNav('Explore courses'); setActiveCategory('All courses'); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}><Compass size={16} /> Explore catalog</button>
          </section>

          <section className="stats-grid" aria-label="Learning statistics">
            <div className="stat-card stat-primary"><div className="stat-top"><span>Courses in progress</span><span className="stat-icon"><BookOpen size={17} /></span></div><div className="stat-value">{enrolled.length.toString().padStart(2, '0')}<span className="stat-total"> / 08</span></div><div className="stat-footer"><span className="trend"><ArrowDownRight size={13} /> Keep it up</span><span>Active courses</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Learning hours</span><span className="stat-icon stat-icon-lavender"><Clock3 size={17} /></span></div><div className="stat-value">24.5<span className="stat-unit"> hrs</span></div><div className="stat-footer"><span className="trend positive">+12.5%</span><span>vs. last month</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Certificates earned</span><span className="stat-icon stat-icon-peach"><ShieldCheck size={17} /></span></div><div className="stat-value">03</div><div className="stat-footer"><span className="trend neutral">You're on a roll</span><span>Keep going!</span></div></div>
            <div className="stat-card stat-streak"><div className="stat-top"><span>Learning streak</span><span className="stat-icon stat-icon-yellow"><Sparkles size={17} /></span></div><div className="stat-value">07<span className="stat-unit"> days</span></div><div className="streak-dots">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <div key={`${day}-${i}`} className={i < 4 ? 'day-done' : ''}><span>{day}</span><b>{i < 4 ? <Check size={12} /> : ''}</b></div>)}</div></div>
          </section>

          <section className="promo-banner">
            <div className="promo-copy"><span className="promo-tag"><Sparkles size={12} /> YOUR NEXT BIG THING</span><h2>Small steps.<br />Big <em>possibilities.</em></h2><p>Build skills that move your career forward.<br />Your next chapter starts here.</p><button className="promo-button" onClick={() => { document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}>Find your course <ArrowRight size={15} /></button></div>
            <div className="promo-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-circle"><GraduationCap size={85} strokeWidth={1.15} /></div><div className="art-pill pill-one"><Play size={13} fill="currentColor" /> Learn by doing</div><div className="art-pill pill-two"><Star size={13} fill="currentColor" /> 4.9 avg rating</div><div className="art-sparkle spark-one">✳</div><div className="art-sparkle spark-two">✦</div><div className="art-sparkle spark-three">✧</div></div>
            <div className="promo-bottom"><span>DESIGNED FOR YOUR NEXT CHAPTER</span><span>01 — 03</span></div>
          </section>

          <section className="content-grid">
            <div className="courses-section" id="courses">
              <div className="section-heading"><div><div className="section-kicker">CURATED FOR YOU</div><h2>{activeNav === 'My learning' ? 'Continue learning' : activeCategory === 'All courses' ? 'Popular courses' : activeCategory + ' courses'}</h2></div><button className="text-link" onClick={() => { setActiveNav('Explore courses'); setActiveCategory('All courses'); setShowAll(!showAll); }}>{showAll ? 'Show less' : 'View all courses'} <ArrowRight size={15} /></button></div>
              <div className="course-controls">
                <div className="filter-tabs"><button className={activeNav !== 'My learning' ? 'selected' : ''} onClick={() => setActiveNav('Explore courses')}>Discover</button><button className={activeNav === 'My learning' ? 'selected' : ''} onClick={() => setActiveNav('My learning')}>My learning <span>{enrolled.length}</span></button></div>
                <div className="filter-wrap"><button className="filter-button" onClick={() => setShowFilter(!showFilter)}><span>{filter}</span><ChevronDown size={15} /></button>{showFilter && <div className="filter-menu">{['All levels', 'Beginner', 'Intermediate'].map((level) => <button key={level} onClick={() => { setFilter(level); setShowFilter(false); }}>{level}{filter === level && <Check size={14} />}</button>)}</div>}</div>
              </div>
              <div className="course-grid">
                {visibleCourses.slice(0, showAll ? visibleCourses.length : 4).map((course) => <CourseCard key={course.id} course={course} onEnroll={() => course.enrolled ? notify('You are already enrolled in this course.') : setModalCourse(course)} onContinue={() => notify(`Opening your next lesson in ${course.title}.`)} />)}
              </div>
              {loadingCourses && <div className="empty-state">Loading courses…</div>}
              {!loadingCourses && loadError && <div className="empty-state"><h3>Could not reach the platform API</h3><p>{loadError} Make sure the backend is running.</p></div>}
              {!loadingCourses && !loadError && visibleCourses.length === 0 && <div className="empty-state"><div><Search size={21} /></div><h3>No courses found</h3><p>Try a different search or choose another category.</p><button onClick={() => { setSearch(''); setFilter('All levels'); setActiveCategory('All courses'); }}>Clear filters</button></div>}
            </div>

            <aside className="right-column">
              <section className="live-card" id="live-classes">
                <div className="live-heading"><div><div className="section-kicker">DON'T MISS OUT</div><h2>Live classes</h2></div><button className="round-arrow" aria-label="View all classes" onClick={() => notify('You’re viewing all upcoming classes.')}><ArrowRight size={16} /></button></div>
                <div className="live-list">
                  {classes.slice(0, 3).map((item) => <div className="live-item" key={item.id}><div className={`class-time ${item.color}`}><strong>{item.time.split(' ')[0]}</strong><span>{item.time.split(' ')[1]} · {item.date}</span></div><div className="class-details"><strong>{item.title}</strong><span>{item.course}</span><div className="class-meta"><div className="avatar avatar-small">{item.initials}</div><span>{item.instructor}</span><span className={`class-status ${item.color}`}>{item.status}</span></div></div><button className={`join-button ${item.color}`} onClick={() => joinClass(item)}>{item.color === 'live' ? <><span className="live-dot" /> Join</> : 'Remind me'}</button></div>)}
                  {classes.length === 0 && <div className="all-caught-up"><Check size={16} /> You're all caught up! Check back for new classes.</div>}
                </div>
                <button className="schedule-link" onClick={() => notify('Your full class schedule is up to date.')}>View full schedule <ArrowRight size={14} /></button>
              </section>
              <section className="learning-tip"><div className="tip-top"><div className="tip-icon"><Sparkles size={16} /></div><span>STUDENT SPOTLIGHT</span><button aria-label="More student spotlights" onClick={() => notify('More stories coming soon.')}><MoreHorizontal size={19} /></button></div><blockquote>“I went from not knowing where to start to landing my first design role in just 4 months.”</blockquote><div className="spotlight-person"><div className="avatar spotlight-avatar">RM</div><div><strong>Riya Mehta</strong><span>Product Designer at Razorpay</span></div><div className="quote-stars"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div></div><div className="story-footer"><span>ALUMNI STORY · 4 MIN READ</span><button aria-label="Read student story" onClick={() => notify('Student story opening soon.')}>Read story <ArrowRight size={13} /></button></div></section>
              <section className="weekly-card"><div className="weekly-head"><span>YOUR WEEK</span><button onClick={() => notify('Showing this week’s activity.')}>This week <ChevronDown size={13} /></button></div><div className="weekly-chart"><div className="chart-y"><span>4h</span><span>2h</span><span>0h</span></div><div className="chart-bars">{[{ d: 'M', h: 38 }, { d: 'T', h: 65 }, { d: 'W', h: 48 }, { d: 'T', h: 84 }, { d: 'F', h: 55 }, { d: 'S', h: 30 }, { d: 'S', h: 15 }].map((item, index) => <div className="chart-day" key={`${item.d}-${index}`}><div className="bar-track"><i style={{ height: `${item.h}%` }} className={index === 3 ? 'bar-highlight' : ''} /></div><span>{item.d}</span></div>)}</div></div><div className="weekly-footer"><span><i /> Study time</span><strong>8.5 hrs <span>this week</span></strong></div></section>
            </aside>
          </section>
          <footer className="page-footer"><span>© 2026 Skillpath Learning, Inc.</span><div><button onClick={() => notify('Help center opening soon.')}>Help center</button><button onClick={() => notify('Privacy policy opening soon.')}>Privacy</button><button onClick={() => notify('Terms opening soon.')}>Terms</button></div></footer>
        </div>
      </main>

      {menuOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      {toast && <div className="toast"><div><Check size={15} /></div>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
      {modalCourse && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalCourse(null); }}><div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close" aria-label="Close checkout" onClick={() => setModalCourse(null)}><X size={18} /></button><div className="checkout-icon"><CreditCard size={22} /></div><div className="section-kicker">SECURE CHECKOUT</div><h2 id="checkout-title">Ready to start learning?</h2><p className="checkout-subtitle">You’re one step away from your next big skill.</p><div className="checkout-course"><img src={modalCourse.image} alt="" /><div><strong>{modalCourse.title}</strong><span>{modalCourse.duration} · {modalCourse.lessons} lessons</span></div></div><div className="checkout-line"><span>Course access</span><span>₹{modalCourse.oldPrice.toLocaleString('en-IN')}</span></div><div className="checkout-line discount"><span>Early learner discount</span><span>− ₹{(modalCourse.oldPrice - modalCourse.price).toLocaleString('en-IN')}</span></div><div className="checkout-total"><strong>Total due today</strong><strong>₹{modalCourse.price.toLocaleString('en-IN')}</strong></div><button className="pay-button" onClick={() => buyCourse(modalCourse)}>Confirm enrollment <ArrowRight size={16} /></button><div className="secure-note"><ShieldCheck size={14} /> Secure checkout · 30-day money-back guarantee</div><p className="demo-notice">Demo checkout — no payment will be collected.</p></div></div>}
    </div>
  );
}

export default DashboardPage;
