import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Clock3, Search, Star } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';

const courses = [
  {
    title: 'BIM Professional Program',
    level: 'Foundation',
    description: 'Build practical BIM foundations through guided exercises.',
    duration: '1 month',
    hours: '20 hours',
    price: '₹4,999',
    rating: '4.8',
    interested: '120+',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    type: 'BIM',
    enrolled: true,
    progress: 42,
  },
  {
    title: 'BIM Professional Program',
    level: 'Career Track',
    description: 'Develop job-ready BIM skills with project-based learning.',
    duration: '6 months',
    hours: '120 hours',
    price: '₹24,999',
    rating: '4.8',
    interested: '240+',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    type: 'BIM',
  },
  {
    title: 'BIM Professional Program',
    level: 'Advanced',
    description: 'Build advanced BIM expertise through a year-long learning path.',
    duration: '1 year',
    hours: '240 hours',
    price: '₹39,999',
    rating: '4.8',
    interested: '180+',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    type: 'BIM',
  },
];

const levels = ['All levels', ...new Set(courses.map((course) => course.level))];

function CourseCard({ course, enrolled = false }) {
  return (
    <article className={`flex overflow-hidden rounded-xl border border-[#e1e4eb] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#c9c1ee] hover:shadow-[0_8px_20px_rgba(27,39,58,0.08)] ${enrolled ? 'max-w-[520px] flex-row max-[520px]:flex-col' : 'flex-col'}`}>
      <img className={enrolled ? 'h-[150px] w-[160px] shrink-0 object-cover max-[520px]:h-28 max-[520px]:w-full' : 'h-[120px] w-full object-cover'} src={course.image} alt="" loading="lazy" />
      <div className="flex flex-1 flex-col p-3.5">
        <div className={`flex items-center justify-between gap-3 ${enrolled ? 'hidden' : ''}`}>
          <span className="rounded-full bg-[#f1effb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6048b7]">{course.level}</span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#687789]"><Star size={12} className="fill-amber-400 text-amber-500" /> {course.rating}</span>
        </div>
        {enrolled && <span className="text-[11px] font-semibold text-[#65728a]">The Complete BIM Professional Program</span>}
        <h3 className={`${enrolled ? 'mt-1' : 'mt-2.5'} font-[Manrope] text-[15px] font-bold leading-[1.2] text-[#112e49]`}>{enrolled ? 'Continue with your course' : course.title}</h3>
        <p className={`mt-1.5 text-xs leading-5 text-[#687789] ${enrolled ? 'hidden' : ''}`}>{course.description}</p>
        <div className={`mt-3 flex gap-4 border-t border-[#edf0f4] pt-3 text-[11px] font-semibold text-[#687789] ${enrolled ? 'hidden' : ''}`}>
          <span className="flex items-center gap-1"><Clock3 size={13} /> {course.duration}</span>
          <span className="flex items-center gap-1"><BookOpen size={13} /> {course.hours}</span>
        </div>
        {!enrolled && <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-[#a9dfe0] bg-[#e1f7f5] px-2 py-0.5 text-[10px] font-bold text-[#19727b]">Bestseller</span>
          <span className="rounded border border-[#dfe3ea] px-2 py-0.5 text-[10px] font-medium text-[#788598]">Course</span>
          <span className="rounded border border-[#eadfbd] bg-[#fffaf0] px-2 py-0.5 text-[10px] font-bold text-[#c98718]"><Star size={10} className="mr-0.5 inline fill-current" /> {course.rating}</span>
        </div>}
        {enrolled ? (
          <div className="mt-auto pt-3.5">
            <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-[#687789]"><span>Your progress</span><span>{course.progress}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeef5]"><div className="h-full rounded-full bg-[#6048b7]" style={{ width: `${course.progress}%` }} /></div>
            <a className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-[#6048b7] text-xs font-bold text-white no-underline transition hover:bg-[#49339b]" href="/dashboard">Continue learning <ArrowRight size={14} /></a>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <strong className="text-base text-[#122b45]">{course.price}</strong>
            <a className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#8144ee] px-3.5 text-xs font-bold text-[#6b31d7] no-underline transition hover:bg-[#8144ee] hover:text-white" href="/dashboard">Add to cart</a>
          </div>
        )}
      </div>
    </article>
  );
}

function CoursesPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All levels');
  const enrolledCourses = courses.filter((course) => course.enrolled);

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery = !normalizedQuery || `${course.title} ${course.level} ${course.description}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (level === 'All levels' || course.level === level);
    });
  }, [level, query]);

  const courseSections = [
    { title: 'All courses', items: visibleCourses },
    { title: 'BIM Learning Pathways', items: visibleCourses.filter((course) => course.type === 'BIM') },
    { title: 'Computational design', items: visibleCourses.filter((course) => course.type === 'Computational design') },
  ];

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#12243a]">
      <div className="h-[72px] bg-[#10101b] max-[720px]:h-[62px]">
        <Navbar />
      </div>
      <main className="mx-auto max-w-[1180px] px-5 pb-10 sm:px-7">
        <section className="border-b border-[#edf0f4] py-7 sm:py-9">
          <div className="mt-2.5 flex flex-wrap items-start justify-between gap-4">
            <div><h1 className="m-0 font-[Manrope] text-[clamp(1.7rem,3vw,2.35rem)] font-bold tracking-[-.04em] text-[#112e49]">Empower Your Future with Industry-Ready Skills.</h1><p className="mb-0 mt-1.5 max-w-2xl text-sm leading-6 text-[#687789]">Explore expert-led courses designed to build real-world skills, enhance your knowledge, and accelerate your career growth.</p></div>
            <label className="mt-2 flex h-10 w-full max-w-[300px] items-center gap-2.5 rounded-md border border-[#dfe3ea] px-3 shadow-sm focus-within:border-[#6048b7]"><Search size={16} className="text-[#8290a0]" /><span className="sr-only">Search courses</span><input className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#9aa4b1]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses" /></label>
          </div>
        </section>

        <section className="py-7" aria-labelledby="my-course-title">
          <div className="mb-6 flex items-end justify-between gap-4"><div><h2 id="my-course-title" className="m-0 font-['DM_Sans',_sans-serif] text-[32px] font-bold leading-tight tracking-[-.035em] text-[#182b49]">Continue Your learning...</h2></div></div>
          <div className="grid max-w-[520px] gap-4">{enrolledCourses.map((course) => <CourseCard key={course.title} course={course} enrolled />)}</div>
        </section>

        <section className="pt-7" aria-labelledby="all-courses-title">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><h2 id="all-courses-title" className="m-0 font-['DM_Sans',_sans-serif] text-2xl font-bold tracking-[-.025em] text-[#182b49]">More courses for you</h2></div>
            <select className="h-9 rounded-md border border-[#dfe3ea] bg-white px-2.5 text-xs text-[#34495e] outline-none focus:border-[#6048b7]" value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by course level">{levels.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="mt-6 space-y-8">
            {courseSections.map((section) => (
              <section key={section.title} aria-labelledby={`${section.title}-title`}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 id={`${section.title}-title`} className="m-0 font-[Manrope] text-base font-bold text-[#112e49]">{section.title}</h3>
                </div>
                {section.items.length > 0 ? (
                  <div className="grid max-w-[960px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((course) => <CourseCard key={`${section.title}-${course.title}-${course.level}`} course={course} />)}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-[#f1dfb3] bg-[#fff9e9] px-3 py-2.5 text-xs font-medium text-[#88651d]" role="status">
                    <AlertCircle size={15} className="shrink-0 text-[#d99b22]" />
                    <span>New courses are coming soon. Stay tuned!</span>
                  </div>
                )}
              </section>
            ))}
            {visibleCourses.length === 0 && <div className="py-6 text-center"><CheckCircle2 className="mx-auto text-[#6048b7]" /><h3 className="mt-2 font-[Manrope] text-base font-bold text-[#112e49]">No courses found</h3><p className="mt-1 text-xs text-[#687789]">Try a different search or filter.</p></div>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default CoursesPage;

