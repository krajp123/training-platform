import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, MessageCircle, PhoneCall, Search, Star, TrendingUp } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';

const courses = [
  {
    title: 'BIM Professional Program',
    level: 'Foundation',
    description: 'Build practical BIM foundations through guided exercises and industry workflows.',
    duration: '1 month',
    hours: '20 hours',
    price: '₹4,999',
    rating: '4.8',
    interested: '120+',
    image: '/images/course-guidance-1.png',
    type: 'BIM',
  },
  {
    title: 'BIM Professional Program',
    level: 'Career Track',
    description: 'Develop job-ready BIM skills with project-based learning and expert guidance.',
    duration: '6 months',
    hours: '120 hours',
    price: '₹24,999',
    rating: '4.8',
    interested: '240+',
    image: '/images/course-guidance-2.png',
    type: 'BIM',
  },
  {
    title: 'BIM Professional Program',
    level: 'Advanced',
    description: 'Build advanced BIM expertise through a year-long learning path for AEC careers.',
    duration: '1 year',
    hours: '240 hours',
    price: '₹39,999',
    rating: '4.8',
    interested: '180+',
    image: '/images/course-guidance-3.png',
    type: 'BIM',
  },
];

const programTabs = ['All courses', 'BIM', 'Computational design'];
const levels = ['All levels', ...new Set(courses.map((course) => course.level))];

