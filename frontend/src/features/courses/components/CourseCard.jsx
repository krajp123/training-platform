import React from 'react';
import { ArrowRight, Clock3, Heart, MoreHorizontal, Play, ShoppingCart, Star } from 'lucide-react';

function CourseCard({ course, onAddToCart, onBuyNow, onContinue, isWishlisted = false, onToggleWishlist }) {
  return (
    <article className="course-card">
      <div className="course-image-wrap relative">
        <img className="course-image" src={course.image} alt="" loading="lazy" />
        <span className={`course-category ${course.color}`}>{course.category}</span>
        {!course.enrolled && onToggleWishlist && (
          <button
            type="button"
            className="absolute right-11 top-3 grid size-8 place-items-center rounded-full bg-white/95 text-[#7A1F2B] shadow-sm transition hover:scale-105"
            onClick={onToggleWishlist}
            aria-label={`${isWishlisted ? 'Remove' : 'Add'} ${course.title} ${isWishlisted ? 'from' : 'to'} wishlist`}
            aria-pressed={isWishlisted}
          >
            <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        )}
        <button className="course-more" aria-label={`More about ${course.title}`} onClick={onAddToCart}>
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
          {course.enrolled ? (
            <button className="course-action continue-button" onClick={onContinue}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button className="course-action" onClick={onAddToCart}>
                Add to cart <ShoppingCart size={14} />
              </button>
              <button className="course-action" onClick={onBuyNow}>
                Buy now <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
