import React from 'react';
import { ArrowRight, Clock3, MoreHorizontal, Play, Plus, Star } from 'lucide-react';

function CourseCard({ course, onEnroll, onContinue }) {
  return (
    <article className="course-card">
      <div className="course-image-wrap">
        <img className="course-image" src={course.image} alt="" loading="lazy" />
        <span className={`course-category ${course.color}`}>{course.category}</span>
        <button className="course-more" aria-label={`More about ${course.title}`} onClick={onEnroll}>
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="course-body">
        <div className="course-rating">
          <Star size={13} fill="currentColor" />
          <strong>{course.rating}</strong>
          <span>({course.students})</span>
          <span className="level-dot">·</span>
          <span>{course.level}</span>
        </div>
        <h3>{course.title}</h3>
        <div className="course-instructor">
          <div className="avatar avatar-small">{course.initials}</div>
          <span>{course.instructor}</span>
        </div>
        <div className="course-facts">
          <span><Play size={13} /> {course.lessons} lessons</span>
          <span><Clock3 size={13} /> {course.duration}</span>
        </div>
        {course.enrolled && course.progress > 0 && (
          <div className="progress-wrap">
            <div className="progress-label">
              <span>Your progress</span>
              <strong>{course.progress}%</strong>
            </div>
            <div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div>
          </div>
        )}
        <div className="course-bottom">
          <div className="price">
            {course.enrolled
              ? <strong>Enrolled</strong>
              : <><strong>₹{course.price.toLocaleString('en-IN')}</strong><del>₹{course.oldPrice.toLocaleString('en-IN')}</del></>}
          </div>
          <button className={`course-action ${course.enrolled ? 'continue-button' : ''}`} onClick={course.enrolled ? onContinue : onEnroll}>
            {course.enrolled ? <>Continue <ArrowRight size={14} /></> : <>Enroll <Plus size={15} /></>}
          </button>
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
