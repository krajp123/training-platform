import { Router } from 'express';
import { requireAdminRoles } from '../admin-auth/controller.js';
import { getAuthenticatedUser } from '../auth/service.js';
import {
  listAdminEnrollments, listAdminLearners, setEnrollmentProgress, setLearnerStatus,
} from '../admin-workspace/controller.js';
import {
  createContent, createCoupon, createCourseSection, createPublicSupportTicket, createSupportTicket,
  createLesson, createManualEnrollment, createPromotion, deleteContent, deleteCourseSection,
  createReview, deleteLesson, deletePromotion, exportReport, getAnalytics, importCourses,
  listContent, listCourseSections, listCoupons, listPromotions, listPublicContent,
  listReviews, listReviewsPublic, listSettings, listSupportTickets,
  moderateReview, revokeEnrollment, saveSettings,
  sendCampaign, transferEnrollment, updateContent, validateCoupon,
  updateCoupon, updateCourseSection, updateLesson, updateSupportTicket, listLearnerProfile, listCourseContent,
} from './controller.js';

const adminRouter = Router();
const publicRouter = Router();
const supportRouter = Router();
const contactSubmissionWindows = new Map();
const CONTACT_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_MAX_SUBMISSIONS = 5;

function limitContactSubmissions(request, response, next) {
  const now = Date.now();
  const key = request.ip;
  const current = contactSubmissionWindows.get(key);
  const window = current && current.expiresAt > now
    ? current
    : { count: 0, expiresAt: now + CONTACT_WINDOW_MS };
  if (contactSubmissionWindows.size >= 10000) {
    for (const [ip, entry] of contactSubmissionWindows) {
      if (entry.expiresAt <= now) contactSubmissionWindows.delete(ip);
    }
    if (contactSubmissionWindows.size >= 10000 && !contactSubmissionWindows.has(key)) {
      return response.status(503).json({ error: 'Support requests are temporarily unavailable. Please try again later.' });
    }
  }
  if (window.count >= CONTACT_MAX_SUBMISSIONS) {
    return response.status(429).json({ error: 'Too many messages were submitted. Please try again later.' });
  }
  window.count += 1;
  contactSubmissionWindows.set(key, window);

  return next();
}

async function requireLearner(request, response, next) {
  try {
    request.user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    return next();
  } catch (error) {
    return next(error);
  }
}

adminRouter.get('/analytics', requireAdminRoles('owner', 'finance'), getAnalytics);
adminRouter.get('/reports/export', requireAdminRoles('owner', 'finance'), exportReport);

adminRouter.get('/learners', requireAdminRoles('owner', 'course_manager', 'support'), listAdminLearners);
adminRouter.get('/learners/:learnerId', requireAdminRoles('owner', 'course_manager', 'support'), listLearnerProfile);
adminRouter.patch('/learners/:id/status', requireAdminRoles('owner', 'support'), setLearnerStatus);

adminRouter.get('/enrollments', requireAdminRoles('owner', 'course_manager', 'finance', 'support'), listAdminEnrollments);
adminRouter.post('/enrollments', requireAdminRoles('owner', 'course_manager', 'support'), createManualEnrollment);
adminRouter.patch('/enrollments/:id/progress', requireAdminRoles('owner', 'course_manager'), setEnrollmentProgress);
adminRouter.delete('/enrollments/:id', requireAdminRoles('owner', 'course_manager', 'support'), revokeEnrollment);
adminRouter.post('/enrollments/:id/transfer', requireAdminRoles('owner', 'course_manager'), transferEnrollment);

adminRouter.get('/courses/:courseId/sections', requireAdminRoles('owner', 'course_manager'), listCourseSections);
adminRouter.post('/courses/:courseId/sections', requireAdminRoles('owner', 'course_manager'), createCourseSection);
adminRouter.patch('/courses/:courseId/sections/:sectionId', requireAdminRoles('owner', 'course_manager'), updateCourseSection);
adminRouter.delete('/courses/:courseId/sections/:sectionId', requireAdminRoles('owner', 'course_manager'), deleteCourseSection);
adminRouter.post('/courses/:courseId/sections/:sectionId/lessons', requireAdminRoles('owner', 'course_manager'), createLesson);
adminRouter.patch('/courses/:courseId/sections/:sectionId/lessons/:lessonId', requireAdminRoles('owner', 'course_manager'), updateLesson);
adminRouter.delete('/courses/:courseId/sections/:sectionId/lessons/:lessonId', requireAdminRoles('owner', 'course_manager'), deleteLesson);
adminRouter.post('/courses/import', requireAdminRoles('owner', 'course_manager'), importCourses);

adminRouter.get('/coupons', requireAdminRoles('owner', 'course_manager', 'finance'), listCoupons);
adminRouter.post('/coupons', requireAdminRoles('owner', 'course_manager', 'finance'), createCoupon);
adminRouter.patch('/coupons/:id', requireAdminRoles('owner', 'course_manager', 'finance'), updateCoupon);
adminRouter.get('/promotions', requireAdminRoles('owner', 'course_manager'), listPromotions);
adminRouter.post('/promotions', requireAdminRoles('owner', 'course_manager'), createPromotion);
adminRouter.delete('/promotions/:id', requireAdminRoles('owner', 'course_manager'), deletePromotion);

adminRouter.get('/settings', requireAdminRoles('owner'), listSettings);
adminRouter.put('/settings', requireAdminRoles('owner'), saveSettings);
adminRouter.get('/content/:type', requireAdminRoles('owner', 'course_manager', 'support'), listContent);
adminRouter.post('/content/:type', requireAdminRoles('owner', 'course_manager', 'support'), createContent);
adminRouter.patch('/content/:type/:id', requireAdminRoles('owner', 'course_manager', 'support'), updateContent);
adminRouter.delete('/content/:type/:id', requireAdminRoles('owner', 'course_manager', 'support'), deleteContent);
adminRouter.post('/campaigns/send', requireAdminRoles('owner', 'support'), sendCampaign);

adminRouter.get('/support/tickets', requireAdminRoles('owner', 'support'), listSupportTickets);
adminRouter.patch('/support/tickets/:id', requireAdminRoles('owner', 'support'), updateSupportTicket);
adminRouter.get('/reviews', requireAdminRoles('owner', 'course_manager', 'support'), listReviews);
adminRouter.patch('/reviews/:id', requireAdminRoles('owner', 'support'), moderateReview);

publicRouter.get('/content', listPublicContent);
publicRouter.get('/courses/:courseId/content', listCourseContent);
publicRouter.get('/courses/:courseId/reviews', listReviewsPublic);
publicRouter.post('/coupons/validate', validateCoupon);
supportRouter.post('/tickets', requireLearner, createSupportTicket);
supportRouter.post('/contact', limitContactSubmissions, createPublicSupportTicket);
supportRouter.post('/reviews', requireLearner, createReview);

export { adminRouter, publicRouter, supportRouter };
