import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, LockKeyhole, PlayCircle, Star } from 'lucide-react';
import Navbar from '../../landing/components/Navbar.jsx';
import Footer from '../../landing/components/Footer.jsx';
import { getJson, postJson } from '../../../services/api.js';

function CourseLearningPage() {
  const { courseId } = useParams();
  const [courseContent, setCourseContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState('5');
  const [review, setReview] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [error, setError] = useState('');
  const id = courseId?.replace(/^catalog-/, '');

  useEffect(() => {
    getJson(`/api/platform/courses/${id}/content`)
      .then(setCourseContent)
      .catch((requestError) => setError(requestError.message));
    getJson(`/api/platform/courses/${id}/reviews`)
      .then((result) => setReviews(result.reviews))
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    setError('');
    setReviewMessage('');
    try {
      await postJson('/api/support/reviews', { courseId: Number(id), rating: Number(rating), body: review });
      setReview('');
      setReviewMessage('Thank you. Your review has been submitted for moderation.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] font-['DM_Sans',_sans-serif] text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link className="text-sm font-semibold text-[#7A1F2B]" to="/courses">← Browse courses</Link>
        <header className="mt-5"><p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A1F2B]"><BookOpen size={15} />Course curriculum</p><h1 className="m-0 font-[Manrope] text-3xl font-bold">Your learning path</h1><p className="mt-2 text-sm text-slate-600">{courseContent?.enrolled ? 'All lessons are unlocked for your account.' : 'Preview lessons are available below. Enroll to unlock the full course.'}</p></header>
        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {!courseContent && !error && <p className="mt-6 text-sm text-slate-500">Loading course content…</p>}
        <div className="mt-6 space-y-4">{courseContent?.sections.map((section, index) => <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={section.id}><h2 className="m-0 text-base font-bold">{index + 1}. {section.title}</h2><div className="mt-3 divide-y divide-slate-100">{section.lessons.map((lesson) => <article className="flex flex-wrap items-center justify-between gap-3 py-3" key={lesson.id}><div className="flex min-w-0 items-center gap-3"><PlayCircle className="shrink-0 text-[#7A1F2B]" size={18} /><div><strong className="block text-sm">{lesson.title}</strong>{lesson.description && <span className="mt-1 block whitespace-pre-wrap text-xs leading-5 text-slate-600">{lesson.description}</span>}</div></div><div className="flex items-center gap-3 text-xs text-slate-500">{lesson.durationMinutes ? <span>{lesson.durationMinutes} min</span> : null}{lesson.videoUrl && <a className="font-semibold text-[#7A1F2B]" href={lesson.videoUrl} target="_blank" rel="noreferrer">Open lesson</a>}</div>{lesson.attachments?.map((attachment) => <a className="text-xs text-violet-700 underline" href={attachment.url} key={attachment.url} target="_blank" rel="noreferrer">{attachment.name || 'Attachment'}</a>)}</article>)}{!section.lessons.length && <p className="text-sm text-slate-500">Lessons are being prepared.</p>}</div></section>)}</div>
        {courseContent && !courseContent.enrolled && <aside className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5"><p className="m-0 flex items-center gap-2 text-sm font-semibold text-amber-900"><LockKeyhole size={17} />Sign in and enroll to access full lessons.</p><Link className="rounded-lg bg-[#7A1F2B] px-4 py-2.5 text-sm font-bold text-white no-underline" to="/courses">Explore enrollment</Link></aside>}
        <section className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="m-0 text-base font-bold">Learner reviews</h2>{reviews.length ? <div className="mt-3 space-y-3">{reviews.map((item) => <article className="border-t border-slate-100 pt-3" key={item.id}><p className="m-0 flex items-center gap-1 text-sm font-bold"><Star size={14} className="fill-amber-400 text-amber-500" />{item.rating}/5 <span className="ml-1 font-normal text-slate-500">by {item.userName}</span></p><p className="mb-0 mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p></article>)}</div> : <p className="mb-0 mt-3 text-sm text-slate-500">No approved reviews yet.</p>}</div>
          {courseContent?.enrolled ? <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submitReview}><h2 className="m-0 text-base font-bold">Share your review</h2><label className="block text-xs font-semibold text-slate-600">Rating<select className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label><label className="block text-xs font-semibold text-slate-600">Review<textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required maxLength="4000" rows="3" value={review} onChange={(event) => setReview(event.target.value)} /></label><button className="rounded-lg bg-[#7A1F2B] px-4 py-2 text-sm font-bold text-white">Submit for review</button>{reviewMessage && <p role="status" className="m-0 text-sm text-emerald-700">{reviewMessage}</p>}</form> : <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Enroll in the course to share a review.</p>}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default CourseLearningPage;
