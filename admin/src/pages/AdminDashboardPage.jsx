import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, CircleAlert,
  GraduationCap, LayoutDashboard, Pencil, Plus, RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';

const emptyCourse = {
  title: '', category: 'Design', level: 'Beginner', instructor: '',
  duration: '', lessons: 12, price: 999, oldPrice: 1499,
  image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85',
  color: 'lavender',
};

function AdminDashboardPage() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [editingId, setEditingId] = useState(null);
  const [classForm, setClassForm] = useState({ title: '', course: '', instructor: '', time: '', date: '' });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [courseData, classData] = await Promise.all([
        apiRequest('/api/courses'),
        apiRequest('/api/live-classes'),
      ]);
      setCourses(courseData);
      setClasses(classData);
      setClassForm((current) => ({ ...current, course: current.course || courseData[0]?.title || '' }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const updateCourseField = (event) => {
    const { name, value } = event.target;
    setCourseForm((current) => ({ ...current, [name]: value }));
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const savedCourse = await apiRequest(
        editingId ? `/api/courses/${editingId}` : '/api/courses',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseForm),
        },
      );
      setCourses((current) => editingId
        ? current.map((course) => course.id === editingId ? savedCourse : course)
        : [...current, savedCourse]);
      setCourseForm(emptyCourse);
      setEditingId(null);
      setNotice(editingId ? 'Course updated.' : 'Course created.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const startEditing = (course) => {
    setEditingId(course.id);
    setCourseForm({
      title: course.title,
      category: course.category,
      level: course.level,
      instructor: course.instructor,
      duration: course.duration,
      lessons: course.lessons,
      price: course.price,
      oldPrice: course.oldPrice,
      image: course.image,
      color: course.color,
    });
    document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const removeCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}" and its scheduled classes?`)) return;
    setError('');
    try {
      await apiRequest(`/api/courses/${course.id}`, { method: 'DELETE' });
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setClasses((current) => current.filter((item) => item.course !== course.title));
      setNotice('Course deleted.');
      if (editingId === course.id) {
        setCourseForm(emptyCourse);
        setEditingId(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitClass = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const newClass = await apiRequest('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      });
      setClasses((current) => [...current, newClass]);
      setClassForm((current) => ({ ...current, title: '', instructor: '', time: '', date: '' }));
      setNotice('Live class scheduled.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeClass = async (item) => {
    setError('');
    try {
      await apiRequest(`/api/live-classes/${item.id}`, { method: 'DELETE' });
      setClasses((current) => current.filter((liveClass) => liveClass.id !== item.id));
      setNotice('Live class removed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filteredCourses = courses.filter((course) =>
    `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="#dashboard"><span><GraduationCap size={20} /></span> skillpath<span className="brand-period">.</span></a>
        <div className="admin-nav-label">WORKSPACE</div>
        <a className="admin-nav-item active" href="#dashboard"><LayoutDashboard size={17} /> Overview</a>
        <a className="admin-nav-item" href="#courses"><BookOpen size={17} /> Courses <span>{courses.length}</span></a>
        <a className="admin-nav-item" href="#live-classes"><CalendarDays size={17} /> Live classes <span>{classes.length}</span></a>
        <div className="admin-sidebar-bottom"><div className="admin-avatar">AD</div><div><strong>Platform admin</strong><small>Administrator</small></div><ChevronDown size={16} /></div>
      </aside>

      <main className="admin-main" id="dashboard">
        <header className="admin-topbar"><div><span>Pages</span><b>/</b><strong>Admin dashboard</strong></div><a href="http://127.0.0.1:5173" target="_blank" rel="noreferrer">Open learner site <ArrowUpRight size={15} /></a></header>
        <div className="admin-content">
          <section className="admin-welcome"><div><div className="admin-eyebrow">PLATFORM MANAGEMENT</div><h1>Admin dashboard</h1><p>Manage your learning catalog and upcoming classes.</p></div><button className="refresh-button" onClick={refresh}><RefreshCw size={15} /> Refresh data</button></section>

          {error && <div className="admin-alert error-alert"><CircleAlert size={17} /><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
          {notice && <div className="admin-alert success-alert"><Check size={17} /><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}

          <section className="admin-stats">
            <article><span>Total courses</span><strong>{courses.length.toString().padStart(2, '0')}</strong><BookOpen size={18} /></article>
            <article><span>Upcoming classes</span><strong>{classes.length.toString().padStart(2, '0')}</strong><CalendarDays size={18} /></article>
            <article><span>Enrolled learners</span><strong>{courses.reduce((sum, course) => sum + (course.enrolled ? 1 : 0), 0).toString().padStart(2, '0')}</strong><GraduationCap size={19} /></article>
          </section>

          <section className="admin-panel" id="courses">
            <div className="panel-heading"><div><div className="admin-eyebrow">CATALOG</div><h2>Course management</h2></div><span className="panel-count">{courses.length} courses</span></div>
            <form className="course-form" id="course-form" onSubmit={submitCourse}>
              <div className="form-heading"><div><span className="form-icon"><Plus size={16} /></span><strong>{editingId ? 'Edit course' : 'Add a course'}</strong></div>{editingId && <button className="cancel-edit" type="button" onClick={() => { setEditingId(null); setCourseForm(emptyCourse); }}>Cancel edit <X size={13} /></button>}</div>
              <div className="admin-form-grid">
                <label className="field-wide">Course title<input name="title" value={courseForm.title} onChange={updateCourseField} placeholder="e.g. Product Design Fundamentals" required /></label>
                <label>Category<select name="category" value={courseForm.category} onChange={updateCourseField}><option>Design</option><option>Development</option><option>Data Science</option><option>Business</option><option>Marketing</option></select></label>
                <label>Level<select name="level" value={courseForm.level} onChange={updateCourseField}><option>Beginner</option><option>Intermediate</option></select></label>
                <label>Instructor<input name="instructor" value={courseForm.instructor} onChange={updateCourseField} placeholder="Instructor name" required /></label>
                <label>Duration<input name="duration" value={courseForm.duration} onChange={updateCourseField} placeholder="e.g. 8 weeks" required /></label>
                <label>Lessons<input name="lessons" type="number" min="1" value={courseForm.lessons} onChange={updateCourseField} required /></label>
                <label>Price (INR)<input name="price" type="number" min="0" value={courseForm.price} onChange={updateCourseField} required /></label>
                <label>Original price (INR)<input name="oldPrice" type="number" min="0" value={courseForm.oldPrice} onChange={updateCourseField} required /></label>
                <label className="field-wide">Course image URL<input name="image" type="url" value={courseForm.image} onChange={updateCourseField} required /></label>
              </div>
              <button className="primary-button" type="submit">{editingId ? <Pencil size={15} /> : <Plus size={16} />}{editingId ? 'Save changes' : 'Create course'}</button>
            </form>

            <div className="table-toolbar"><div><h3>All courses</h3><span>{courses.length} courses in your catalog</span></div><label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses..." /></label></div>
            <div className="table-scroll"><table><thead><tr><th>COURSE</th><th>CATEGORY</th><th>INSTRUCTOR</th><th>PRICE</th><th>ENROLLED</th><th>ACTIONS</th></tr></thead><tbody>
              {filteredCourses.map((course) => <tr key={course.id}><td><div className="table-course"><img src={course.image} alt="" /><div><strong>{course.title}</strong><span>{course.level} · {course.duration}</span></div></div></td><td><span className={`category-pill ${course.color}`}>{course.category}</span></td><td>{course.instructor}</td><td>₹{Number(course.price).toLocaleString('en-IN')}</td><td><span className="enrolled-pill">{course.enrolled ? 'Yes' : 'No'}</span></td><td><div className="table-actions"><button title="Edit course" onClick={() => startEditing(course)}><Pencil size={15} /></button><button className="delete-action" title="Delete course" onClick={() => removeCourse(course)}><Trash2 size={15} /></button></div></td></tr>)}
              {!loading && filteredCourses.length === 0 && <tr><td className="empty-table" colSpan="6">{courses.length ? 'No matching courses.' : 'No courses available yet.'}</td></tr>}
              {loading && <tr><td className="empty-table" colSpan="6">Loading catalog…</td></tr>}
            </tbody></table></div>
          </section>

          <section className="admin-panel classes-panel" id="live-classes">
            <div className="panel-heading"><div><div className="admin-eyebrow">CLASSROOM</div><h2>Live class schedule</h2></div><span className="panel-count">{classes.length} scheduled</span></div>
            <form className="class-form" onSubmit={submitClass}>
              <label>Class title<input value={classForm.title} onChange={(event) => setClassForm({ ...classForm, title: event.target.value })} placeholder="e.g. Portfolio review" required /></label>
              <label>Course<select value={classForm.course} onChange={(event) => setClassForm({ ...classForm, course: event.target.value })} required>{courses.map((course) => <option key={course.id} value={course.title}>{course.title}</option>)}</select></label>
              <label>Instructor<input value={classForm.instructor} onChange={(event) => setClassForm({ ...classForm, instructor: event.target.value })} placeholder="Instructor name" required /></label>
              <label>Time<input value={classForm.time} onChange={(event) => setClassForm({ ...classForm, time: event.target.value })} placeholder="e.g. 03:00 PM" required /></label>
              <label>Date label<input value={classForm.date} onChange={(event) => setClassForm({ ...classForm, date: event.target.value })} placeholder="e.g. Friday" required /></label>
              <button className="primary-button" type="submit" disabled={!courses.length}><Plus size={16} /> Schedule class</button>
            </form>
            <div className="class-admin-list">{classes.map((item) => <article key={item.id}><div className="schedule-icon"><CalendarDays size={17} /></div><div className="schedule-copy"><strong>{item.title}</strong><span>{item.course} · {item.instructor}</span></div><div className="schedule-time"><strong>{item.time}</strong><span>{item.date}</span></div><button className="delete-class" aria-label={`Remove ${item.title}`} onClick={() => removeClass(item)}><Trash2 size={15} /></button></article>)}{!loading && classes.length === 0 && <div className="empty-classes">No live classes scheduled yet.</div>}</div>
          </section>
          <footer className="admin-footer">Skillpath Admin · Changes are shared with the learner site through the API.</footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