function CoursesPage() {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('All courses');
  const [level, setLevel] = useState('All levels');

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery = !normalizedQuery
        || `${course.title} ${course.level} ${course.description}`.toLowerCase().includes(normalizedQuery);
      const matchesProgram = program === 'All courses' || course.type === program;
      const matchesLevel = level === 'All levels' || course.level === level;
      return matchesQuery && matchesProgram && matchesLevel;
    });
  }, [level, program, query]);

  const resetFilters = () => {
    setQuery('');
    setProgram('All courses');
    setLevel('All levels');
  };

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#12243a]">
      <div className="relative h-[72px] bg-[#10101b] max-[720px]:h-[62px]">
        <Navbar onAuth={(mode) => window.location.assign(mode === 'join' ? '/?join=1' : '/login')} />
      </div>

      <main>
        {/* Header: brand colour at the top, fading smoothly into white */}
        <section className="bg-[linear-gradient(180deg,#4a359f_0%,#5e48b8_26%,#8c7bd6_50%,#c9c1ee_72%,#ece9f9_90%,#ffffff_100%)]">
          <div className="mx-auto max-w-[1320px] px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-12">
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-16">
              <div>
                <h1 className="m-0 font-[Manrope] text-[clamp(2rem,3.6vw,2.75rem)] font-bold leading-tight tracking-[-.03em] text-white">
                  Course Catalogue
                </h1>
                <p className="mb-0 mt-3 max-w-[600px] text-base leading-7 text-white/90">
                  Interactive live and self-paced courses with individual attention from industry professionals.
                </p>
                <a
                  className="mt-4 inline-flex items-center gap-2 text-base font-medium !text-white no-underline hover:underline"
                  href="tel:08069289001"
                >
                  <PhoneCall size={16} aria-hidden="true" /> 08069289001
                </a>
              </div>

              <form
                role="search"
                className="flex h-12 overflow-hidden rounded-md bg-white shadow-[0_6px_20px_#2a1d6a33] lg:mt-2"
                onSubmit={(event) => event.preventDefault()}
              >
                <label className="flex min-w-0 flex-1">
                  <span className="sr-only">Search courses</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-4 text-base text-[#18324a] outline-none placeholder:text-[#8994a4]"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="What do you want to learn today?"
                  />
                </label>
                <button
                  className="grid w-16 place-items-center bg-[#2b2060] text-white transition-colors hover:bg-[#1d1546] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                  type="submit"
                  aria-label="Search courses"
                >
                  <Search size={20} aria-hidden="true" />
                </button>
              </form>
            </div>

            <div className="mt-16 w-full max-w-[240px]">
              <label htmlFor="course-level" className="block text-sm font-semibold uppercase tracking-wide text-[#2b2250]">
                Course level
              </label>
              <div className="relative mt-3">
                <select
                  id="course-level"
                  className="h-11 w-full appearance-none rounded-md border border-[#d9d5e5] bg-white pl-4 pr-10 text-base text-[#18324a] outline-none focus:border-[#6048b7] focus:ring-2 focus:ring-[#6048b7]/30"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                >
                  {levels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4b5b6e]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs + course grid */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-8">
            <div className="border-b border-[#dcdce3]">
              <nav className="flex gap-7 overflow-x-auto overflow-y-hidden" aria-label="Course categories">
                {programTabs.map((tab) => {
                  const active = program === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setProgram(tab)}
                      className={`shrink-0 border-b-2 pb-3 pt-2 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6048b7] ${active ? 'border-[#6048b7] font-bold text-[#6048b7]' : 'border-transparent font-medium text-[#273b52] hover:text-[#6048b7]'}`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 2 -> 3 -> 4 -> 6 cards per row as the screen grows */}
            <div className="mt-6 grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 min-[820px]:grid-cols-4 min-[1100px]:grid-cols-6">
              {visibleCourses.map((course) => (
                <article
                  key={`${course.title}-${course.level}`}
                  className="flex flex-col overflow-hidden rounded-lg border border-[#e2e2ea] bg-white transition-shadow duration-200 hover:shadow-[0_8px_24px_#1d1a3a1f]"
                >
                  <div className="relative aspect-[8/5] overflow-hidden bg-[#ebe8f5]">
                    <img className="h-full w-full object-cover" src={course.image} alt="" loading="lazy" />
                    <span className="absolute left-2 top-2 rounded-sm bg-[#c92727] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Live course
                    </span>
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#273b52] shadow-sm">
                      <Star size={11} className="fill-amber-400 text-amber-500" aria-hidden="true" /> {course.rating}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <span className="w-fit rounded bg-[#f0ecfb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6048b7]">
                      {course.level}
                    </span>
                    <h2 className="m-0 mt-2 font-[Manrope] text-[14px] font-bold leading-[1.35] text-[#112e49]">
                      {course.title}
                    </h2>
                    <p className="mb-0 mt-1.5 line-clamp-3 min-h-[48px] text-[11.5px] leading-[1.45] text-[#687789]">
                      {course.description}
                    </p>
                    <p className="mb-0 mt-2.5 flex items-center gap-1.5 text-[11px] text-[#6b7686]">
                      <TrendingUp size={13} className="shrink-0 text-[#2f9e8a]" aria-hidden="true" />
                      {course.interested} interested
                    </p>

                    <dl className="m-0 mt-3 grid grid-cols-2 gap-2 border-t border-[#edf0f4] pt-3">
                      <div>
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-[#97a0ad]">Hours</dt>
                        <dd className="m-0 mt-0.5 text-xs font-bold text-[#263d55]">{course.hours}</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-[#97a0ad]">Duration</dt>
                        <dd className="m-0 mt-0.5 text-xs font-bold text-[#263d55]">{course.duration}</dd>
                      </div>
                    </dl>

                    <div className="mt-auto pt-3">
                      <strong className="mb-2 block text-lg text-[#122b45]">{course.price}</strong>
                      <a
                        className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-[#d9d5e5] text-xs font-bold text-[#152d47] no-underline transition-colors hover:border-[#6048b7] hover:bg-[#6048b7] hover:!text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6048b7]"
                        href="/dashboard"
                      >
                        Enroll now
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {visibleCourses.length === 0 && (
              <div className="py-16 text-center">
                <h2 className="m-0 font-[Manrope] text-xl font-bold text-[#112e49]">No courses found</h2>
                <p className="mb-0 mt-2 text-sm text-[#687789]">Try another search or choose a different course type.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-md border border-[#d9d5e5] px-4 py-2 text-sm font-bold text-[#152d47] transition-colors hover:border-[#6048b7] hover:bg-[#6048b7] hover:text-white"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Guidance banner: keeps the page complete even with few courses */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-2xl bg-[linear-gradient(135deg,#17162b_0%,#2a2352_100%)] px-6 py-7 sm:px-9">
              <div className="max-w-[620px]">
                <h2 className="m-0 font-[Manrope] text-xl font-bold tracking-[-.02em] text-white sm:text-2xl">
                  Not sure which program fits you?
                </h2>
                <p className="mb-0 mt-2 text-[15px] leading-relaxed text-[#c5c1d3]">
                  Tell us what you want to learn and our advisors will recommend a program that matches your experience and ambitions.
                </p>
              </div>
              <a
                className="group inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold !text-[#27243a] no-underline transition-colors hover:bg-[#f0ecfb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-[480px]:w-full max-[480px]:justify-center"
                href="https://wa.me/?text=Hi%2C%20I%27d%20like%20help%20choosing%20a%20course."
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Talk to an advisor
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CoursesPage;